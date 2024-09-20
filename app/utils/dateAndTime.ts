import { DateTimeString } from '~/types/dataTypes'

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

export const getNiceDateTime = (dateTime: DateTimeString): string => {
  const [datePart, timePart] = dateTime.split('_')
  const [year, month, day] = datePart.split('-')
  const [hours, minutes] = timePart.split(':')
  const time = `${hours}:${minutes}`

  const inputDate = new Date(Number(year), Number(month) - 1, Number(day))
  const today = new Date()

  const isToday =
    inputDate.getDate() === today.getDate() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getFullYear() === today.getFullYear()

  const isCurrentYear = inputDate.getFullYear() === today.getFullYear()

  if (isToday) {
    return `today, ${time}`
  } else if (isCurrentYear) {
    return `${day}.${month}., ${time}`
  } else {
    return `${day}.${month}.${year}, ${time}`
  }
}
