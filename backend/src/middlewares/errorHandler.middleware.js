function errorHandler(err, req, res, next) {
    console.error("❌ Unhandled Error:", err);

    
    const errorResponse = {
        success: false,
        message: "Internal server error"
    };

    
    if (process.env.NODE_ENV !== "production") {
        errorResponse.stack = err.stack;
    }

    
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

    
    if (err instanceof Error) {
        errorResponse.message = err.message;
        
        const statusCode = err.statusCode || 400;
        return res.status(statusCode).json(errorResponse);
    }

    res.status(500).json(errorResponse);
}

module.exports = errorHandler;
