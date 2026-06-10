const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 9999;

async function startServer(){
    try {
        await prisma.$connect();
        console.log("Database Connected");

        app.listen(PORT, () => {
            console.log(`Server is listen on ${PORT}`);
        })
    } catch (error) {
        console.log("Database connection failed"+" why? "+ error);
        process.exit(1);
    }
}

process.on("SIGINT",async () => {
    console.log("Database shutdown started");
    await prisma.$disconnect();
    console.log("Database disconnection successful");
})

startServer();