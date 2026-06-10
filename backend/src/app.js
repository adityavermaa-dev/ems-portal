const express = require('express');
const app = express();
const dotenv = require("dotenv");
dotenv.config();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("EMS API Running");
});
module.exports = app;

