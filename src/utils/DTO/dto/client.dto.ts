import Joi from "joi";
import BaseDTO from "../base.dto.js";

class ClientDTO extends BaseDTO {
    static schema = Joi.object({
        applicationName: Joi.string().trim().min(3).max(100).required(),
        applicationUrl: Joi.string().trim().uri().required(),
        redirectUri: Joi.string().trim().uri().required()
    })
}

export default ClientDTO;
