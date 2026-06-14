const prisma = require('../../config/prisma');
const { isInsideOffice } = require('../../utils/gps');
const { validateGps } = require('../../utils/validators/attendance.validator');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');

async function checkIn(userId, latitude, longitude, io) {
    validateGps(latitude, longitude);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.attendance.findFirst({
        where: {
            userId,
            date: { gte: today, lt: tomorrow }
        }
    });

    if (existing) {
        throw new Error('Already checked in today');
    }

    const gpsResult = isInsideOffice(latitude, longitude);

    return prisma.$transaction(async (tx) => {
        const attendance = await tx.attendance.create({
            data: {
                userId,
                date: new Date(),
                status: 'PRESENT',
                attendanceType: 'GPS',
                latitude: Number(latitude),
                longitude: Number(longitude),
                isInsideOffice: gpsResult.isInside,
                officeDistanceMeters: gpsResult.distance,
                checkIn: new Date()
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        const promises = [
            logActivity(userId, 'CHECK_IN', 'Attendance', attendance.id, null, tx)
        ];

        if (!gpsResult.isInside) {
            const hrUsers = await tx.user.findMany({
                where: {
                    role: { name: { in: ['SUPER_ADMIN', 'HR'] } },
                    isActive: true
                }
            });

            for (const hr of hrUsers) {
                promises.push(
                    createNotification(
                        hr.id,
                        'Outside Office Check-In',
                        `Employee checked in from outside office (${gpsResult.distance}m away).`,
                        'WARNING',
                        io,
                        tx
                    )
                );
            }
        }

        await Promise.all(promises);

        return {
            ...attendance,
            gpsInfo: {
                distanceFromOffice: `${gpsResult.distance} meters`,
                isInsideOffice: gpsResult.isInside
            }
        };
    });
}

async function checkOut(userId, latitude, longitude) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
        where: {
            userId,
            date: { gte: today, lt: tomorrow }
        }
    });

    if (!attendance) {
        throw new Error('No check-in found for today. Please check in first.');
    }

    if (attendance.checkOut) {
        throw new Error('Already checked out today');
    }

    if (latitude !== undefined && longitude !== undefined) {
        validateGps(latitude, longitude);
    }

    return prisma.$transaction(async (tx) => {
        const updatedAttendance = await tx.attendance.update({
            where: { id: attendance.id },
            data: { checkOut: new Date() },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        await logActivity(userId, 'CHECK_OUT', 'Attendance', updatedAttendance.id, null, tx);

        return updatedAttendance;
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
