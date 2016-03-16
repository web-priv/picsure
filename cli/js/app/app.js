"use strict";

/*global require module*/
/*jshint es5:true*/

var Router = require('./router');
var NavBar = require("./views/navbar.view");
var Backbone = require('backbone');
var Faye = require('faye');
var Events = require('./events');
var U = require('./utils');
var $ = require('jquery');

Backbone.$ = $;

function AppView() {
    this.currentView = null;
}

AppView.prototype = {
    showView: function (view) {
        if (this.currentView) {
            this.currentView.close();
        }
        this.currentView = view;
        if (this.currentView) {
            this.currentView.render();
            $("#main").html(this.currentView.el);
        }
    }
};

var App = {
    msgSerial: 0,

    init: function () {
        var _oldSync = Backbone.sync;
        var that = this;

        Backbone.sync = function (method, model, options) {
            options = options || {};

            if (!options.beforeSend && U.getUser()) {
                options.beforeSend = function (xhr) { U._addAuthHeader(xhr); };
            }
            return _oldSync.apply(this, [].slice.apply(arguments));
        };
                    
            
        // Allow views to be closed and swapped without memory leaks.
        Backbone.View.prototype.close = function () {
            this.remove();
            this.unbind();
            if (this.onClose) {
                this.onClose();
            }
        };

        this.client = new Faye.Client(U.getOrigin() + '/msg');
        this.client.addExtension({
            incoming: function (message, callback) {
                //console.log('faye incoming', message);
                callback(message);
            },

            outgoing: function (message, callback) {
                message.ext = message.ext || {};
                if (U.getUser()) {
                    message.ext.token = U.getUser().get('token');
                    message.ext.userid = U.getUser().id;
                }
                //console.log('faye outgoing', message);
                callback(message);
            }
        });

        this.appView = new AppView();
        this.router = new Router({app: this});
        this.userChannel = null;

        Events.on('app:signout', function () {
            if (that.userChannel) {
                console.log("cancel user channel subscription.");
                that.userChannel.cancel();
                that.userChannel = null;
            }
            $("title").text("Picsure");
        });

        Events.on('app:signin', function (data) {
            console.debug("user signed in:", data);
            $("title").text("Picsure - " + U.getUser().id);
            //that.router.navigate(location.hash.substr(1), {trigger: true, replace: true});
            Backbone.history.loadUrl();

            if (that.userChannel) {
                that.userChannel.cancel();
                that.userChannel = null;
            }

            that.userChannel = that.client.subscribe('/users/' + encodeURIComponent(U.getUser().id), function (msg) {
                var msgAgeMs, msgSerial;

                msgAgeMs = (msg.pushTs !== undefined) ? (Date.now() - msg.pushTs) : "n/a";
                msgSerial = (msg.serial !== undefined) ? msg.serial : "n/a";

                console.log("Incoming pubsub message (age " + msgAgeMs + ", serial " + msgSerial + "):", msg);

                if (msg.type === "ext") {
                    if (window._M) {
                        var extMsg = msg.data;
                        console.log("App relay from %s to %s", extMsg.hdr.from, extMsg.hdr.to);
                        window._M.message(extMsg);
                    }
                } else {
                    Events.trigger("app:usermsg", msg);
                }
            });

            that.userChannel.then(
                function () {
                    console.log("subscribed to own user channel");
                },
                function (err) {
                    console.error("could not subscribe:", err);
                }
            );
        });

        if (window._M) {
            window._M.on("message", function (extMsg) {
                console.log("Received message from extension: ", extMsg);
                var dest = extMsg.hdr.to;
                var msgSerial;
                var msg;

                msgSerial = (U.getUser()) ? U.getUser().id + " " + App.msgSerial : "<unknown> " + App.msgSerial;
                App.msgSerial++;
                msg = {
                    type: "ext",
                    pushTs: Date.now(),
                    serial: msgSerial,
                    data: extMsg
                };
                that.client.publish('/users/' + encodeURIComponent(dest), msg, {attempts: 1}).then(function () {
                    console.log("Published message for user: " + dest, msg);
                }, function (err) {
                    console.error("Error publishing messagemessage for user: " + dest, msg, err);
                });
            });
        }

        new NavBar({app: this}).render();
        Backbone.history.start();
    }
};

module.exports = App;
