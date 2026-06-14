const bcrypt = require("bcrypt");
const prisma = require("../../config/prisma");
const { generateToken } = require("../../utils/jwt");
const { validateLogin } = require("../../utils/validators/user.validator");
const { logActivity } = require("../../utils/activityLogger");

async function login(email, password) {
    validateLogin(email, password);
    
    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true }
    });

    if (!user) {
        throw new Error("Invalid Credentials");
    }
    
    if (!user.isActive) {
        throw new Error("Account Disabled");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        throw new Error("Invalid Credentials");
    }

    const token = generateToken({ userId: user.id, role: user.role.name });

    await logActivity(user.id, 'LOGIN', 'User', user.id);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.name
        }
    };
}

async function logout(userId) {
    if (userId) {
        await logActivity(userId, 'LOGOUT', 'User', userId);
    }
}

module.exports = {
    login,
    logout
};