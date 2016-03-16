/*global require module*/

var Backbone = require('backbone');
var User = require('../models/user.model');

var UserCollection = Backbone.Collection.extend({
    model: User
});

module.exports = UserCollection;
