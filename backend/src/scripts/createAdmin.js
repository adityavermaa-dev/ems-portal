const prisma = require('../config/prisma');
const bcrypt = require("bcrypt");

async function createAdmin(){
    const role = await prisma.role.findUnique({
        where: {
            name: "SUPER_ADMIN"
        }
    });

    const hashedPassword = await bcrypt.hash("Admin@123",10);

    await prisma.user.create({
        data: {
            name: "Super Admin",
            email: "amdin@ems.com",
            passwordHash: hashedPassword,
            isActive: true,
            roleId: role.id,
        }
    });
    console.log("Admin Created");
    process.exit(0);
}

createAdmin();
