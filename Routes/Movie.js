const Router = require("express").Router();
const WebTorrent = require("webtorrent");
// const WebTorrent = require("webtorrent-hybrid");
const TorrentSearchApi = require("torrent-search-api");

const BASEURL = process.env.BASEURL;

let client = new WebTorrent();

client.on("error", function (err) {
  console.log("error", err.message, "err.name", err.name);
});

TorrentSearchApi.enablePublicProviders();
// TorrentSearchApi.enableProvider("ThePirateBay");

// ['Limetorrents','ThePirateBay','1337x']    this is are the best torrent provider

Router.get("/Search/:name", async (req, res) => {
  try {
    const { name } = req.params;

    let torrents = await TorrentSearchApi.search(["1337x"], name, "", 10);

    if (!torrents.length) {
      torrents = await TorrentSearchApi.search(["Limetorrents", "ThePirateBay"], name, "", 10);
      if (!torrents.length || !Boolean(torrents[0].numFiles)) return res.status(401).send(`No Result Found`);
    }

    const magnet = await TorrentSearchApi.getMagnet(torrents[0]);

    const isExit_torrent = client.get(magnet);
    console.log(`found '${name}' with ${magnet}`);

    const StreamURL = [];

    const getStreamUrl = torrent => {
      const infoHash = torrent.infoHash;
      torrent.files.forEach(function (data, index) {
        StreamURL.push(`${BASEURL}/stream/${infoHash}/${index}/${data.name}`);
      });

      return res.json(StreamURL);
    };

    if (isExit_torrent) {
      getStreamUrl(isExit_torrent);
    } else {
      client.add(magnet, function (torrent) {
        getStreamUrl(torrent);
      });
    }
  } catch (error) {
    console.log(error);
  }
});

Router.post("/get_StreamUrl", (req, res) => {
  try {
    const { magnet } = req.body;
    console.log("magnet", magnet);

    client.add(magnet, function (torrent) {
      const StreamURL = [];
      const infoHash = torrent.infoHash;
      torrent.files.forEach(function (data, index) {
        console.log(`${BASEURL}/stream/${infoHash}/${index}`);
        StreamURL.push(`${BASEURL}/stream/${infoHash}/${index}`);
      });
      return res.send(StreamURL);
    });
  } catch (error) {
    console.log(error);
  }
});

Router.get("/stream/:magnet/:index/:name", function (req, res, next) {
  const { magnet, index, name } = req.params;
  console.log("started stream", name, index);

  let tor = client.get(magnet);

  let file = tor.files[index];
  let range = req.headers.range;

  if (!range) {
    let err = new Error("Wrong range");
    err.status = 416;
    return next(err);
  }

  let positions = range.replace(/bytes=/, "").split("-");

  let start = parseInt(positions[0], 10);

  let file_size = file.length;

  let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;

  let chunksize = end - start + 1;

  let head = {
    "Content-Range": "bytes " + start + "-" + end + "/" + file_size,
    "Accept-Ranges": "bytes",
    "Content-Length": chunksize,
    "Content-Type": "video/mp4"
  };

  res.writeHead(206, head);

  let stream_position = {
    start: start,
    end: end
  };

  let stream = file.createReadStream(stream_position);

  stream.pipe(res);

  stream.on("error", function (err) {
    console.log("error at stream", err);
    return next(err);
  });
});

Router.get("/list", function (req, res) {
  const torrent = client.torrents.reduce(function (array, data) {
    array.push({
      hash: data.infoHash
    });

    return array;
  }, []);
  res.json(torrent);
});

Router.get("/remove/:hash", function (req, res) {
  const hash = req.params.hash;
  try {
    client.remove(hash);
    res.json(`removed ${hash}`);
  } catch (error) {
    res.json(`Invalid hash ${hash}`);
  }
});

Router.get("/remove/:hash", function (req, res) {
  const hash = req.params.hash;
  try {
    client.remove(hash);
    res.json(`removed ${hash}`);
  } catch (error) {
    res.json(`Invalid hash ${hash}`);
  }
});
module.exports = Router;