const authService = require("./auth.service");

async function login(req, res) {
    try {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, user: result.user });

    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
}

async function logout(req, res) {
    if (req.cookies.accessToken) {
        try {
            const { verifyToken } = require("../../utils/jwt");
            const decoded = verifyToken(req.cookies.accessToken);
            await authService.logout(decoded.userId);
        } catch (e) {
            
        }
    }

    res.clearCookie("accessToken");
    res.json({ success: true, message: "Logged out successfully" });
}

module.exports = {
    login,
    logout
};