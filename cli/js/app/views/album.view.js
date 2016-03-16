"use strict";
/*global require module _M Promise */
/*jshint es5:true */

var $ = require('jquery');
var Backbone = require('backbone');
var template = require('../templates/album.template.hbs');
var MediaCollection = require('../collections/media.collection');
var Media = require('../models/media.model');
var MediaView = require('./media.view');
var Invite = require('../models/invite.model');
var U = require("../utils");
var _ = require("underscore");

Backbone.$ = $;

var AlbumView = Backbone.View.extend({

    template: template,

    events: {
        "click #add-media-button": "onAddMediaClick",
        "click .media-delete": "onMediaDeleteClick",
        "click .album-cancel-edit": "onCancelEditClick",
        "click .album-enable-edit": "onEnableEditClick",
        "click button.album-save-field": "onAlbumSaveFieldClick",
        "click #add-friend-button": "onAddFriendClick"
    },

    _getMedia: function ($el) {
        var mediaid = this._getMediaId($el);
        if (mediaid === null) {
            return null;
        }

        var media = this.collection.get(mediaid);
        return media;
    },

    _getMediaId: function ($el) {
        return $el.closest('[data-media-id]').attr("data-media-id") || null;
    },

    onAlbumSaveFieldClick: function (evt) {
        evt.preventDefault();

        var $input = this.$("form.album-description-form input");
        var newDesc = $input.val();
        var that = this;

        console.log("newVAL", newDesc);
        $(evt.target).attr("disabled", true);
        this.model.save({desc: newDesc || "no description"}, {
            success: function () {
                that.enableEdit(false);
            },
            error: function (model, response) {
                console.error("error saving description:", model, response.responseText);
                that.enableEdit(false);
            }
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
            if (this.isEditing) {
                this.$("form.album-description-form input[type=text]").val(this.model.get("desc"));
            }
        }
    },

    initialize: function (opts) {
        this.app = opts.app;
        this.albumid = this.model.id;
        this.model.fetch({
            reset: true,
            success: function (mod) {
                console.log("album fetched", mod.id);
            },

            error: function (/*mod*/) {
                console.error("album fetch failed.");
            }
        });
                
        this.collection = new MediaCollection([], {albumid: this.albumid});
        this.collection.fetch({
            reset: true,

            success: function (collection) {
                console.log("album media fetched", collection.albumid);
            },

            error: function (collection, response) {
                console.error("album media fetch failed", collection.albumid, response.responseText);
            }
        });

        this.listenTo(this.collection, "change", this.onCollectionChange);
        this.listenTo(this.collection, "add", this.onCollectionAdd);
        this.listenTo(this.collection, "remove", this.onCollectionRemove);
        this.listenTo(this.collection, "sync", this.onCollectionSync);
        this.listenTo(this.collection, "destroy", this.onCollectionDestroy);
        this.listenTo(this.model, "sync", this.onModelSync);
        this.listenTo(this.model, "reset", this.onModelReset);
        this.listenTo(this.model, "change", this.onModelChange);

        this.albumSub = this.app.client.subscribe('/albums/' + encodeURIComponent(this.model.id),
                                                  this.onAlbumMessage.bind(this));

        this.allUsers = this.app.client.subscribe('/users', this.onUsersChange.bind(this));

        this.isEditing = false;
    },

    _getInviteMessage: function (otherUsername) {
        var that = this;
        console.log("inviting", otherUsername, "to conv", this.model.get("stream"));
        if (!U.getUser()) {
            return Promise.reject(new Error("You are not logged in."));
        }

        if (U.getUser().id !== that.model.get("userid")) {
            return Promise.reject(new Error("You are not the owner of that album. Cannot invite other people."));
        }
        return _M.get_friend(otherUsername).then(function (fchan) {
            return _M.invite(fchan, that.model.get("stream"));
        });
    },

    onAddFriendClick: function (evt) {
        if (evt) {
            evt.preventDefault();
        }
        var $select = this.$("#add-friend-select");
        var currentSelection = $select.val();
        var that = this;

        this._getInviteMessage(currentSelection).then(function (inviteMsg) {
            console.log("invite message:", inviteMsg);

            that.app.client.publish('/users/' + encodeURIComponent(currentSelection),
                                    {type: "notification",
                                     data: "new invite"});
            
            that.model.setInvited(currentSelection);
            that.model.save({}, {
                success: function (model) {
                    console.log("model saved.", model, model.get('friends'));
                    that.render();
                }
            });

            var inv = new Invite({
                from: U.getUser().id,
                to: currentSelection,
                albumid: that.model.id,
                msg: inviteMsg
            });

            inv.save({}, {
                success: function (model) {
                    console.log("invite", model.id, "sent");
                },
                error: function (model, response) {
                    console.error("invite could not be saved:", response.responseText);
                }
            });
                
        }).catch(function (err) {
            console.error("could not get invite message:", err);
        });
    },

    onMediaDeleteClick: function (evt) {
        if (evt) {
            evt.preventDefault();
        }

        console.log("onMediaDeleteClick");

        var model = this._getMedia($(evt.target));
        if (model) {
            console.log("clicked delete on", model.id, model);
            model.destroy({
                success: function (model) {
                    console.log("model", model.id, "destroyed");
                },
                error: function (model, response) {
                    console.log("model", model.id, "could not be destroyed:", response.responseText);
                }
            });
        } else {
            console.error("cannot retrieve model via attributes", evt.target);
        }

    },

    onAddMediaClick: function (evt) {
        if (evt) {
            evt.preventDefault();
        }
        this.addNewMedia();
    },

    onModelSync: function () {
        console.log("album meta sync'd");
        this.render();
    },

    onModelReset: function () {
        console.log("album meta reset");
        this.render();
    },

    onModelChange: function () {
        console.log("album meta change");
        this.render();
    },

    onAlbumMessage: function (msg) {
        console.log("Received an album event:", msg);
    },

    onUsersChange: function (msg) {
        var i;
        var $select = this.$("#add-friend-select");
        var currentSelection = $select.val();
        var newOptions = [];
        var friends = this.model.get("friends");

        for (i = 0; i < msg.users.length; i++) {
            var val = msg.users[i].id;
            var existing = this.model.hasFriend(val);
            if (!existing || existing.state !== "accepted") {
                newOptions.push(val);
            }
        }
        newOptions.sort();
        $select.html("");

        for (i = 0; i < newOptions.length; i++) {
            var $opt = $("<option></option");
            $opt.attr("value", newOptions[i]);
            $opt.text(newOptions[i]);
            $select.append($opt);
        }

        // restore selection
        if (newOptions.indexOf(currentSelection) >= 0) {
            $select.val(currentSelection);
        }
    },

    onClose: function () {
        if (this.app) {
            this.app = null;
        }
        if (this.albumSub) {
            this.albumSub.cancel();
        }
        if (this.allUsers) {
            this.allUsers.cancel();
        }
    },

    onCollectionSync: function (p) {
        console.log("album contents sync'd:", p);
        this.render();
    },

    onCollectionDestroy: function (p) {
        console.log("album contents destroyed:", p);
        this.render();
    },

    onCollectionChange: function (p) {
        console.log("album contents changed:", p);
    },

    onCollectionAdd: function (p) {
        console.log("album contents added:", p);
        this.render();
    },

    onCollectionRemove: function (p) {
        console.log("album contents removed:", p);
    },

    addNewMedia: function () {
        if (!U.getUser()) {
            console.error("not logged in"); //fixme
            return;
        }

        var that = this;
        var media = new Media({albumid: this.model.id,
                               userid: U.getUser.id,
                               stream: this.model.get("stream")
                              },
                              {collection: this.collection});
        media.save({}, {
            success: function (model) {
                console.log("media saved.", model.id, model.attributes);
                that.collection.add([model], {at: 0});
            },

            error: function (model, response) {
                console.log("could not save media model", model, "response was:", response.responseText);
            }
        });
    },

    render: function () {
        var attrs = _.extend({}, this.model.attributes);
        attrs.isEditing = this.isEditing;

        var friends = attrs.friends || [];
        function printFriend(fstate) {
            if (fstate.state === "invited") {
                return fstate.id + " (pending)";
            } else {
                return fstate.id;
            }
        }
        var viewers = (friends.length > 0 ? friends.map(printFriend) : ["none"]).join(" ");
        attrs.viewers = viewers;

        this.$el.html(template(attrs));
        var $list = this.$("#media-list");
        $list.html("");

        //each item is a Media model.
        this.collection.forEach(function (item) {
            var itemView = new MediaView({model: item});
            $list.append(itemView.render().el);
        });
        return this;
    }
});

module.exports = AlbumView;
