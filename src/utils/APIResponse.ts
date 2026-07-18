import { type Response } from "express";

class APIResponse {
    static ok(res: Response, message: string, data: unknown | null) {
        return res.status(200).json({
            success: true,
            statusCode: 200,
            message,
            data
        })
    }

    static created(res: Response, message: string, data: unknown | null) {
        return res.status(201).json({
            success: true,
            message,
            data
        })
    }
}

export default APIResponse;
