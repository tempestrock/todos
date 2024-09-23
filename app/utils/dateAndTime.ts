import { LANG_DE } from './language'
import { DateTimeString } from '~/types/dataTypes'

export const getNow = (): DateTimeString => {
  const now = new Date()

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Berlin', // Replace with your desired time zone
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }

  const formatter = new Intl.DateTimeFormat('en-GB', options)
  const parts = formatter.formatToParts(now)

  const dateParts: { [key: string]: string } = {}
  parts.forEach(({ type, value }) => {
    if (type !== 'literal') {
      dateParts[type] = value
    }
  })

  const year = dateParts.year
  const month = dateParts.month
  const day = dateParts.day
  const hours = dateParts.hour
  const minutes = dateParts.minute
  const seconds = dateParts.second

  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`
}

export const getNiceDateTime = (dateTime: DateTimeString, language: string): string => {
  const [datePart, timePart] = dateTime.split('_')
  const [year, month, day] = datePart.split('-')
  const [hours, minutes] = timePart.split(':')

  // Create a date in the specified time zone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Berlin', // Replace with your desired time zone
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  const formatter = new Intl.DateTimeFormat('en-GB', options)
  const todayParts = formatter.formatToParts(new Date())
  const todayPartsMap: { [key: string]: string } = {}
  todayParts.forEach(({ type, value }) => {
    if (type !== 'literal') {
      todayPartsMap[type] = value
    }
  })

  const todayYear = todayPartsMap.year
  const todayMonth = todayPartsMap.month
  const todayDay = todayPartsMap.day

  const isToday = day === todayDay && month === todayMonth && year === todayYear

  const isCurrentYear = year === todayYear

  const time = `${hours}:${minutes}`

  if (isToday) {
    return `${language === LANG_DE ? 'heute' : 'today'}, ${time}`
  } else if (isCurrentYear) {
    return `${day}.${month}., ${time}`
  } else {
    return `${day}.${month}.${year}, ${time}`
  }
}
