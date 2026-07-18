import Joi from "joi";
import BaseDTO from "../base.dto.js";

class RegisterDTO extends BaseDTO {
    static schema = Joi.object({
        email: Joi.string().email().trim().message('Invalid email').required(),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{4,12}$')).message('Password must be 4-12 characters long').required(),
        username: Joi.string().trim().min(3).max(30)
    })
}

export default RegisterDTO
