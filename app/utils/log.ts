import { getNow } from '~/utils/dateAndTime'

/**
 * Logs the provided arguments to the console with a timestamp.
 *
 * @param {...any[]} args - The arguments to be logged.
 * @return {void} This function does not return anything.
 */
export const log = (...args: any[]): void => {
  console.log(`[${dateTime()}]`, ...args)
}

const dateTime = (): string => getNow().replace('_', ' ')
