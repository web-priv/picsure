"use strict";
/*global require module*/

var $ = require('jquery');
var Backbone = require('backbone');
var template = require('../templates/invite.hbs');

Backbone.$ = $;

var InviteView = Backbone.View.extend({
    template: template,

    initialize: function (/*options*/) {
    },

    onClose: function () {
    },

    render: function () {
        this.$el.html(template(this.model.attributes));
        return this;
    }
});

module.exports = InviteView;
