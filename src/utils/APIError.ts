class APIError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(statusCode: number, message: string) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }

    static badRequest(message = "Bad Request") {
        return new APIError(400, message)
    }

    static conflict(message = "Conflict") {
        return new APIError(409, message)
    }

    static notFound(message = "Not Found") {
        return new APIError(404, message)
    }

    static unauthorized(message = "Unauthorized") {
        return new APIError(401, message)
    }

    static internalError(message = "Internal Server Error") {
        return new APIError(500, message)
    }
}

export default APIError