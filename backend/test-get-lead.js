const leadService = require('./src/modules/lead/lead.service');

async function test() {
    try {
        const prisma = require('./src/config/prisma');
        const lead = await prisma.lead.findFirst();
        if (!lead) {
            console.log("No leads found.");
            return;
        }
        console.log("Testing getLeadById for lead ID:", lead.id);
        const result = await leadService.getLeadById(lead.id, 1, 'SUPER_ADMIN');
        console.log("Success! Result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Error occurred:", err);
    }
    process.exit(0);
}

test();
