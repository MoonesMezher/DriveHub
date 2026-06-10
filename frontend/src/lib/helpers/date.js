import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('ar')

export const formatDate = (value, format = 'YYYY/MM/DD') => {
  if (!value) return ''
  return dayjs(value).format(format)
}

export const formatDateTime = (value) => formatDate(value, 'YYYY/MM/DD HH:mm')

export const fromNow = (value) => (value ? dayjs(value).fromNow() : '')

export const isPast = (value) => dayjs(value).isBefore(dayjs())

export const addDays = (value, days) => dayjs(value).add(days, 'day').toDate()
