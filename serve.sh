#!/bin/bash

HERE=$(cd "$(dirname "$0")" && pwd)
export PORT
export HOSTNAME
exec ./node_modules/nodemon/bin/nodemon.js -w "$HERE"/lib/ -w index.js

