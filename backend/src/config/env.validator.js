const requiredEnvVars = [
    "DATABASE_URL",
    "JWT_SECRET"
];

function validateEnv() {
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingVars.length > 0) {
        console.error("❌ CRITICAL ERROR: Missing required environment variables:");
        missingVars.forEach(envVar => console.error(`   - ${envVar}`));
        console.error("Please provide them in your .env file or environment configuration.");
        process.exit(1);
    }
    
    if (process.env.NODE_ENV === "production") {
        console.log("🔒 Running in PRODUCTION mode");
    } else {
        console.log("⚠️ Running in DEVELOPMENT mode. Do not use this in production.");
    }
}

module.exports = { validateEnv };
