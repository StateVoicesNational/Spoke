# How to run the server in a debugger

This doc explains how to start Spoke's node app server so that you can debug it in a v8-inspector compliant debugging tool, such as [Chrome DevTools](https://medium.com/@paul_irish/debugging-node-js-nightlies-with-chrome-devtools-7c4a1b95ae27) or [Jetbrains WebStorm](https://www.jetbrains.com/help/webstorm/running-and-debugging-node-js.html)

1. Run `npm run debug-server`.  This will start Spoke ready to accept debugging connections on the standard port (9229).

2. Attach the tool of your choice, set breakpoints (or whatever else you may want to do), and be productive!

