"use strict";

/*global require module */
var U = require("../utils");
var Backbone = require('backbone');

var UploadModel = Backbone.Model.extend({

    defaults: {
        userid: "",
        mediaid: "",
        originalName: "",
        createdOn: 0
    },

    initialize: function () {},

    idAttribute: "_id",

    url: function () {
        if (this.id === undefined) {
            return U.API_ROOT + "/uploads/";
        } else {
            return U.API_ROOT + "/uploads/" + encodeURIComponent(this.id);
        }
    }
});

module.exports = UploadModel;
