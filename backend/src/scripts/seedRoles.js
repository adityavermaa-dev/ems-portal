const prisma = require('../config/prisma');

async function seedRoles() {
    const roles = [
        "SUPER_ADMIN",
        "HR",
        "BDE",
        "TELESALES"
    ];

    for(const role of roles){
        await prisma.role.upsert({
            where: {
                name: role
            },

            update: {},

            create: {
                name: role
            }
        });
    }
    console.log("Roles Seeded");
    process.exit(0);
}

seedRoles();



