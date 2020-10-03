const express = require('express')
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config()

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const Route = require('./Routes/Movie.js');
const LiveTV = require('./Routes/LiveTV.js');


app.use('/Movie', Route);
app.use('/LiveTV', LiveTV);


app.listen(process.env.PORT, () => {
    console.log("Your app is listening on port " + process.env.PORT)
});