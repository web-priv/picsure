"use strict";
/*globals module require*/
/*jshint es5:true */

/**
   Manages the list of currently connected users
*/

var _users = null;
var USER_LIST_UPDATE_MS = 2000;
var USERS_PATH = "/users";

var logger = require('plogging').getLogger("users");
var uuid = require('node-uuid');

function Users(bayeux) {
    bayeux.addExtension({
        incoming: this.fayeIncoming.bind(this)
    });

    this.pscli = bayeux.getClient();
    this.users = {};
    this.byToken = {};
    this._userListTimer = setInterval(this.updateUserList.bind(this), USER_LIST_UPDATE_MS);
}

Users.prototype = {
    _getUserList: function () {
        var username;
        var users = [];

        for (username in this.users) {
            if (this.users.hasOwnProperty(username)) {
                users.push({id: username});
            }
        }
        return users;
    },

    fayeAuthorized: function (message) {
        function getUser() {
            if (message.ext) {
                var token = message.ext.token;
                if (token) {
                    var user = _users.byToken[token];
                    if (!user) {
                        logger.error("[PUBSUB] user presented bad token: %s", token);
                        return null;
                    }
                    logger.info("[PUBSUB] getUser() token=%s user=%s", token, user.id);
                    return user;
                }
            }
            return null;
        }

        if (message.channel === "/meta/subscribe") {
            var subTo = message.subscription;

            if (subTo.indexOf("*") >= 0) {
                logger.error("[PUBSUB] cannot subscribe to broadcast channels: %s", subTo);
                return false;
            }

            // user channel
            var userMatch = /^\/users\/([^\/]+)$/.exec(subTo);
            if (userMatch) {
                var user = getUser();
                if (!user) {
                    logger.error("[PUBSUB] missing credentials to subscribe to %s", subTo);
                    return false;
                }
                var username = decodeURIComponent(userMatch[1]);
                if (username !== user.id) {
                    logger.error("[PUBSUB] cannot subscribe to channel %s as user %s", subTo, user.id);
                    return false;
                }
                logger.info("[PUBSUB] user channel subscribed %s", subTo);
            }
        }
        return true;
    },

    fayeIncoming: function (message, request, callback) {
        try {
            if (!this.fayeAuthorized(message)) {
                message.error = "403::Authentication Required";
            }
            if (message.ext) {
                delete message.ext.token;
            }
        } catch (err) {
            logger.error("Problem handling message: %s %s", err + "", err.stack);
            if (!message.error) {
                message.error = "500::Unexpected Error";
            }
        }
        callback(message);
    },

    updateUserList: function () {
        if (!this.pscli) {
            return;
        }

        this.pscli.publish(USERS_PATH, {'users': this._getUserList()});
    },

    getUser: function (userid) {
        return this.users[userid] || null;
    },

    addUser: function (userid) {
        var u = {id: userid,
                 token: uuid.v4()};
        this.users[userid] = u;
        this.byToken[u.token] = u;
        return u;
    },

    removeUser: function (userid) {
        var u = this.users[userid];
        if (u) {
            delete this.users[userid];
            delete this.byToken[u.token];
        } else {
            logger.error("Cannot remove user: %s", userid);
        }
    }
};

function _initialize(bayeux) {
    if (!_users) {
        _users = new Users(bayeux);
    }
}

function _getUsers() {
    return _users || null;
}

function signIn(req, res) {
    var username = req.body.username || null;

    if (username === null) {
        return res.status(400).send({error: "bad username"});
    }

    if (_users.getUser(username)) {
        logger.warning("User %s already logged in.", username);
        //return res.status(409).send({error: "already logged in"});
    }

    var userInfo = _users.addUser(username);
    return res.send({id: userInfo.id,
                     token: userInfo.token});
}

//
//middleware. sets req.user based on the token in the request headers.
//
function authenticate(req, res, next) {
    var tok = req.headers['x-auth'] || "";
    var user = _users.byToken[tok];
    if (!user) {
        res.status(403).send({error: "bad token"});
        throw new Error("not logged in");
    }
    logger.debug("request authenticated: user=" + user.id);
    req.user = user;
    next();
}

function signOut(req, res) {
    var tok = req.headers['x-auth'] || "";

    // allow signout when you're not logged in
    // or the user doesn't exist.
    var user = _users.byToken[tok];
    if (!user) {
        return res.status(200).send(null);
    }

    // FIXME production re-enable auth check

    var username = req.body.username || null;
    if (username === null) {
        return res.status(400).send({error: "bad username"});
    }

    if (!_users.getUser(username)) {
        logger.error("no user with username: %s", username);
        //return res.status(404).send(null);
        return res.status(200).send(null);
    }

    _users.removeUser(username);
    return res.send(null);
}

module.exports = {
    initialize: _initialize,
    getUsers: _getUsers,
    authenticate: authenticate,
    signIn: signIn,
    signOut: signOut
};
