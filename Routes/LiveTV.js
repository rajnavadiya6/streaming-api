const Router = require("express").Router();
const fs = require("fs");
const path = require("path");
const M3U8FileParser = require("m3u8-file-parser");

const M3UfiletPath = path.resolve(__dirname, "../Val_livetvsept20.M3U");
const playlist = fs.readFileSync(M3UfiletPath, {
    encoding: "utf-8"
});

Router.get("/", (req, res) => {
    const reader = new M3U8FileParser();
    reader.read(playlist);
    const respose = reader.getResult();
    res.send(respose.segments)
});

module.exports = Router;