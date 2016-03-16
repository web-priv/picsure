"use strict";

/*global require module Promise _M */
/*jshint es5:true */

var $ = require('jquery');
var Backbone = require('backbone');
var template = require('../templates/navbar.template.hbs');
var U = require('../utils');

Backbone.$ = $;

var HomeView = Backbone.View.extend({
    el: '#navbar',
    template: template,

    events: {
        'click #start-signin': 'toggleSigningIn',
        'click #cancel-signin': 'toggleSigningIn',
        'click #signout': 'onSignOut',
        'submit #signin-form': 'onSignIn'
    },

    initialize: function (options) {
        this.app = options.app;
        this.signingIn = false;
    },

    render: function () {
        var self = U.getUser();

        this.$el.html(template({
            showSignin: !self,
            signingIn: this.signingIn,
            username: (self) ? self.id : ""
        }));
    },

    doSignIn: function (username) {
        var that = this;
        console.debug("doSignIn username=", username);

        if (!window._M) {
            that.showSignInError("You need to have the Beeswax extension loaded.");
            return;
        }

        return _M.use_keyring(username).then(function () {
            return U.signIn(username).then(function () {
                console.log("doSignIn success.");
                that.enableSignIn(false);
            }).catch(function (error) {
                console.error("error", error);
                that.showSignInError(error.message);
            });
        }).catch(function (err) {
            that.showSignInError(err.code);
            console.error(err);
        });
    },

    doSignOut: function () {
        var that = this;
        console.debug("doSignOut");

        return U.signOut().then(function () {
            console.log("doSignOut success.");
            that.enableSignIn(false);
        }).catch(function (error) {
            console.error("signout error", error);
            that.showSignInError(error.message);
        });
    },

    onSignIn: function (evt) {
        if (evt) {
            evt.preventDefault();
        }
        var username = this.$el.find("[name=username]").val().trim();
        this.doSignIn(username);
        return false;
    },

    onSignOut: function (evt) {
        if (evt) {
            evt.preventDefault();
        }
        this.doSignOut();
    },

    enableSignIn: function (isEnabled) {
        var form;
        this.signingIn = isEnabled;
        this.hideSignInError();
        form = this.$el.find('#signin-form')[0] || null;
        if (form) {
            form.reset();
        }
        this.render();
    },

    toggleSigningIn: function (evt) {
        if (evt) {
            evt.preventDefault();
        }
        this.enableSignIn(!this.signingIn);
    },

    hideSignInError: function () {
        var $form = this.$el.find('#signin-form');
        if ($form) {
            $form.find('.form-group').removeClass("has-error");
            $form.find('.error-label').text("");
        }
    },

    showSignInError: function (msg) {
        var $form = this.$el.find("#signin-form");
        if ($form) {
            $form.find('.error-label').text(msg);
            $form.find('.form-group').addClass("has-error");
        }
    }
});

module.exports = HomeView;
