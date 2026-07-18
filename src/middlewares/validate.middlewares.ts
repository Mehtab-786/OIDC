import APIError from "../utils/APIError.js";
import BaseDTO from "../utils/DTO/base.dto.js";
import { type Request, type Response, type NextFunction } from 'express'


function validate(DTOclass: typeof BaseDTO) {
    return (req: Request, res: Response, next: NextFunction) => {
        const { errors, value } = DTOclass.validate(req.body)

        if (errors) {
            throw APIError.badRequest(errors.join("; "))
        }

        req.body = value
        next()
    }
}

export default validate;
