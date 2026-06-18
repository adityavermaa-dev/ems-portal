const messageController = require('./src/modules/message/message.controller');

async function test() {
    const req = {
        user: { userId: 4, role: 'SUPER_ADMIN' },
        params: { userId: '6' },
        query: {}
    };
    
    const res = {
        json: (data) => console.log("JSON:", JSON.stringify(data)),
        status: (code) => {
            console.log("STATUS:", code);
            return {
                json: (data) => console.log("ERROR JSON:", JSON.stringify(data))
            };
        }
    };
    
    await messageController.getConversation(req, res);
}

test();
