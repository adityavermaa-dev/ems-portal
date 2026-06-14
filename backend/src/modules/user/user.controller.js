const userService = require("./user.service");

async function createUser(req, res) {
    try {
        const io = req.app.get('io');
        const user = await userService.createUser(req.body, req.user.userId, io);
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getUsers(req, res) {
    try {
        const users = await userService.getUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getUserById(req, res) {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
}

async function updateUser(req, res) {
    try {
        const user = await userService.updateUser(req.params.id, req.body, req.user.userId);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function updateStatus(req, res) {
    try {
        const io = req.app.get('io');
        const user = await userService.updateStatus(req.params.id, req.body.isActive, req.user.userId, io);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function resetPassword(req, res) {
    try {
        const io = req.app.get('io');
        await userService.resetPassword(req.params.id, req.body.newPassword, req.user.userId, io);
        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    updateStatus,
    resetPassword
};