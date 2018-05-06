# How to run the server in a debugger

This doc explains how to start Spoke's node app server so that you can debug it in a v8-inspector compliant debugging tool, such as [Chrome DevTools](https://medium.com/@paul_irish/debugging-node-js-nightlies-with-chrome-devtools-7c4a1b95ae27) or [Jetbrains WebStorm](https://www.jetbrains.com/help/webstorm/running-and-debugging-node-js.html)


You will need 2 shell wiindows.

1. In one shell window, run `npm run debug-server`.  This will start the main Spoke application (the thing that exposes the graphql endpoint) ready to accept debugging connections on the standard port (9229).

2. In the other shell window, run `npm run dev-other`.  The will start `webpack` and `incomingmessagehandler`.

3. Attach the tool of your choice, set breakpoints (or whatever else you may want to do), and be productive!
 
