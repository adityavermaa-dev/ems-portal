const express = require("express");
const { getChatResponse } = require("./chat.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, getChatResponse);

module.exports = router;
