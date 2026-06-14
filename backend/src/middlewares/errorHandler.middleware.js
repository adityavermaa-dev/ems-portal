function errorHandler(err, req, res, next) {
    console.error("❌ Unhandled Error:", err);

    // Default error structure
    const errorResponse = {
        success: false,
        message: "Internal server error"
    };

    // If we're not in production, include the stack trace for easier debugging
    if (process.env.NODE_ENV !== "production") {
        errorResponse.stack = err.stack;
    }

    // Handle Prisma specific errors
    if (err.code) {
        if (err.code === 'P2002') {
            errorResponse.message = "Unique constraint failed. This record already exists.";
            return res.status(409).json(errorResponse);
        }
        if (err.code === 'P2025') {
            errorResponse.message = "Record not found.";
            return res.status(404).json(errorResponse);
        }
    }

    // Handle standard Error objects (like validations thrown in services)
    if (err instanceof Error) {
        errorResponse.message = err.message;
        // Most of our thrown errors are client-side validation errors, so default to 400
        const statusCode = err.statusCode || 400;
        return res.status(statusCode).json(errorResponse);
    }

    res.status(500).json(errorResponse);
}

module.exports = errorHandler;
