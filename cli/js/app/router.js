"use strict";
/*global require module*/

var Backbone = require('backbone');
var HomeView = require('./views/home.view');
var Album = require('./models/album.model');
var AlbumView = require('./views/album.view');

var Router = Backbone.Router.extend({
    routes: {
        'album/:albumid': "showAlbum",
        '*path': 'default'
    },

    initialize: function (options) {
        this.app = options.app;
        this.appView = options.app.appView;
        //this.route('album/:albumid', "showAlbum", this.showAlbum);
    },

    showAlbum: function (albumid) {
        console.log("Album View", albumid);
        var model = new Album({_id: albumid});
        var view = new AlbumView({model: model, app: this.app});
        this.appView.showView(view);
    },

    "default": function () {
        console.log("Default route.");
        var view = new HomeView({app: this.app});
        this.appView.showView(view);
    }
});

module.exports = Router;
