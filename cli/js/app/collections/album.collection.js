"use strict";

/*global require module*/


var Backbone = require('backbone');
var Album = require('../models/album.model');
var U = require("../utils");

var AlbumCollection = Backbone.Collection.extend({
    userid: "",
    model: Album,

    initialize: function (models, opts) {
        this.userid = opts.userid;
    },

    url: function () {
        return U.API_ROOT + "/albums/" + encodeURIComponent(this.userid) + "/";
    }
});

module.exports = AlbumCollection;
