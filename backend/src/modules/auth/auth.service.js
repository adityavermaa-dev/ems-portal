const bcrypt = require("bcrypt");
const prisma = require("../../config/prisma");
const generateToken = require("../../utils/jwt");

async function login(email,password) {
    
    const user = await prisma.user.findUnique({
        where:{
            email
        },
        include: {
            role: true
        }
    });

    if(!user){
        throw new Error("Invalid Credentials")
    };

    const isMatch = await bcrypt.compare(password,user.passwordHash);

    if(!isMatch){
        throw new Error("Invalid Crendentials")
    };

    const token = generateToken({userId: user.id,role: user.role.name});

    return {
        token,
        user
    };
}

module.exports = {
    login
};