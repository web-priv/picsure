"use strict";

/*global require module*/


var Backbone = require('backbone');
var Media = require('../models/media.model');
var U = require("../utils");

var MediaCollection = Backbone.Collection.extend({
    albumid: "",
    model: Media,

    initialize: function (models, opts) {
        console.log("media collection init", models, opts);
        this.albumid = opts.albumid;
    },

    url: function () {
        return U.API_ROOT + "/album/" + encodeURIComponent(this.albumid) + "/";
    }
});

module.exports = MediaCollection;
