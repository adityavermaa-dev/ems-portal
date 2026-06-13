const prisma = require('../../config/prisma');
const { isInsideOffice } = require('../../utils/gps');

async function checkIn(userId, latitude, longitude) {
    if (latitude === undefined || longitude === undefined) {
        throw new Error('Latitude and longitude are required');
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.attendance.findFirst({
        where: {
            userId,
            date: {
                gte: today,
                lt: tomorrow
            }
        }
    });

    if (existing) {
        throw new Error('Already checked in today');
    }

    // Calculate GPS distance
    const gpsResult = isInsideOffice(latitude, longitude);

    const attendance = await prisma.attendance.create({
        data: {
            userId,
            date: new Date(),
            status: gpsResult.isInside ? 'PRESENT' : 'PRESENT',
            attendanceType: 'GPS',
            latitude,
            longitude,
            isInsideOffice: gpsResult.isInside,
            officeDistanceMeters: gpsResult.distance,
            checkIn: new Date()
        },
        include: {
            user: { select: { id: true, name: true, email: true } }
        }
    });

    return {
        ...attendance,
        gpsInfo: {
            distanceFromOffice: `${gpsResult.distance} meters`,
            isInsideOffice: gpsResult.isInside
        }
    };
}

async function checkOut(userId, latitude, longitude) {
    // Find today's check-in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
        where: {
            userId,
            date: {
                gte: today,
                lt: tomorrow
            }
        }
    });

    if (!attendance) {
        throw new Error('No check-in found for today. Please check in first.');
    }

    if (attendance.checkOut) {
        throw new Error('Already checked out today');
    }

    const updateData = {
        checkOut: new Date()
    };

    // Update GPS data if provided during check-out
    if (latitude !== undefined && longitude !== undefined) {
        const gpsResult = isInsideOffice(latitude, longitude);
        // We don't overwrite check-in GPS, just record check-out time
    }

    return prisma.attendance.update({
        where: { id: attendance.id },
        data: updateData,
        include: {
            user: { select: { id: true, name: true, email: true } }
        }
    });
}

async function getAttendanceRecords(query = {}) {
    const where = {};

    if (query.userId) {
        where.userId = Number(query.userId);
    }

    if (query.date) {
        const date = new Date(query.date);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        where.date = { gte: date, lt: nextDay };
    }

    if (query.startDate && query.endDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.date = { gte: start, lte: end };
    }

    if (query.isInsideOffice !== undefined) {
        where.isInsideOffice = query.isInsideOffice === 'true';
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
        prisma.attendance.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { date: 'desc' },
            skip,
            take: limit
        }),
        prisma.attendance.count({ where })
    ]);

    return {
        records,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getMyAttendance(userId, query = {}) {
    const where = { userId };

    if (query.startDate && query.endDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.date = { gte: start, lte: end };
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
        prisma.attendance.findMany({
            where,
            orderBy: { date: 'desc' },
            skip,
            take: limit
        }),
        prisma.attendance.count({ where })
    ]);

    return {
        records,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getUserAttendance(userId, query = {}) {
    return getAttendanceRecords({ ...query, userId });
}

module.exports = {
    checkIn,
    checkOut,
    getAttendanceRecords,
    getMyAttendance,
    getUserAttendance
};
