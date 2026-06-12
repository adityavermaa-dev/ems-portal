const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

function generateToken(payload) {
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d").trim();
    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn});
};

function verifyToken(token){
    return jwt.verify(token,process.env.JWT_SECRET);
}

module.exports = {generateToken,verifyToken};