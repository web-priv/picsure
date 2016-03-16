"use strict";

/*global require module */
var U = require("../utils");
var Backbone = require('backbone');

var AlbumModel = Backbone.Model.extend({
    defaults: {
        desc: "",
        userid: "",
        createdOn: 0,
        stream: "",

        // friend {id: x, state: "invited|accepted"}
        friends: []
    },

    initialize: function (opts) {

    },

    setInvited: function (username) {
        var farr = this.get("friends");
        var existing = farr.find(function (item) {
            return item.id === username;
        }) || null;

        if (existing) {
            if (existing.state !== "accepted") {
                existing.state = "invited";
            }
        } else {
            farr.push({id: username, state: "invited"});
        }
        this.set("friends", farr);
        return this;
    },

    hasFriend: function (username) {
        var farr = this.get("friends");
        return farr.find(function (item) {
            return item.id === username;
        }) || null;
    },

    idAttribute: "_id",

    url: function () {
        if (this.id === undefined) {
            return this.collection.url();
        } else {
            return U.API_ROOT + "/album/" + encodeURIComponent(this.id);
        }
    }
});

module.exports = AlbumModel;
