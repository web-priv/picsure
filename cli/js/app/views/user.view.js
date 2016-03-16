"use strict";
/*global require module*/

var $ = require('jquery');
var Backbone = require('backbone');
var template = require('../templates/user.hbs');

Backbone.$ = $;

var UserView = Backbone.View.extend({
    template: template,

    initialize: function (/*options*/) {
    },

    onClose: function () {
    },

    render: function () {
        this.$el.html(template({id: this.model.id}));
        return this;
    }
});

module.exports = UserView;
