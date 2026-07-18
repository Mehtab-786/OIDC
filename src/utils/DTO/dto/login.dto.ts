import Joi from "joi";
import BaseDTO from "../base.dto.js";

class LoginDTO extends BaseDTO {
    static schema = Joi.object({
        email: Joi.string().trim().email().messages({ 'string.email': 'Email is not valid' }).required(),
        password: Joi.string().trim().pattern(new RegExp('^[a-zA-Z0-9]{4,12}$')).message('Password must be 4-12 characters long').required()
    })
}

export default LoginDTO
