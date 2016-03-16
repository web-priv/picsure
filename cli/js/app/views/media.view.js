"use strict";
/*global require module _M Promise*/
/*jshint es5: true */

var $ = require('jquery');
var Backbone = require('backbone');
var template = require('../templates/media.template.hbs');
var Media = require('../models/media.model.js');
var Upload = require('../models/upload.model.js');
var _ = require('underscore');
var U = require('../utils');

Backbone.$ = $;

var MediaView = Backbone.View.extend({
    template: template,

    events: {
        "click .media-enable-edit": "onEnableEditClick",
        "click .media-cancel-edit": "onCancelEditClick",
        "click .media-save-field": "onMediaSaveFieldClick",
        "change div.photo-parea": "onPhotoChange"
    },
    onMediaSaveFieldClick: function (evt) {
        evt.preventDefault();

        var descArea = this.$(".media-description-parent")[0];
        var that = this;

        $(evt.target).attr("disabled", true);

        _M.lighten(descArea).then(function (cipher) {
            that.model.save({desc: cipher || ""}, {
                success: function () {
                    that.enableEdit(false);
                },
                error: function (model, response) {
                    console.error("error saving description:", model, response.responseText);
                    that.enableEdit(false);
                }
            });
        }).catch(function (err) {
            console.error("Error saving description: ", err);
        });
    },

    onCancelEditClick: function (evt) {
        evt.preventDefault();
        this.enableEdit(false);
    },

    onEnableEditClick: function (evt) {
        evt.preventDefault();
        this.enableEdit(true);
    },

    enableEdit: function (isEditing) {
        isEditing = !!isEditing;
        if (this.isEditing !== isEditing) {
            this.isEditing = isEditing;
            console.log("editing mode changed to:", isEditing);
            this.render();
        }
    },

    initialize: function (/*options*/) {
        this.isEditing = false;
    },

    onPhotoChange: function (evt) {
        if (evt) {
            evt.preventDefault();
        }

        var that = this;
        var mediaid = that.model.id;

        console.log("photo changed.");

        var parea = that.$("div.photo-parea")[0];

        _M.lighten(parea).then(function (cipher) {
            that.model.save({state: Media.STATE_UPLOADING}, {
                success: function () {
                    console.log("marked as uploading");
                    console.log(that.model.get("state"));
                },
                error: function (model, response) {
                    console.log("media", model.id, "could not be marked uploading", response.responseText);
                }
            });

            return U.doUpload(cipher, "photoname");
        }).then(function (upload) {
            console.log("uploaded:", upload);
            return new Promise(function (resolve, reject) {
                that.model.save({state: Media.STATE_DONE, uploadid: upload.id}, {
                    success: function () {
                        resolve(true);
                    },
                    error: function (model, response) {
                        reject(new Error("media " + mediaid + " could not be saved with the new cipher file: "  + response.responseText));
                    }
                });
            });
        }).then(function () {
            console.log("save complete. new photo linked into media model " + mediaid);
        }).catch(function error(err) {
            console.error("Could not save new photo to server:", err);
        });
    },
        
    onClose: function () {
    },

    render: function () {
        var attrs = _.extend({}, this.model.attributes);
        var imgsrc = "";
        var that = this;
        var convid = that.model.get("stream");

        var parentDesc  = null;
        var parentPhoto = null;

        attrs.isPhoto = this.model.get('type') === "photo";

        attrs.isEditing = this.isEditing;

        if (attrs.isPhoto) {
            switch (this.model.get('state')) {
            case Media.STATE_DONE:
                imgsrc = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                if (this.model.get("uploadid")) {
                    U.getUploadedFile(this.model.get("uploadid")).then(function (data) {
                        _M.darken(parentPhoto, data).then(function () {
                            console.log("Success displaying image for media item: " + that.model.id);
                        }).catch(function (err) {
                            console.error("Error displaying image for media item: " + that.model.id, err);
                        });
                    })
                    .catch(function (err) {
                        console.error("error loading image", err);
                    });
                }
                break;
            case Media.STATE_UPLOADING:
                imgsrc = "/images/squares.gif";
                break;
            //case Media.STATE_INIT:
            default:
                imgsrc = "/images/no-thumb.png";
                break;
            }
        }

        // fill template
        //console.log("filling template:", template(attrs));
        attrs.imgsrc = imgsrc;
        this.$el.html(template(attrs));

        parentDesc  = that.$(".media-description-parent")[0];
        parentPhoto = that.$("div.photo-parea")[0];

        // private area for media description
        _M.mark_private(parentDesc, convid);
        _M.darken(parentDesc, that.model.get("desc")).then(function () {
            console.debug("description shown successfully.");
        }).catch(function (err) {
            console.error("Photo id=" + that.model.id + " error decrypting description.", err);
        });

        // private area for photo
        // image source will be filled in when the network request completes.
        if (attrs.isPhoto) {
            _M.mark_private(parentPhoto, convid);
        }

        //this.delegateEvents();
        return this;
    }
});

module.exports = MediaView;
