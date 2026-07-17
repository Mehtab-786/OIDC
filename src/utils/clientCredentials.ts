import crypto from 'node:crypto'

export const generateClientCredentials = () => {
    const clientId = crypto.randomBytes(32).toString("hex");
    const clientSecret = crypto.randomBytes(32).toString("hex");

    return {clientId, clientSecret}
}
