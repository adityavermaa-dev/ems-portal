function validateGps(latitude, longitude) {
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
        throw new Error("Latitude and longitude are required");
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
        throw new Error("Latitude and longitude must be valid numbers");
    }

    if (lat < -90 || lat > 90) {
        throw new Error("Latitude must be between -90 and 90 degrees");
    }

    if (lon < -180 || lon > 180) {
        throw new Error("Longitude must be between -180 and 180 degrees");
    }
}

module.exports = {
    validateGps
};
