/*global require module */
var Backbone = require('backbone');

var UserModel = Backbone.Model.extend({
    defaults: {
        id: "",
        token: ""
    },

    initialize: function () {}
});

module.exports = UserModel;
