const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Check if coordinates are inside office radius
 * @returns {{ distance: number, isInside: boolean }}
 */
function isInsideOffice(lat, lon) {
    const officeLat = parseFloat(process.env.OFFICE_LATITUDE) || 28.6139;
    const officeLon = parseFloat(process.env.OFFICE_LONGITUDE) || 77.2090;
    const officeRadius = parseFloat(process.env.OFFICE_RADIUS_METERS) || 200;

    const distance = calculateDistance(lat, lon, officeLat, officeLon);

    return {
        distance: Math.round(distance * 100) / 100,
        isInside: distance <= officeRadius
    };
}

module.exports = { calculateDistance, isInsideOffice };
