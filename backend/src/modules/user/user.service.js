const bcrypt = require("bcrypt");
const prisma = require("../../config/prisma");
const { validateCreateUser, validateUpdateUser, validatePasswordReset } = require("../../utils/validators/user.validator");
const { logActivity } = require("../../utils/activityLogger");
const { createNotification } = require("../../utils/notificationHelper");

async function createUser(data, creatorId, io) {
    validateCreateUser(data);

    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const role = await prisma.role.findUnique({
        where: { name: data.role }
    });

    if (!role) {
        throw new Error("Role not found");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: hashedPassword,
                roleId: role.id,
                isActive: true
            },
            include: { role: true }
        });

        await Promise.all([
            logActivity(creatorId, 'CREATE_USER', 'User', user.id, null, tx),
            createNotification(
                user.id,
                'Welcome to EMS Portal',
                `Your account has been created. Role: ${user.role.name}`,
                'SUCCESS',
                io,
                tx
            )
        ]);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name,
            isActive: user.isActive
        };
    });
}

async function getUsers() {
    return prisma.user.findMany({
        include: { role: true }
    });
}

async function getUserById(id) {
    const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        include: { role: true }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
}

async function updateUser(id, data, modifierId) {
    validateUpdateUser(data);

    if (data.email) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser && existingUser.id !== Number(id)) {
            throw new Error("Email already in use by another account");
        }
    }

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;

    if (data.role) {
        const role = await prisma.role.findUnique({
            where: { name: data.role }
        });

        if (!role) {
            throw new Error("Role not found");
        }
        updateData.roleId = role.id;
    }

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: Number(id) },
            data: updateData
        });

        await logActivity(modifierId, 'UPDATE_USER', 'User', user.id, null, tx);

        return user;
    });
}

async function updateStatus(id, isActive, modifierId, io) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: Number(id) },
            data: { isActive }
        });

        const action = isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
        
        await Promise.all([
            logActivity(modifierId, action, 'User', user.id, null, tx),
            createNotification(
                user.id,
                'Account Status Updated',
                `Your account has been ${isActive ? 'activated' : 'deactivated'}.`,
                isActive ? 'SUCCESS' : 'WARNING',
                io,
                tx
            )
        ]);

        return user;
    });
}

async function resetPassword(id, newPassword, modifierId, io) {
    validatePasswordReset(newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
            where: { id: Number(id) },
            data: { passwordHash: hashedPassword }
        });

        await Promise.all([
            logActivity(modifierId, 'RESET_PASSWORD', 'User', user.id, null, tx),
            createNotification(
                user.id,
                'Password Reset',
                'Your password has been reset by an administrator.',
                'WARNING',
                io,
                tx
            )
        ]);

        return user;
    });
}

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    updateStatus,
    resetPassword
};