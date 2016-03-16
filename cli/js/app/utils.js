"use strict";

/*global require module Promise*/

var self = null;
var $ = require('jquery');
var Events = require('./events');
var User = require('./models/user.model');
var API_ROOT = "/api";

function RPCError(code, message) {
    var stack = (new Error().stack);
    this.message = message || "RPCError";
    this.code = (code === undefined) ? "GENERIC" : code;
    this.name = "RPCError";
    var skip2 = stack.indexOf("\n", stack.indexOf(stack, "\n") + 1);
    this.stack = "RPCError" + stack.substr(skip2);
}
RPCError.GENERIC = "GENERIC";
RPCError.CONFLICT = "CONFLICT";
RPCError.TIMEOUT = "TIMEOUT";
RPCError.ENOENT = "ENOENT";
RPCError.BADPARAM = "BADPARAM";
RPCError.ABORT = "ABORT";
RPCError.EACCESS = "EACCESS";
RPCError.prototype = Object.create(Error.prototype);
RPCError.prototype.constructor = RPCError;
RPCError.fromAjax = function (jqXHR, textStatus, errorThrown) {
    var code = null;

    switch (textStatus) {
    case "timeout":
        return new RPCError(RPCError.TIMEOUT, errorThrown);
    case "abort":
        return new RPCError(RPCError.ABORT, "request aborted");
    case "error":
        switch (jqXHR.status) {
        case 500:
            code = RPCError.GENERIC;
            break;
        case 404:
            code = RPCError.ENOENT;
            break;
        case 403:
            code = RPCError.EACCESS;
            break;
        case 400:
            code = RPCError.BADPARAM;
            break;
        case 409:
            code = RPCError.CONFLICT;
            break;
        default:
            code = RPCError.GENERIC;
        }
        return new RPCError(code, errorThrown);
    default:
        return new RPCError(RPCError.GENERIC, errorThrown);
    }
};

function _addAuthHeader(jqXhr /*, settings*/) {
    if (self) {
        jqXhr.setRequestHeader("X-Auth", self.get('token'));
    }
}

module.exports = {
    API_ROOT: API_ROOT,
    RPCError: RPCError,

    _addAuthHeader: _addAuthHeader,

    getUser: function () { return self; },

    // e.g. localhost:8000
    getHostPort: function () {
        return window.location.host;
    },

    // e.g. http://localhost:8000
    getOrigin: function () {
        return window.location.origin;
    },

    signOut: function () {
        if (!self) {
            return Promise.resolve(true);
        }
        return new Promise(function (resolve, reject) {
            $.ajax({
                method: "POST",
                url: API_ROOT + "/signout",
                dataType: "text",
                beforeSend: _addAuthHeader,
                processData: false,
                contentType: "text/plain",
                data: JSON.stringify({username: self.id}),
                timeout: 5000,
                success: function () {
                    self = null;
                    Events.trigger("app:signout", null);
                    resolve(true);
                },
                error: function (jqXhr, textStatus, errorStr) {
                    reject(RPCError.fromAjax(jqXhr, textStatus, errorStr));
                }
            });
        });
    },

    signIn: function (username) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                method: "POST",
                url: API_ROOT + "/signin",
                dataType: "json",
                processData: false,
                contentType: "text/plain",
                data: JSON.stringify({username: username}),
                timeout: 5000,
                success: function (data) {
                    self = new User(data);
                    Events.trigger("app:signin", self);
                    resolve(self);
                },
                error: function (jqXhr, textStatus, errorStr) {
                    reject(RPCError.fromAjax(jqXhr, textStatus, errorStr));
                }
            });
        });
    },

    getUploadedFile: function (uploadid) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "GET",
                url: API_ROOT + "/uploads/" + uploadid,
                dataType: "text",
                processData: false,
                contentType: false,
                timeout: 15000,
                beforeSend: module.exports._addAuthHeader,
                success: function (data) {
                    resolve(data);
                },
                error: function (jqXhr, textStatus, errorStr) {
                    reject(RPCError.fromAjax(jqXhr, textStatus, errorStr));
                }
            });
        });
    },

    doUpload: function (data, name) {
        var Upload = require('./models/upload.model.js');
        console.log("doUpload", name, data);

        return new Promise(function (resolve, reject) {
            var fdata = new FormData();
            fdata.append("meta", JSON.stringify({name: name}));
            fdata.append("data", data);

            $.ajax({
                type: "POST",
                url: API_ROOT + "/uploads/",
                dataType: "json",
                processData: false,
                contentType: false,
                data: fdata,
                timeout: 15000,
                beforeSend: module.exports._addAuthHeader,
                success: function (data) {
                    var upload = new Upload(data);
                    console.log("New upload done:", data);
                    resolve(upload);
                },
                error: function (jqXhr, textStatus, errorStr) {
                    reject(RPCError.fromAjax(jqXhr, textStatus, errorStr));
                }
            });
        });
    }
};
