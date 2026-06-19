import type { RawSchoolEvent, Holiday, TeacherDuty, SchoolEvent, DayData, CalendarData, MultiDayEvent } from '../types';

const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const cleanedDateStr = dateStr.replace(/\./g, '-').replace(/\s/g, '');
    const parts = cleanedDateStr.split('-').filter(p => p);
    if (parts.length === 3) {
        const [year, month, day] = parts.map(p => parseInt(p, 10));
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month - 1, day);
        }
    }
    return null;
};

const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const parseCsvLine = (line: string): string[] => {
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    fields.push(currentField.trim());
    return fields.map(f => f.replace(/^"|"$/g, ''));
};


export const parseEventsCsv = (csvText: string): RawSchoolEvent[] => {
    const lines = csvText.trim().split('\n').slice(1);
    const events: RawSchoolEvent[] = [];
    lines.forEach(line => {
        const [date, ...eventParts] = parseCsvLine(line);
        const eventStrings = eventParts.map(e => e.trim().replace(/"/g, '')).filter(e => e);
        if (date && eventStrings.length > 0) {
            events.push({ date, events: eventStrings });
        }
    });
    return events;
};

export const parseHolidaysCsv = (csvText: string): Holiday[] => {
    const lines = csvText.trim().split('\n').slice(1);
    const holidays: Holiday[] = [];
    lines.forEach(line => {
        const [dateStr, name] = line.split(',');
        const date = parseDate(dateStr);
        if (date && name) {
            holidays.push({ date, name: name.trim() });
        }
    });
    return holidays;
};

export const parseTeachersCsv = (csvText: string): TeacherDuty[] => {
    const lines = csvText.trim().split('\n').slice(1);
    const duties: TeacherDuty[] = [];
    lines.forEach(line => {
        const [dateStr, _day, teacher] = line.split(',');
        const date = parseDate(dateStr);
        if (date && teacher && teacher.trim()) {
            duties.push({ date, teacher: teacher.trim() });
        }
    });
    return duties;
};

const EVENT_COLORS = [
    { bg: 'bg-sky-600', text: 'text-white' },
    { bg: 'bg-emerald-600', text: 'text-white' },
    { bg: 'bg-amber-600', text: 'text-white' },
    { bg: 'bg-violet-600', text: 'text-white' },
    { bg: 'bg-rose-600', text: 'text-white' },
    { bg: 'bg-teal-600', text: 'text-white' },
    { bg: 'bg-indigo-600', text: 'text-white' },
    { bg: 'bg-orange-600', text: 'text-white' },
];

export const getCustomEventColor = (eventTitle: string, dateKey?: string): string | null => {
    try {
        const saved = localStorage.getItem('school_calendar_custom_event_colors');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (dateKey && parsed[`${dateKey}_${eventTitle}`]) {
                return parsed[`${dateKey}_${eventTitle}`];
            }
            if (parsed[eventTitle]) {
                return parsed[eventTitle];
            }
        }
    } catch (e) {
        // ignore
    }
    return null;
};

export const setCustomEventColor = (eventTitle: string, color: string, dateKey?: string) => {
    try {
        const saved = localStorage.getItem('school_calendar_custom_event_colors');
        const parsed = saved ? JSON.parse(saved) : {};
        if (dateKey) {
            parsed[`${dateKey}_${eventTitle}`] = color;
        } else {
            parsed[eventTitle] = color;
        }
        localStorage.setItem('school_calendar_custom_event_colors', JSON.stringify(parsed));
    } catch (e) {
        // ignore
    }
};

const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; 
  }
  return Math.abs(hash);
};

const getEventColor = (eventTitle: string, dateKey?: string): string => {
    // 1. 사용자 커스텀 지정 색이 있는 경우 우선 반영
    const customColor = getCustomEventColor(eventTitle, dateKey);
    if (customColor) {
        return customColor;
    }

    const specialKeywords: { [key: string]: string } = {
        '고사': 'bg-red-600 text-white',
        '평가': 'bg-red-600 text-white',
        '수능': 'bg-red-800 text-white font-bold',
        '방학': 'bg-blue-700 text-white',
        '개학': 'bg-blue-700 text-white',
        '졸업': 'bg-purple-700 text-white',
        '입학': 'bg-purple-700 text-white',
    };

    for (const keyword in specialKeywords) {
        if (eventTitle.includes(keyword)) {
            return specialKeywords[keyword];
        }
    }

    const hash = simpleHash(eventTitle);
    const color = EVENT_COLORS[hash % EVENT_COLORS.length];
    return `${color.bg} ${color.text}`;
};

