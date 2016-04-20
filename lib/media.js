"use strict";
/*globals module require*/

/**
   Manages media objects.
*/

var logger = require('plogging').getLogger("albums");
var _db = null;


module.exports = {
    initialize: function (db) {
        _db = db;
    },

    // /album/albumid:/
    listByAlbumid: function (req, res) {
        var albumid = req.params.albumid;
        logger.info("Listing media contents for album: %s", albumid);

        _db.media.find({albumid: albumid}, function (err, docs) {
            if (err) {
                res.status(500).send("oops.");
                throw err;
            }

            if (docs === null) {
                res.status(404).send("could not find any items for albumid " + albumid);
                logger.error("could not find albumid %s", albumid);
                return null;
            }

            res.send(docs);
        });
    },

    get: function (req, res) {
        var mediaid = req.params.mediaid;
        var user = req.user;

        _db.media.findOne({_id: mediaid, userid: user.id}, function (err, doc) {
            if (err) {
                res.status(500).send("oops.");
                throw err;
            }

            if (doc === null) {
                res.status(404).send("could not find matching media item");
                throw err;
            }

            res.send(doc);
        });
    },

    // /api/album/:albumid/
    create: function (req, res, next) {
        var user = req.user;
        var media = req.body;
        var albumid = req.params.albumid;

        media.userid = user.id;
        media.createdOn = new Date().toJSON();

        if (albumid) {
            if (albumid !== media.albumid) {
                return next(new Error("mismatch in albumid path and body"));
            }
            media.albumid = albumid;
        }

        console.log("Create media:", JSON.stringify(media));
        _db.albums.find({_id: albumid}, function (err, docs) {
            if (err) {
                res.status(500).send("oops.");
                throw err;
            }

            if (docs.length < 1) {
                res.status(404).send("No such album:"  + albumid);
                return next(new Error("trying to create media for non existent album: " + req.albumid));
            }

            _db.media.insert(media, function (err, newDoc) {
                if (err) {
                    res.status(500).send("cannot insert media.");
                    return next(err);
                }
                return res.send(newDoc);
            });
        });
    },

    'delete': function (req, res, next) {
        var mediaid = req.params.mediaid;
        var user = req.user;

        _db.media.findOne({_id: mediaid, userid: user.id}, function (err, doc) {

            if (err) {
                return next(err);
            }

            if (doc === null) {
                res.status(404).send("could not find matching media item");
                return next(new Error("could not find matching media item"));
            }

            _db.media.remove({_id: doc._id, userid: user.id}, function (err, numRemoved) {
                if (err) {
                    res.status(500).send("oops.");
                    throw err;
                }

                if (numRemoved !== 1) {
                    logger.error("removed more than one element: %d", numRemoved);
                }

                if (doc.uploadid) {
                    // XXX gross -- reorganize imports
                    var uploads = require('./uploads');
                    uploads.cleanup(doc.uploadid, user.id, function (err) {
                        if (err) {
                            console.error("Error cleaning up uploaded data:", err);
                        }
                    });
                }

                res.status(202).send({});
            });
        });
    },

    update: function (req, res, next) {
        var user = req.user;
        var mediaid = req.params.mediaid;
        var media = req.body;

        _db.media.findOne({_id: mediaid}, function (err, doc) {
            if (err) {
                res.status(500).send("oops.");
                return next(err);
            }

            if (doc === null) {
                res.status(404).send("could not find matching media item");
                return next(err);
            }

            if (doc.userid !== user.id) {
                logger.error("Cannot update someone else's image. media " + mediaid + " belongs to " + doc.userid + " but requesting user is " + user.id);
                res.status(403).send("can't update someone else's image");
                return next(new Error("Canno update someone else's image. image belongs to " + doc.userid));
            }

            delete media._id;
            _db.media.update({_id: mediaid, userid: user.id}, media, {}, function (err, numReplaced) {
                logger.info("Updated %d media docs (id=%s)", numReplaced, mediaid);
                media._id = mediaid;
                res.send(media);
            });
        });
    }
};
