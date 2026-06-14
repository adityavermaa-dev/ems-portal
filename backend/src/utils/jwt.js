const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

function generateToken(payload) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d").trim();
    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn});
};

function verifyToken(token){
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.verify(token,process.env.JWT_SECRET);
}

module.exports = {generateToken,verifyToken};