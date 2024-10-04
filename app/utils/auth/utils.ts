import { randomBytes } from 'crypto'

export function generateSessionId() {
  return randomBytes(16).toString('hex')
}
