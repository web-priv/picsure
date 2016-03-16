"use strict";

/*global require module*/

var Backbone = require('backbone');
var Invite = require('../models/invite.model');
var U = require('../utils');

var InviteCollection = Backbone.Collection.extend({
    model: Invite,
    userid: "",

    initialize: function (models, opts) {
        this.userid = opts.userid;
    },

    url: function () {
        return U.API_ROOT + "/invite/" + encodeURIComponent(this.userid) + "/";
    }
});

module.exports = InviteCollection;
