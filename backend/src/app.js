const express = require('express');
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const authRoutes = require("./modules/auth/auth.route");
const authMiddleware = require("./middlewares/auth.middleware");
const cookieParser = require("cookie-parser");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRoutes);
app.get("/", (req, res) => {
    res.send("EMS API Running");
});
app.get("/profile",authMiddleware,(req,res) => {
    res.json(req.user);
})
module.exports = app;

