const bcrypt = require("bcrypt");
const prisma = require("../../config/prisma");

async function createUser(data) {

    const existingUser =
        await prisma.user.findUnique({
            where: {
                email: data.email
            }
        });

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const role =
        await prisma.role.findUnique({
            where: {
                name: data.role
            }
        });

    if (!role) {
        throw new Error("Role not found");
    }

    const hashedPassword =
        await bcrypt.hash(
            data.password,
            10
        );

    const user =
        await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: hashedPassword,
                roleId: role.id,
                isActive: true
            },
            include: {
                role: true
            }
        });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        isActive: user.isActive
    };
}

async function getUsers() {

    return prisma.user.findMany({
        include: {
            role: true
        }
    });
}

async function getUserById(id) {

    const user =
        await prisma.user.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                role: true
            }
        });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
}

async function updateUser(id, data) {

    const updateData = {};

    if (data.name) {
        updateData.name = data.name;
    }

    if (data.email) {
        updateData.email = data.email;
    }

    if (data.role) {

        const role =
            await prisma.role.findUnique({
                where: {
                    name: data.role
                }
            });

        if (!role) {
            throw new Error("Role not found");
        }

        updateData.roleId = role.id;
    }

    return prisma.user.update({
        where: {
            id: Number(id)
        },
        data: updateData
    });
}

async function updateStatus(id, isActive) {

    return prisma.user.update({
        where: {
            id: Number(id)
        },
        data: {
            isActive
        }
    });
}

async function resetPassword(id, newPassword) {

    const hashedPassword =
        await bcrypt.hash(
            newPassword,
            10
        );

    return prisma.user.update({
        where: {
            id: Number(id)
        },
        data: {
            passwordHash: hashedPassword
        }
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