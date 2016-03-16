"use strict";

/*global require module */
var U = require("../utils");
var Backbone = require('backbone');

var MediaModel = Backbone.Model.extend({

    defaults: {
        userid: "",
        albumid: "",
        createdOn: 0,
        desc: "",
        stream: "",
        type: "photo",
        state: "init",
        uploadid: ""
    },

    initialize: function () {},

    idAttribute: "_id",

    url: function () {
        if (this.id === undefined) {
            return this.collection.url();
        } else {
            return U.API_ROOT + "/media/" + encodeURIComponent(this.id);
        }
    }
});

module.exports = MediaModel;
MediaModel.STATE_INIT = "init";
MediaModel.STATE_UPLOADING = "uploading";
MediaModel.STATE_DONE = "done";
