const authService = require("./auth.service");
const { logActivity } = require("../../utils/activityLogger");

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const result = await authService.login(email, password);

        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Log login activity
        await logActivity(result.user.id, 'LOGIN', 'User', result.user.id);

        res.status(200).json({ success: true, user: result.user });

    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
}

function logout(req, res) {
    // Log logout activity if user info is available
    if (req.cookies.accessToken) {
        try {
            const { verifyToken } = require("../../utils/jwt");
            const decoded = verifyToken(req.cookies.accessToken);
            logActivity(decoded.userId, 'LOGOUT', 'User', decoded.userId);
        } catch (e) {
            // Token may be expired, still allow logout
        }
    }

    res.clearCookie("accessToken");
    res.json({ success: true, message: "Logged out successfully" });
}

module.exports = {
    login,
    logout
};