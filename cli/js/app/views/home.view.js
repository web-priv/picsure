"use strict";
/*global require module*/

var $ = require('jquery');
var Backbone = require('backbone');
var template = require('../templates/home.template.hbs');
var UserCollection = require('../collections/user.collection');
var UserListView = require('./user.list.view');
var U = require('../utils');
var Events = require('../events');
var MyAlbumsView = require('./myalbums.view');
var InviteCollection = require('../collections/invite.collection');
var InviteListView = require('./invite.list.view');

Backbone.$ = $;

var HomeView = Backbone.View.extend({
    tagName: "div",
    className: "home-view",
    template: template,

    initialize: function (options) {

        this.app = options.app;
        this.allUsers = this.app.client.subscribe('/users', this.onUsersChange.bind(this));
        this.users = new UserCollection([]);
        this.userListView = new UserListView({collection: this.users});

        this._load();

        this.listenTo(Events, 'app:signin', this.onSignIn);
        this.listenTo(Events, 'app:signout', this.onSignOut);
    },

    _load: function () {
        if (U.getUser()) {
            this.myAlbumsView = new MyAlbumsView({userid: U.getUser().id});
            this.invites = new InviteCollection([], {userid: U.getUser().id});
            this.inviteListView = new InviteListView({collection: this.invites});
            this.invites.fetch({reset: true});
        } else {
            this.myAlbumsView = null;
            this.invites = null;
            this.inviteListView = null;
        }
    },

    onSignIn: function (user) {
        this._load();
        this.render();
    },

    onSignOut: function () {
        this._load();
        this.render();
    },

    onUsersChange: function (msg) {
        console.log("users changed", msg);
        this.users.reset(msg.users);
    },

    onClose: function () {
        if (this.app) {
            this.app = null;
        }
        if (this.allUsers) {
            this.allUsers.cancel();
        }
    },

    render: function () {
        var opts = {
            isSignedIn: !!U.getUser()
        };
            
        this.$el.html(template(opts));

        if (this.userListView) {
            this.userListView.setElement(this.$("#users-online-list")).delegateEvents().render();
        }

        if (this.myAlbumsView) {
            this.myAlbumsView.setElement(this.$("#myalbums")).delegateEvents().render();
        }

        if (this.inviteListView) {
            this.inviteListView.setElement(this.$("#myinvites")).delegateEvents().render();
        }
    }
});

module.exports = HomeView;
