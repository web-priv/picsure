"use strict";
/*globals module require*/
/*jshint es5:true*/

/**
   Manages media objects.
*/

var logger = require('plogging').getLogger("invites");
var _db = null;

// add {id: username, state: "accepted"} to an array of friends on the
// album model.

function _setAccepted(username, fArr) {
    fArr = fArr || [];
    var existing = fArr.find(function (item) {
        return item.id === username;
    }) || null;
    if (existing) {
        existing.state = "accepted";
    } else {
        fArr.push({id: username, state: "accepted"});
    }
    return fArr;
}



module.exports = {
    initialize: function (db) {
        _db = db;
    },

    /* GET /api/invite/ */
    list: function (req, res, next) {
        var user = req.user;

        _db.invites.find({to: user.id}, function (err, docs) {
            if (err) {
                res.status(500).send("oops.");
                return next(new Error("error querying db"));
            }

            res.send(docs);
        });
    },

    /* GET /api/invites/:inviteid */
    get: function (req, res, next) {
        var inviteid = req.params.inviteid;
        var user = req.user;

        _db.media.findOne({_id: inviteid}, function (err, doc) {
            if (err) {
                res.status(500).send("oops.");
                return next(err);
            }

            if (doc === null) {
                res.status(404).send("could not find matching item");
                return next(new Error("no matching item"));
            }

            if (doc.from !== user.id && doc.to !== user.id) {
                res.status(403).send("not your business");
                return next(new Error("User " + user.id + " does not match from: or to:"));
            }

            res.send(doc);
        });
    },

    // /api/invite/
    create: function (req, res, next) {
        var user = req.user;
        var invite = req.body;
        var albumid = invite.albumid;

        invite.from = user.id;
        invite.createdOn = new Date().toJSON();

        console.log("Create invite:", JSON.stringify(invite));
        _db.albums.find({_id: albumid}, function (err, docs) {
            if (err) {
                res.status(500).send("oops.");
                return next(new Error("error querying db"));
            }

            if (docs.length < 1) {
                res.status(404).send("No such album:"  + albumid);
                return next(new Error("trying to create invite for non existent album: " + albumid));
            }

            _db.invites.insert(invite, function (err, newDoc) {
                if (err) {
                    res.status(500).send("cannot insert invite.");
                    return next(err);
                }
                return res.send(newDoc);
            });
        });
    },

    'delete': function (req, res, next) {
        var objid = req.params.inviteid;
        var user = req.user;

        logger.info("DELETE invite: userid: " + user.id + " inviteid: " + objid);

        _db.invites.remove({_id: objid, to: user.id}, function (err, numRemoved) {
            if (err) {
                res.status(500).send("oops.");
                return next(err);
            }

            if (numRemoved !== 1) {
                logger.error("removed more than one element: %d", numRemoved);
            }

            res.status(202).send({});
        });
    },

    update: function (req, res, next) {
        var user = req.user;
        var inviteid = req.params.inviteid;
        var userDoc = req.body;

        _db.invites.findOne({_id: inviteid}, function (err, doc) {
            if (err) {
                res.status(500).send("oops.");
                return next(err);
            }

            if (doc === null) {
                res.status(404).send("could not find matching item: " + inviteid);
                return next(new Error("no matching item: " + inviteid));
            }

            if (doc.from !== user.id && doc.to !== user.id) {
                res.status(403).send("can't change settings on someone else's invite");
                return next(new Error("requesting user: " + user.id + " doesn't match invite info."));
            }

            function writeInvite(doc) {
                _db.invites.update({_id: doc._id}, doc, {}, function (err, numReplaced) {
                    logger.info("Updated %d invites (id=%s)", numReplaced, inviteid);
                    res.send(doc);
                });
            }

            userDoc._id = doc._id;

            if (doc.isAccepted === false && userDoc.isAccepted === true) {
                logger.info("Accepting invitation " + inviteid + ". Updating album friends.");
                _db.albums.findOne({_id: doc.albumid}, function (err2, doc2) {
                    if (doc === null) {
                        logger.error("could not find album for invite: " + doc.albumid);
                        return next(new Error("No matching album."));
                    }


                    // add {id: user.id, state: "accepted"}
                    doc2.friends = _setAccepted(user.id, doc2.friends);
                    
                    _db.albums.update({_id: doc2._id}, doc2, {}, function (err, numReplaced) {
                        if (err) {
                            return next(err);
                        }
                        if (numReplaced !== 1) {
                            return next(new Error("Did not update any album. deleted?"));
                        }
                        logger.info("Album " + doc.albumid + " friends updated " + user.id + ": accepted");
                        writeInvite(userDoc);
                    });
                });
            } else {
                writeInvite(userDoc);
            }
        });
    }
};
