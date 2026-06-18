const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; 
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
