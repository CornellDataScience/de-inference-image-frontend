const url = require("url");
// const proxy = require("express-http-proxy");
const path = require("path");
const express = require("express");
const passport = require("passport");
const Strategy = require("passport-github").Strategy;
const httpProxy = require('http-proxy')

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

const app = express();
const proxy = httpProxy.createProxyServer({
  target: "http://de-inference-service", ws: true });

// TODO: abstract with environment variable?
// const streamProxy = proxy("de-inference-service");

//app.use("/stream", function(req, res){
//  proxy.web(req, res);
//});

app.use(express.static(path.join(__dirname, "build")));

const port = process.env.PORT || 8080;

const server = require("http").createServer(app);
server.on("upgrade", function(req, socket, head) {
  try{proxy.ws(req, socket, head);}
  catch (err) {console.log(err)}
})
server.listen(port);

// app.listen(port);

console.log("App is listening on port " + port);
