// make generate access & refresh token fucntion,
// genrate decode functions btoh

import crypto from 'node:crypto'

export function generateRandomString(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}
