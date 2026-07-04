const prisma = require('./src/config/prisma');

function getMonthBounds(month, year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
}

async function main() {
    const month = 6;
    const year = 2026;
    const targets = await prisma.salesTarget.findMany({
        where: { month: Number(month), year: Number(year) },
        include: { user: { select: { id: true, name: true } } }
    });

    const bounds = getMonthBounds(month, year);
    const results = [];

    for (const t of targets) {
        const converted = await prisma.lead.count({
            where: {
                assignedToId: t.userId,
                status: 'CONVERTED',
                updatedAt: { gte: bounds.start, lte: bounds.end }
            }
        });
        results.push({
            id: t.id,
            user: t.user,
            target: t.targetConversions,
            converted,
            remaining: Math.max(0, t.targetConversions - converted),
            progress: Number(((converted / t.targetConversions) * 100).toFixed(1))
        });
    }

    console.log("Results:", JSON.stringify(results, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
