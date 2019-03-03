import * as express from "express";
import * as path from "path";
import * as url from "url";
import * as proxy from "express-http-proxy";

const app = express();

// TODO: abstract with environment variable?
const streamProxy = proxy("de-inference-service");

app.use("/stream", streamProxy);

app.use(express.static(path.join(__dirname, "build")));
