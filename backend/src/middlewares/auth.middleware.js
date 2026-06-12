const {verifyToken} = require("../utils/jwt");

function authMiddleware(req,res,next){
    try {
        const token = req.cookies.accessToken;
        if(!token){
            return res.status(401).json({message:"Authentication Required"});
        }
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({message:"Invalid Token"});
    }

}

module.exports = authMiddleware;