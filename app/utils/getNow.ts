import { DateTimeString } from "~/types/dataTypes"

export const getNow = (): DateTimeString => {
  const now = new Date()

  const padZero = (num: number): string => (num < 10 ? '0' : '') + num

  const year = now.getFullYear()
  const month = padZero(now.getMonth() + 1)
  const day = padZero(now.getDate())

  const hours = padZero(now.getHours())
  const minutes = padZero(now.getMinutes())
  const seconds = padZero(now.getSeconds())

  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`
}
