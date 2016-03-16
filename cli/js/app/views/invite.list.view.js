"use strict";

/*global require module _M Promise */
/*jshint es5: true */

var InviteView = require('./invite.view');
var Backbone = require('backbone');
var $ = require('jquery');

var InviteListView = Backbone.View.extend({

    events: {
        "click button.accept-invite": "onAcceptInviteClick",
        "click button.reject-invite": "onRejectInviteClick"
    },

    _getInviteId: function ($el) {
        return $el.closest('[data-invite-id]').attr("data-invite-id") || null;
    },

    _getInvite: function ($el) {
        var inviteid = this._getInviteId($el);
        if (inviteid === null) {
            return null;
        }
        var invite = this.collection.get(inviteid);
        return invite;
    },

    _acceptInvite: function (invite) {
        return _M.accept_invite(invite.get('msg')).then(function (convid) {
            console.log("convid accepted:", convid);
            invite.set("isAccepted", true);
            return new Promise(function (resolve, reject) {
                invite.save({
                    success: function (model) {
                        console.log("invite", model.id, "accepted");
                        resolve(convid);
                    },
                    error: function (model, response) {
                        console.log("invite", model.id, "could not be accepted:", response.responseText);
                        reject(new Error("bad response:" + response.responseText));
                    }
                });
            });
        });
    },

    onAcceptInviteClick: function (evt) {
        if (evt) { evt.preventDefault(); }
        var invite = this._getInvite($(evt.target));
        var that = this;

        if (invite) {
            console.log("clicked accept on", invite.id, invite);
            that._acceptInvite(invite).catch(function () {}).then(function () {
                that.render();
            });
        } else {
            console.error("cannot retrieve invite via attributes", evt.target);
        }
    },

    _rejectInvite: function (invite) {
        return new Promise(function (resolve, reject) {
            invite.destroy({
                success: function (model) {
                    console.log("invite", model.id, "rejected");
                    resolve(true);
                },
                error: function (model, response) {
                    console.log("invite", model.id, "could not be rejected:", response.responseText);
                    reject(new Error("bad response:" + response.responseText));
                }
            });
        });
    },

    onRejectInviteClick: function (evt) {
        if (evt) { evt.preventDefault(); }
        var invite = this._getInvite($(evt.target));
        var that = this;

        if (invite) {
            console.log("clicked reject on", invite.id, invite);
            this._rejectInvite(invite).catch(function () {}).then(function () {
                that.render();
            });
        } else {
            console.error("cannot retrieve invite via attributes", evt.target);
        }
    },

    initialize : function () {
        this._views = [];
 
        this.listenTo(this.collection, "change", this.onChange);
        this.listenTo(this.collection, "reset", this.onReset);
    },
 
    onChange: function () {
        console.log("invite list changed");
        this.render();
    },

    onReset: function () {
        console.log("invite list reset");
        this.render();
    },

    render : function () {
        var that = this;

        $(this.el).empty();

        this.collection.each(function (item) {
            var v = new InviteView({
                model : item,
                tagName : 'li'
            });

            $(that.el).append(v.render().el);
        });
        return this;
    }
});

module.exports = InviteListView;