import Joi from "joi";

class BaseDTO {
    static schema = Joi.object({})

    static validate(data: Record<string, unknown>) {
        const { error, value } = this.schema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        })
        if (error) {
            let errors = error.details.map(err => err.message)
            return { errors, value: null }
        }

        return { errors: null, value }
    }
}

export default BaseDTO
