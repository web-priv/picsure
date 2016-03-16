"use strict";

/*globals require module*/

var UserView = require('./user.view');
var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');

var UserListView = Backbone.View.extend({
    initialize : function () {
        var that = this;
        this._views = [];
 
        this.listenTo(this.collection, "change", this.onChange);
        this.listenTo(this.collection, "reset", this.onReset);
    },
 
    onChange: function () {
        console.log("user list changed");
        this.render();
    },

    onReset: function () {
        console.log("user list reset");
        this.render();
    },

    render : function () {
        var that = this;

        $(this.el).empty();

        this.collection.each(function (item) {
            var v = new UserView({
                model : item,
                tagName : 'li'
            });

            $(that.el).append(v.render().el);
        });
        return this;
    }
});

module.exports = UserListView;