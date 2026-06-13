const userService = require("./user.service");
const { logActivity } = require("../../utils/activityLogger");
const { createNotification } = require("../../utils/notificationHelper");

async function createUser(req, res) {
    try {
        const user = await userService.createUser(req.body);

        // Log activity
        await logActivity(req.user.userId, 'CREATE_USER', 'User', user.id);

        // Send welcome notification to new user
        const io = req.app.get('io');
        await createNotification(
            user.id,
            'Welcome to EMS Portal',
            `Your account has been created. Role: ${user.role}`,
            'SUCCESS',
            io
        );

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
        const user = await userService.updateUser(req.params.id, req.body);

        await logActivity(req.user.userId, 'UPDATE_USER', 'User', Number(req.params.id));

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function updateStatus(req, res) {
    try {
        const user = await userService.updateStatus(req.params.id, req.body.isActive);

        const action = req.body.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
        await logActivity(req.user.userId, action, 'User', Number(req.params.id));

        // Notify the user about status change
        const io = req.app.get('io');
        await createNotification(
            Number(req.params.id),
            'Account Status Updated',
            `Your account has been ${req.body.isActive ? 'activated' : 'deactivated'}.`,
            req.body.isActive ? 'SUCCESS' : 'WARNING',
            io
        );

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function resetPassword(req, res) {
    try {
        await userService.resetPassword(req.params.id, req.body.newPassword);

        await logActivity(req.user.userId, 'RESET_PASSWORD', 'User', Number(req.params.id));

        // Notify the user
        const io = req.app.get('io');
        await createNotification(
            Number(req.params.id),
            'Password Reset',
            'Your password has been reset by an administrator.',
            'WARNING',
            io
        );

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