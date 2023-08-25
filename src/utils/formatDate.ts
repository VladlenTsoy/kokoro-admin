import moment from "moment"

type MomentFormatCheckYear = (date: string, currentYearFormat?: string, formatTwo?: string) => string

/**
 * Вывод даты из двух оталкиваясь от года (FormatOne текущий год)
 *
 * @param date
 * @param currentYearFormat - Текущий год
 * @param formatTwo
 */
export const formatDate: MomentFormatCheckYear = (
    date,
    currentYearFormat = "DD MMM",
    formatTwo = "DD/MM/YY"
) => {
    if(!date) return "Н/Д"
    const years = moment(date).isSame(new Date(), 'year')
    return moment(date).format(!years ? formatTwo : currentYearFormat)
}
