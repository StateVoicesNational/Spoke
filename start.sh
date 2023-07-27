#!/bin/sh
# this has been added to give cloud run a start script for the worker
cd /spoke
/usr/local/bin/npm run prod-bull-ui
