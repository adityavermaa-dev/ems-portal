const messageService = require('./src/modules/message/message.service');

async function test() {
    try {
        const prisma = require('./src/config/prisma');
        const message = await prisma.message.findFirst();
        if (!message) {
            console.log("No messages found.");
            return;
        }
        
        console.log(`Testing getConversation for users ${message.senderId} and ${message.receiverId}`);
        const result = await messageService.getConversation(message.senderId, message.receiverId);
        console.log("Success! Messages count:", result.messages.length);
    } catch (err) {
        console.error("Error occurred:", err);
    }
    process.exit(0);
}

test();
