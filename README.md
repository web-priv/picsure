PICSURE
=======

Picsure is a proof-of-concept encrypted photo sharing gallery
application built on the Beeswax platform. It allows users to create
encrypted photo albums, and share them with other online users.

The application, consists of HTML5 and client-side javascript (written
on Backbone), and is served by a node.js server. The server runs a
simple notification service (called Faye) and serves static
content. The CSS code for the client is compiled with 'less'.

*Using the application requires that Beeswax be installed in the browser*

Installation
------------

*Note: Picsure is written for node.js, and uses gulp to build.*

1. Download the source code:

    `$ git clone https://github.com/web-priv/picsure.git && cd picsure`

2. Install the dependencies:

    `$ npm install .`

3. Build the client-side code

    `$ gulp build`

    (or, if you've installed gulp locally)
	
	`$ node node_modules/gulp/bin/gulp.js build`
	

Development
-----------

You may use the gulp script to monitor changes to the client-side
source code and rebuild automatically.

   `$ gulp watch`


Files:

- client-side files are under `cli/`
- server-side files are under `lib/`.
- main server file is in `index.js`. 
- compiled code gets copied to `dist/`.
- uploaded pictures (encrypted), are placed under `uploads/`.

Starting the service
--------------------

For a server that automatically restarts when server-side files change (with nodemon), move to the root directory, and do:

   `$ ./serve.sh`

To run the basic service:

   `$ node index.js`

In both cases, you may provide `HOSTNAME` and `PORT` environment variables to change the listening socket's address.

Using
-----

Point the browser at the server's address (defaults to your local host
name and port 8000). You have to first login to be able to access
photos.  There are no passwords associated with the picsure account. The
username used should match the one configured in Beeswax (and should
match the twitter account.) One logs out by refreshing the browser.

You can add a photo collection from the main page with `Add`. In a
collection page, you may click `Add Photo` to add one slot to the
collection. You may change the photo's description by hovering it, and
hitting the edit icon. You change the photo by clicking the photo
itself. Note that while you type a new photo description, the Beeswax
privacy indicator is locked to that area. You will not be able to
confirm the new description (with a click on the checkmark icon) until
the indicator's timer expires (seconds).

To invite another user, select the user from the list of online users,
and hit `OK`. This will initiate the KAP with that user if no
friendship channel exist. In this version, the other user needs to be
online and logged in to complete the KAP. A prompt should appear in
the privacy indicator to confirm the invitation. The invitation will
be shown on the main page in the invited user's browser. The other
user has to click `Accept Invite` from the main page.