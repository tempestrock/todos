/**
 * Recursively prints the contents of an object.
 * @param obj the object to print
 * @param name (optional) some name to print before the actual object data
 */
export const printObject = (obj: any, name = '') => {
  console.log(name ? `${name}:` : '', JSON.stringify(obj, replacer, 2))
}

const replacer = (_key: string, value: any) => {
  if (typeof value === 'object' && value !== null) {
    return JSON.parse(JSON.stringify(value))
  }
  return value
}
