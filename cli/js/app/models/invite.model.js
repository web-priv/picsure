"use strict";

/*global require module */
var Backbone = require('backbone');
var U = require("../utils");

var InviteModel = Backbone.Model.extend({
    defaults: {
        from: "",
        to: "",
        albumid: "",
        isAccepted: false,
        msg: null
    },

    idAttribute: "_id",

    url: function () {
        if (this.id === undefined) {
            return U.API_ROOT + "/invite/" + encodeURIComponent(U.getUser().id) + "/";
        } else {
            return U.API_ROOT + "/invite/" + encodeURIComponent(this.id);
        }
    },

    initialize: function () {}
});

module.exports = InviteModel;