const findAndProcessMultiDayEvents = (dayDataMap: Map<string, DayData>): { multiDayEvents: MultiDayEvent[], processedEventIds: Set<string> } => {
    const multiDayEvents: Omit<MultiDayEvent, 'lane'>[] = [];
    const processedEventIds = new Set<string>();

    const sortedDates = Array.from(dayDataMap.keys()).sort();

    for (const dateKey of sortedDates) {
        const dayData = dayDataMap.get(dateKey);
        if (!dayData) continue;

        for (const event of dayData.events) {
            const eventId = `${dateKey}_${event.fullTitle}`;
            if (processedEventIds.has(eventId)) continue;

            const baseTitleMatch = event.fullTitle.match(/^(.*?)(\s*\d+일차|\s*\(\d+\)|1일차)?$/);
            const baseTitle = baseTitleMatch ? baseTitleMatch[1].trim() : event.fullTitle;
            
            if (!baseTitle) continue;

            let endDate = new Date(dayData.date);
            const currentRunEventIds = [eventId];

            let currentCheckDate = new Date(dayData.date);
            currentCheckDate.setDate(currentCheckDate.getDate() + 1);
            let nextDateKey = formatDateKey(currentCheckDate);

            while (dayDataMap.has(nextDateKey)) {
                const nextDayData = dayDataMap.get(nextDateKey)!;
                const nextDayEvent = nextDayData.events.find(e => {
                     const nextBaseTitleMatch = e.fullTitle.match(/^(.*?)(\s*\d+일차|\s*\(\d+\))?$/);
                     return nextBaseTitleMatch && nextBaseTitleMatch[1].trim() === baseTitle;
                });

                if (nextDayEvent) {
                    endDate = new Date(nextDayData.date);
                    currentRunEventIds.push(`${nextDateKey}_${nextDayEvent.fullTitle}`);
                } else {
                    break;
                }
                currentCheckDate.setDate(currentCheckDate.getDate() + 1);
                nextDateKey = formatDateKey(currentCheckDate);
            }
            
            if (endDate > dayData.date) {
                multiDayEvents.push({
                    id: `${baseTitle}_${formatDateKey(dayData.date)}`,
                    start: dayData.date,
                    end: endDate,
                    title: baseTitle,
                    color: getEventColor(event.fullTitle, formatDateKey(dayData.date)),
                });
                currentRunEventIds.forEach(id => processedEventIds.add(id));
            }
        }
    }
    
    const laneManagedEvents: MultiDayEvent[] = [];
    multiDayEvents.sort((a,b) => a.start.getTime() - b.start.getTime());

    for (const event of multiDayEvents) {
        let lane = 0;
        while(true) {
            const conflictingEvent = laneManagedEvents.find(e => e.lane === lane && !(event.start > e.end || event.end < e.start));
            if (!conflictingEvent) {
                laneManagedEvents.push({ ...event, lane });
                break;
            }
            lane++;
        }
    }

    return { multiDayEvents: laneManagedEvents, processedEventIds };
};


export const processCalendarData = (rawEvents: RawSchoolEvent[], holidays: Holiday[], duties: TeacherDuty[]): CalendarData => {
    const dayDataMap = new Map<string, DayData>();

    rawEvents.forEach(rawEvent => {
        const date = parseDate(rawEvent.date);
        if (date) {
            const key = formatDateKey(date);
            if (!dayDataMap.has(key)) {
                dayDataMap.set(key, { date, events: [], holiday: null, teacherDuty: null });
            }
            const dayData = dayDataMap.get(key)!;
            rawEvent.events.forEach(eventTitle => {
                dayData.events.push({
                    title: eventTitle.length > 15 ? eventTitle.substring(0, 12) + '...' : eventTitle,
                    fullTitle: eventTitle,
                    color: getEventColor(eventTitle, key),
                });
            });
        }
    });

    holidays.forEach(holiday => {
        const key = formatDateKey(holiday.date);
        if (!dayDataMap.has(key)) {
            dayDataMap.set(key, { date: holiday.date, events: [], holiday: null, teacherDuty: null });
        }
        dayDataMap.get(key)!.holiday = holiday;
    });

    duties.forEach(duty => {
        const key = formatDateKey(duty.date);
        if (!dayDataMap.has(key)) {
            dayDataMap.set(key, { date: duty.date, events: [], holiday: null, teacherDuty: null });
        }
        dayDataMap.get(key)!.teacherDuty = duty;
    });

    const { multiDayEvents, processedEventIds } = findAndProcessMultiDayEvents(dayDataMap);

    // Filter out multi-day events from day-specific lists
    for (const [key, dayData] of dayDataMap.entries()) {
        dayData.events = dayData.events.filter(event => {
            const eventId = `${key}_${event.fullTitle}`;
            return !processedEventIds.has(eventId);
        });
    }

    return { dayDataMap, multiDayEvents };
};

// -------------------------------------------------------------------------
// CSV Serialization Utilities (For custom modifications)
// -------------------------------------------------------------------------

export const serializeEventsCsv = (events: RawSchoolEvent[]): string => {
    let csv = "날짜,행사1,행사2,행사3,행사4\n";
    events.forEach(item => {
        const datePart = item.date;
        const cols = [datePart];
        for (let i = 0; i < 4; i++) {
            cols.push(item.events[i] || "");
        }
        csv += cols.map(c => c.includes(",") ? `"${c}"` : c).join(",") + "\n";
    });
    return csv;
};

export const serializeHolidaysCsv = (holidays: Holiday[]): string => {
    let csv = "날짜,휴일\n";
    holidays.forEach(item => {
        const y = item.date.getFullYear();
        const m = String(item.date.getMonth() + 1).padStart(2, '0');
        const d = String(item.date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        csv += `${dateStr},${item.name}\n`;
    });
    return csv;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const serializeDutiesCsv = (duties: TeacherDuty[]): string => {
    let csv = "날짜,요일,지도 교사,종류,비고\n";
    duties.forEach(item => {
        const y = item.date.getTime() ? item.date.getFullYear() : new Date().getFullYear();
        const m = item.date.getTime() ? String(item.date.getMonth() + 1).padStart(2, '0') : "01";
        const d = item.date.getTime() ? String(item.date.getDate()).padStart(2, '0') : "01";
        const dateStr = `${y}.${m}.${d}`;
        const dayIdx = item.date.getTime() ? item.date.getDay() : 0;
        const dayOfWeek = WEEKDAYS[dayIdx];
        csv += `${dateStr},${dayOfWeek},${item.teacher},평일초과,\n`;
    });
    return csv;
};
