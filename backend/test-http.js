const http = require('http');

async function test() {
    // Generate a valid token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 4, role: 'SUPER_ADMIN' }, process.env.JWT_SECRET || 'EMS_FALLBACK_SECRET_KEY', { expiresIn: '1d' });

    const req = http.request('http://localhost:9999/api/messages/conversation/6', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log("STATUS:", res.statusCode);
            console.log("BODY:", data);
        });
    });
    
    req.on('error', console.error);
    req.end();
}

require('dotenv').config();
test();
