"use strict";

// const url = require("url");
// const proxy = require("express-http-proxy");
const path = require("path");
const express = require("express");
const requestlib = require("request");
// const passport = require("passport");
// const Strategy = require("passport-github").Strategy;
// const httpProxy = require('http-proxy')
const https = require('https');
const fs = require('fs');
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
const server = https.createServer({
  key: process.env.TLS_KEY,
  cert: process.env.TLS_CERT
}, app).listen(port, () => {
  console.log((new Date()) + ' Server is listening on port ' + port)
})

// create websocket server on top of http server
const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
  maxReceivedFrameSize: 10000000,
  maxReceivedMessageSize: 10000000
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return origin.startsWith("http://localhost") || origin.startsWith("http://128.84.48.178") || origin.startsWith("http://cdsserver.info") ||
          origin.startsWith("https://localhost") || origin.startsWith("https://128.84.48.178") || origin.startsWith("https://cdsserver.info");
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

      console.log("utf8 message; posting");

      // POST message to backend
      let postData = {image:  message.utf8Data};
      let options = {
        method: 'post',
        body: postData,
        json: true,
        url: "http://localhost:8000" // local testing mode
        // url: "http://de-inference-service:80" // deployment mode
      }
      requestlib.post(options, function callback(err, httpResponse, body) {
        console.log("post resp");
        if(err) {
          console.log("error during post");
          console.log(err);
        } else {
          // print http response
          console.log('statusCode:', httpResponse && httpResponse.statusCode);

          // send response back over websocket
          console.log('Upload successful!  Server responded with:', body);
          if (body) { 
            connection.send(JSON.stringify(body));
          }
        }
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

console.log("App is started on port " + port);
console.log("You should see a message about server listening above");
