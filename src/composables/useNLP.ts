import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

export interface ParsedResult {
    content: string
    date: Date | null
    dateStr: string
    phone: string | null
    priority: number
}

export function useNLP() {
    function parseInput(text: string): ParsedResult {
        if (!text) return { content: '', date: null, dateStr: '', phone: null, priority: 4 }

        let c = text
        let ph: string | null = null
        let d: Date | null = null
        let p = 4

        // 1. Phone Number Extraction
        const phM = c.match(/(010|02|0[3-6][1-5])-?(\d{3,4})-?(\d{4})/)
        if (phM && phM[0]) {
            ph = phM[0]
            c = c.replace(phM[0], '').trim()
        }

        const now = new Date()

        // 2. Weekday Parsing
        const dayMap: Record<string, number> = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 }
        const weekM = c.match(/(이번주|다음주|다다음주)\s*([일월화수목금토])요일?/)

        if (weekM && weekM[1] && weekM[2]) {
            const targetDay = dayMap[weekM[2]]
            if (targetDay !== undefined) {
                const currentDay = now.getDay()
                let offset = targetDay - currentDay

                if (weekM[1] === '이번주') {
                    if (offset < 0) offset += 7
                } else if (weekM[1] === '다음주') {
                    offset += 7
                } else if (weekM[1] === '다다음주') {
                    offset += 14
                }
                d = new Date()
                d.setDate(d.getDate() + offset)
                c = c.replace(weekM[0], '').trim()
            }
        }

        // 3. Date Parsing
        const ymd = c.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
        if (ymd && ymd[1] && ymd[2] && ymd[3]) {
            d = new Date()
            d.setFullYear(parseInt(ymd[1]))
            d.setMonth(parseInt(ymd[2]) - 1)
            d.setDate(parseInt(ymd[3]))
            c = c.replace(ymd[0], '').trim()
        } else {
            const md = c.match(/(\d{1,2})\/(\d{1,2})/)
            if (md && md[1] && md[2]) {
                d = new Date()
                d.setMonth(parseInt(md[1]) - 1)
                d.setDate(parseInt(md[2]))
                c = c.replace(md[0], '').trim()
            } else if (c.match(/내일/)) {
                d = new Date()
                d.setDate(d.getDate() + 1)
                c = c.replace(/내일/, '').trim()
            } else if (c.match(/오늘/)) {
                d = new Date()
                c = c.replace(/오늘/, '').trim()
            }
        }

        if (!d) d = new Date()

        // 4. Time Parsing
        const explicitTimeM = c.match(/(오전|오후)?\s*(\d{1,2})(?:시|:|[\s]+)(\d{1,2})(?:분)?/)
        const continuousTimeM = c.match(/(오전|오후)?\s*(\d{1,4})(?:시|:|분)?/)

        if (explicitTimeM && explicitTimeM[2] && explicitTimeM[3]) {
            let h = parseInt(explicitTimeM[2])
            let m = parseInt(explicitTimeM[3])
            const amp = explicitTimeM[1]

            if (amp === '오후' && h < 12) h += 12
            if (amp === '오전' && h === 12) h = 0

            d.setHours(h, m, 0, 0)
            c = c.replace(explicitTimeM[0], '').trim()
        } else if (continuousTimeM && (c.includes('시') || c.includes(':') || continuousTimeM[1] || (continuousTimeM[2] && continuousTimeM[2].length >= 3))) {
            const numStr = continuousTimeM[2]
            if (numStr) {
                let num = parseInt(numStr)
                let h = 0, m = 0
                const amp = continuousTimeM[1]

                if (num >= 100) {
                    h = Math.floor(num / 100)
                    m = num % 100
                } else {
                    h = num
                    m = 0
                }

                if (h < 24 && m < 60) {
                    if (amp === '오후' && h < 12) h += 12
                    if (amp === '오전' && h === 12) h = 0
                    d.setHours(h, m, 0, 0)
                    c = c.replace(continuousTimeM[0], '').trim()
                }
            }
        }

        // 5. Priority Check
        if (c.includes('!!1')) {
            p = 1
            c = c.replace('!!1', '').trim()
        }

        const dateStr = dayjs(d).format('MM/DD HH:mm')

        return {
            content: c,
            phone: ph,
            date: d,
            dateStr,
            priority: p
        }
    }

    return { parseInput }
}
