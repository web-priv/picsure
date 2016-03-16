
"use strict";

/*globals process __dirname require */
/*jshint es5: true */
/*
  Server process for the picsure app
*/

require('./lib/polyfill');

var http = require('http'),
    faye = require('faye'),
    logging = require('plogging'),
    pa = require('path');

var users = require('./lib/users');
var albums = require('./lib/albums');
var uploads = require('./lib/uploads');
var media = require('./lib/media');
var invites = require('./lib/invites');

var express = require('./lib/express');
var multer = require('multer');
var upload = multer({
    dest: pa.join(__dirname, "uploads"),
    limits: {
        fieldSize: 1024 * 1024 * 10
    }
});
var morgan = require('morgan');
var bodyParser = require('body-parser');

var Datastore = require('nedb');
var dbdir = pa.join(__dirname, "db");

var db = {};
db.albums = new Datastore(pa.join(dbdir, "albums.db"));
db.media = new Datastore(pa.join(dbdir, "media.db"));
db.uploads = new Datastore(pa.join(dbdir, "uploads.db"));
db.invites = new Datastore(pa.join(dbdir, "invites.db"));

db.albums.loadDatabase();
db.media.loadDatabase();
db.uploads.loadDatabase();
db.invites.loadDatabase();

media.initialize(db);
albums.initialize(db);
uploads.initialize(db, pa.join(__dirname, "uploads"));
invites.initialize(db);

function logPubSubEvents(ps) {
    "use strict";

    var logPrefix = "[PUBSUB]";

    ps.on('handshake', function (clientId) {
        logger.info(logPrefix + " handshake - client issued ID %s", clientId);
    });

    ps.on('subscribe', function (clientId, channel) {
        logger.info(logPrefix + " subscribe - client %s subscribed to channel %s",
                    clientId, channel);
    });

    ps.on('unsubscribe', function (clientId, channel) {
        logger.info(logPrefix + " unsubscribe - client %s unsubscribed to channel %s",
                    clientId, channel);
    });
    
    ps.on('disconnect', function (clientId) {
        logger.info(logPrefix + " client %s disconnected.",
                    clientId);
    });

    ps.on('publish', function (clientId, channel, data) {
        logger.debug(logPrefix + " client %s publish on %s: %s",
                     clientId || "null", channel, data.substr(0, 1024));
    });
}

logging.Formatter.prototype.color = true;
var logger = logging.getLogger();
logger.setLevel('debug');

var bayeux = new faye.NodeAdapter({mount: '/msg'});
var app = express();

// EXPRESS FEATURES
app.set("strict routing", true);
app.set("x-powered-by", false);

// LOGGING
app.use(morgan('dev', {})); //'combined'

var jsonOpts = {inflate: true, limit: "100kb", type: isJSONBody};
var JSON_BODY = bodyParser.json(jsonOpts);

// SIGNIN
app.post('/api/signin', JSON_BODY, users.signIn);
app.post('/api/signout', JSON_BODY, users.signOut);
app.route('/api/albums/:userid/')
    .get(users.authenticate, albums.list)
    .post(JSON_BODY, users.authenticate, albums.create);

app.route('/api/album/:albumid/')
    .get(users.authenticate, media.listByAlbumid)
    .post(users.authenticate, JSON_BODY, media.create);

app.route('/api/album/:albumid')
    .get(users.authenticate, albums.getAlbum)
    .put(users.authenticate, JSON_BODY, albums.update)
    ['delete'](users.authenticate, albums['delete']);

app.route('/api/invite/:userid/')
    .get(users.authenticate, invites.list)
    .post(users.authenticate, JSON_BODY, invites.create);

app.route('/api/invite/:inviteid')
    .get(users.authenticate, invites.get)
    .put(users.authenticate, JSON_BODY, invites.update)
    ['delete'](users.authenticate, JSON_BODY, invites['delete']);


app.route('/api/media/')
    .post(users.authenticate, JSON_BODY, media.create);

app.route('/api/media/:mediaid')
    .get(users.authenticate, media.get)
    .put(users.authenticate, JSON_BODY, media.update)
    ['delete'](users.authenticate, media['delete']);

app.route('/api/uploads/')
    .post(users.authenticate, upload.fields([
        {name: 'meta', maxcount: 1},
        {name: 'data', maxcount: 1}
    ]), uploads.upload);
app.route('/api/uploads/:uploadid')
    .get(uploads.getFile)
    ['delete'](users.authenticate, uploads.deleteUpload);

//app.put('/albums/:albumid',
// STATIC FILES
app.use(express.static(__dirname + "/dist", {
    dotfiles: "ignore",
    etag: true,
    index: "index.html",
    lastModified: true,
    maxAge: 0
}));

function isJSONBody(req) {
    "use strict";
    var ct = req.headers['content-type'] || "";
    if (ct === "text/plain" || ct === "application/json") {
        return true;
    }

    //logger.info("REQ %j", JSON.stringify(req.headers));
    return false;
}

var server = http.createServer(app);

server.on('error', function (err) {
    "use strict";
    logger.error("Server Error: %s", err);
});

users.initialize(bayeux);

// Initialize logging and attach to web server
logPubSubEvents(bayeux);
bayeux.attach(server);

var PORT = parseInt(process.env.PORT || "8000", 10);
var HOSTNAME = process.env.HOSTNAME || "localhost";
if (isNaN(PORT)) {
    process.exit(2);
}
server.listen(PORT, HOSTNAME);

logger.info("Server started on hostname '%s' port %s", HOSTNAME, PORT);
