/**
 * Generates a (very likely) unique 10-digit identifier.
 *
 * @return {string} A unique 10-digit identifier.
 */
export const getUid = (): string => {
  let digits = ''
  for (let i = 0; i < 10; i++) {
    digits += Math.floor(Math.random() * 10).toString()
  }
  return digits
}
