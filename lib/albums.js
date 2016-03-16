"use strict";
/*globals module require*/

/**
   Manages the list of currently connected users
*/

var logger = require('plogging').getLogger("albums");
var uuid = require('node-uuid');
var _db = null;


module.exports = {
    initialize: function (db) {
        _db = db;
    },

    //get /album/:albumid
    getAlbum: function (req, res, next) {
        var albumid = req.params.albumid;
        logger.info("Getting album meta %s", albumid);

        _db.albums.findOne({_id: albumid}, function (err, doc) {
            if (err) {
                res.status(500).send("oops.");
                return next(err);
            }
            if (doc === null) {
                res.status(404).send("Could not find album with this id: " + albumid);
                logger.error("Could not find album id: " + albumid);
                return next(err);
            }

            res.send(doc);
        });
    },

    //POST /api/album/:albumid
    update: function (req, res, next) {
        var user = req.user;
        var modelid = req.params.albumid;
        var model = req.body;

        _db.albums.findOne({_id: modelid, userid: user.id}, function (err, doc) {

            if (err) {
                res.status(500).send("oops.");
                return next(err);
            }

            if (!doc) {
                res.status(404).send("could not find matching album item");
                return next(err);
            }

            model._id = modelid;
            model.userid = doc.userid;
            model.createdOn = doc.createdOn;
            _db.albums.update({_id: modelid, userid: user.id}, model, {}, function (err, numReplaced) {
                logger.info("Updated %d album docs (id=%s)", numReplaced, modelid);
                res.send(model);
            });
        });
    },

    'delete': function (req, res) {
        var user = req.user;
        var albumid = req.params.albumid;

        _db.albums.remove({_id: albumid, userid: user.id}, function (err, numRemoved) {
            if (err) {
                res.status(500).send("oops.");
                throw err;
            }
            if (numRemoved !== 1) {
                logger.error("removed more than one element: %d", numRemoved);
            }

            res.status(202).send({});
        });
    },

    list: function (req, res) {
        var userid = req.params.userid;

        if (userid !== req.user.id) {
            res.status(403).send("wrong user.");
            logger.error("can only list your own albums");
            return;
        }

        _db.albums.find({userid: userid}, function (err, docs) {
            if (err) {
                res.status(500).send("oops.");
                throw err;
            }
            res.send(docs);
        });
    },

    create: function (req, res) {
        var user = req.user;
        var album = req.body;
        album.userid = user.id;
        delete album._id;

        _db.albums.insert(album, function (err, newDoc) {
            if (err) {
                res.status(500).send("cannot insert.");
                throw err;
            }
            res.send(newDoc);
        });
    }
};
