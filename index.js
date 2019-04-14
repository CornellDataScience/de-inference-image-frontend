"use strict";

// const url = require("url");
// const proxy = require("express-http-proxy");
const path = require("path");
const express = require("express");
const requestlib = require("request");
// const passport = require("passport");
// const Strategy = require("passport-github").Strategy;
// const httpProxy = require('http-proxy')
const http = require('http');
// const fs = require('fs');
const WebSocketServer = require('websocket').server;

// set the port we'll send to later
const port = process.env.PORT || 8080;

// create express app
const app = express();
app.use(express.static(path.join(__dirname, "build")));

/*passport.use(new Strategy({
    clientID: process.env["GITHUB_ID"],
    clientSecret: process.env["GITHUB_SECRET"],
    callbackURL: '/auth_callback'
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  }
))

passport.serializeUser(function(user, cb) {
  cb(null, user);
})

passport.deserializeUser(function(object, cb) {
  cb(null, object);
})*/

// create http server
app.use(express.static(path.join(__dirname, "build")));
const server = http.createServer(app);
server.listen(port, function() {
  console.log((new Date()) + ' Server is listening on port ' + port);
});

// create websocket server on top of http server
// TODO: figure out appropriate max and min names
const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
  maxReceivedFrameSize: 1000000,
  maxReceivedMessageSize: 10000000
});

function originIsAllowed(origin) {
  // TODO: put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }
  
  // get a connection
  let connection = request.accept(null, request.origin);
  console.log((new Date()) + ' Connection accepted.');

  // handle messages over connection
  connection.on('message', function(message) {
    console.log("onmessage called");

    // ensure we actually received a utf8 message
    if (message.type === 'utf8') {
    //   console.log('Received utf8 Message');

      // TODO: POST message to backend
      let postData = {image:  message.utf8Data};
      let options = {
        method: 'post',
        body: postData,
        json: true,
        // url: "http://localhost:8000"
        url: "http://de-inference-service"
      }
      requestlib.post(options, function callback(err, httpResponse, body) {
        // TODO: send response back over websocket
        // console.log('Upload successful!  Server responded with:', body);
        if (body) 
            connection.send(JSON.stringify(body));
      });
    }
  });

  // handle connection close
  connection.on('close', function(reasonCode, description) {
    console.log(reasonCode);
    console.log(description);
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});

// TODO: abstract with environment variable?
// const streamProxy = proxy("de-inference-service");

//app.use("/stream", function(req, res){
//  proxy.web(req, res);
//});

console.log("App is listening on port " + port);
