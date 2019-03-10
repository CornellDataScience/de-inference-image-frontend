const url = require("url");
const proxy = require("express-http-proxy");
const path = require("path");
const express = require("express");
const passport = require("passport");
const Strategy = require("passport-github").Strategy;

passport.use(new Strategy({
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
})

const app = express();

// TODO: abstract with environment variable?
const streamProxy = proxy("de-inference-service");

app.use("/stream", streamProxy);

app.use(express.static(path.join(__dirname, "build")));

const port = process.env.PORT || 8080;

app.listen(port);

console.log("App is listening on port " + port);
