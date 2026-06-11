const express = require('express');
const app = express();
const dotenv = require("dotenv");
const authRoutes = require("./modules/auth/auth.route");
dotenv.config();

app.use(express.json());
app.use("/api/auth",authRoutes);
app.get("/", (req, res) => {
    res.send("EMS API Running");
});
module.exports = app;

