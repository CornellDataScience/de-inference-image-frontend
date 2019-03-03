const url = require("url");
const proxy = require("express-http-proxy");
const path = require("path");
const express = require("express");

const app = express();

// TODO: abstract with environment variable?
const streamProxy = proxy("de-inference-service");

app.use("/stream", streamProxy);

app.use(express.static(path.join(__dirname, "build")));

const port = process.env.PORT || 8080;

app.listen(port);

console.log("App is listening on port " + port);
