"use strict";
/*global require module _M */
/*jshint es5: true */

var $ = require('jquery');
var Backbone = require('backbone');
var template = require('../templates/myalbums.template.hbs');
var detailsTemplate = require('../templates/album.details.template.hbs');
var AlbumCollection = require('../collections/album.collection');
var Album = require("../models/album.model");
var _ = require('underscore');

Backbone.$ = $;

var AlbumDetailsView = Backbone.View.extend({
    template: detailsTemplate,

    tagName: 'li',
    className: 'album-details-item',

    render: function () {
        var params = _.extend({}, this.model.attributes);
        params.url = "#/album/" + encodeURIComponent(this.model.id);
        params.albumid = this.model.id;
        this.$el.html(this.template(params));
        return this;
    }
});

var MyAlbumsView = Backbone.View.extend({

    template: template,

    events: {
        'click #add-album-button': 'onAddAlbumClick',
        'click .album-details-delete': 'onDeleteClick'
    },

    _getAlbumId: function ($el) {
        return $el.closest('[data-album-id]').attr("data-album-id") || null;
    },

    _getAlbum: function ($el) {
        var albumid = this._getAlbumId($el);
        if (albumid === null) {
            return null;
        }

        var album = this.collection.get(albumid);
        return album;
    },

    onDeleteClick: function (evt) {
        if (evt) {
            evt.preventDefault();
        }
        var album = this._getAlbum($(evt.target));
        if (album) {
            console.log("clicked delete on", album.id, album);
            album.destroy({
                success: function (model) {
                    console.log("album", model.id, "destroyed");
                },
                error: function (model, response) {
                    console.log("album", model.id, "could not be destroyed:", response.responseText);
                }
            });
        } else {
            console.error("cannot retrieve album via attributes", evt.target);
        }
    },

    initialize: function (opts) {
        this.userid = opts.userid;
        this.collection = new AlbumCollection([], {userid: this.userid});
        this.collection.fetch();
        this.listenTo(this.collection, "change", this.onCollectionChange);
        this.listenTo(this.collection, "add", this.onCollectionAdd);
        this.listenTo(this.collection, "remove", this.onCollectionRemove);
        this.listenTo(this.collection, "destroy", this.onCollectionDestroy);
    },

    onClose: function () {
    },

    onCollectionChange: function (p) {
        console.log("myalbums collection change:", p, p.id);
        this.render();
    },

    onCollectionDestroy: function (p) {
        console.log("myalbums collection destroy:", p.id);
        this.render();
    },

    onCollectionAdd: function (p) {
        console.log("myalbums collection add:", p, p.id);
        this.render();
    },

    onCollectionRemove: function (p) {
        console.log("myalbums collection remove", p, p.id);
    },

    _addAlbum: function () {
        var that = this;
        return _M.new_stream().then(function (streamId) {
            return new Album({desc: "no description",
                              createdOn: Date.now(),
                              stream: streamId},
                             {collection: that.collection});
        });
    },

    onAddAlbumClick: function (evt) {
        if (evt) {
            evt.preventDefault();
        }
        var that = this;
        $(evt.target).attr("disabled", "true");

        this._addAlbum().then(function (album) {
            album.save({}, {
                success: function (/* model, response , options */) {
                    console.log("model saved.", album.id, album.get('desc'));
                    that.collection.add([album], {at: 0});
                    $(evt.target).removeAttr("disabled");
                }
            });
        }).catch(function (err) {
            console.error(err);
            $(evt.target).removeAttr("disabled");
        });
    },

    render: function () {
        var that = this;

        this.$el.html(template({}));
        var $list = this.$("#albums-list");
        $list.html();
        this.collection.forEach(function (item) {
            //model is an Album
            console.log("myalbums, render:", item.id, item, that.collection.length);
            var itemView = new AlbumDetailsView({model: item});
            $list.append(itemView.render().el);
        });
        return this;
    }
});

module.exports = MyAlbumsView;
