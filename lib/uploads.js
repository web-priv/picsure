"use strict";
/*globals module require*/

/**
   Manages the list of currently connected users
*/

var logger = require('plogging').getLogger("albums");
var pa = require('path');
var _db = null;
var _uploadDir = null;
var uuid = require('node-uuid');
var fs = require('fs');

module.exports = {
    initialize: function (db, uploadDir) {
        _db = db;
        _uploadDir = uploadDir;
    },

    // /api/uploads/:uploadid
    deleteUpload: function (req, res, next) {
        var uploadid = req.params.uploadid;
        var user = req.user;
        module.exports.cleanup(uploadid, user.id, function (err) {
            if (err) {
                return next(err);
            }
            res.status(202).send({});
        });
    },

    // GET /api/uploads/:uploadid
    getFile: function (req, res, next) {
        //var user = req.user;
        var uploadid = req.params.uploadid;

        _db.uploads.findOne({_id: uploadid}, function (err, doc) {
            if (err) {
                logger.error("can't retrieve uploadid %s: %s", uploadid, err);
                return next(err);
            }

            if (!doc) {
                logger.error("cannot find uploadid %s", uploadid);
                res.status(404).send(null);
                return next(new Error("could not find upload: " + uploadid));
            }

            var path = pa.join(_uploadDir, doc.filename);
            res.status(200).sendFile(path);
        });
    },

    upload: function (req, res, next) {
        var user = req.user;
        var meta = JSON.parse(req.body.meta);
        var data = req.body.data;

        var uploadedObj = {
            userid: user.id,
            filename: uuid.v4(),
            originalName: meta.name
        };

        _db.uploads.insert(uploadedObj, function (err, newDoc) {
            if (err) {
                res.status(500).send("cannot insert.");
                return next(err);
            }

            fs.writeFile(pa.join(_uploadDir, uploadedObj.filename), data, function (err) {
                if (err) {
                    logger.error("Error writing upload file: %s", err);
                    return next(err);
                }
                logger.info("File written %s (%dB)", uploadedObj.filename, data.length);
                res.send(newDoc);
            });
        });

    },

    cleanup: function (uploadid, userid, cb) {
        cb = cb || function () {};

        _db.uploads.findOne({_id: uploadid}, function (err, doc) {
            if (err) {
                return cb(err);
            }

            if (!doc) {
                return cb(new Error("could not find matching media item"));
            }
            
            //TODO delete file
            //XXX

            logger.info("Removing upload %s", uploadid);
            _db.uploads.remove({_id: uploadid}, function (err, numRemoved) {
                if (err) {
                    logger.error("oops removing upload: %s", err);
                    return cb(err);
                }

                if (numRemoved !== 1) {
                    logger.error("removed more than one element: %d", numRemoved);
                }
                return cb(null, numRemoved);
            });
        });
    }
};
