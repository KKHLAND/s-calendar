import React, { useState, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { EventModal } from './components/EventModal';
import { AdminPanel } from './components/AdminPanel';
import { 
    processCalendarData, 
    parseEventsCsv, 
    parseHolidaysCsv, 
    parseTeachersCsv,
    serializeEventsCsv,
    serializeHolidaysCsv,
    serializeDutiesCsv
} from './utils/dataProcessor';
import type { CalendarData, DayData } from './types';
import { rawEventsCsv, rawHolidaysCsv, rawDutiesCsv } from './data/schoolData';

const App: React.FC = () => {
    // -------------------------------------------------------------------------
    // 1. Local Storage Persistence & State Setup
    // -------------------------------------------------------------------------
    const [schoolName, setSchoolName] = useState<string>(() => {
        // 기본값: 빈값(학교 미설정)으로 초기화하며, 저장 정보가 있을 시 로드
        const saved = localStorage.getItem('school_calendar_name');
        return saved !== null ? saved : '';
    });
    
    const [eventsCsvStr, setEventsCsvStr] = useState<string>(() => {
        const saved = localStorage.getItem('school_calendar_events_csv');
        return saved !== null ? saved : rawEventsCsv;
    });

    const [holidaysCsvStr, setHolidaysCsvStr] = useState<string>(() => {
        const saved = localStorage.getItem('school_calendar_holidays_csv');
        return saved !== null ? saved : rawHolidaysCsv;
    });

    const [dutiesCsvStr, setDutiesCsvStr] = useState<string>(() => {
        const saved = localStorage.getItem('school_calendar_duties_csv');
        return saved !== null ? saved : rawDutiesCsv;
    });

    const [isAdminOpen, setIsAdminOpen] = useState(false);

    // -------------------------------------------------------------------------
    // 2. Data Parsing Hooks
    // -------------------------------------------------------------------------
    const rawEvents = useMemo(() => parseEventsCsv(eventsCsvStr), [eventsCsvStr]);
    const holidays = useMemo(() => parseHolidaysCsv(holidaysCsvStr), [holidaysCsvStr]);
    const duties = useMemo(() => parseTeachersCsv(dutiesCsvStr), [dutiesCsvStr]);

    const [viewDate, setViewDate] = useState(new Date()); // 오늘(현재) 날짜로 설정
    const [startOfWeek, setStartOfWeek] = useState(0); // 0 for Sunday, 1 for Monday
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

    const calendarData: CalendarData | null = useMemo(() => {
        return processCalendarData(rawEvents, holidays, duties);
    }, [rawEvents, holidays, duties]);

    const handleDayClick = useCallback((dayData: DayData) => {
        setSelectedDay(dayData);
    }, []);

    // -------------------------------------------------------------------------
    // 3. User Commands / Callbacks
    // -------------------------------------------------------------------------
    const handleSaveData = useCallback((name: string, events: string, holidays: string, duties: string) => {
        setSchoolName(name);
        setEventsCsvStr(events);
        setHolidaysCsvStr(holidays);
        setDutiesCsvStr(duties);

        localStorage.setItem('school_calendar_name', name);
        localStorage.setItem('school_calendar_events_csv', events);
        localStorage.setItem('school_calendar_holidays_csv', holidays);
        localStorage.setItem('school_calendar_duties_csv', duties);
    }, []);

    const handleResetData = useCallback(() => {
        setSchoolName('');
        setEventsCsvStr('');
        setHolidaysCsvStr('');
        setDutiesCsvStr('');

        localStorage.setItem('school_calendar_name', '');
        localStorage.setItem('school_calendar_events_csv', '');
        localStorage.setItem('school_calendar_holidays_csv', '');
        localStorage.setItem('school_calendar_duties_csv', '');
        localStorage.removeItem('school_calendar_custom_event_colors');
        setSelectedDay(null);
    }, []);

    // 특정 개별 날짜 수정 실시간 반영 핸들러 (구글 캘린더 스타일)
    const handleUpdateDayData = useCallback((targetDate: Date, updatedEvents: string[], updatedHoliday: string | null, updatedDuty: string | null) => {
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const dateVal = targetDate.getDate();

        const dotDateStr = `${year}.${String(month).padStart(2, '0')}.${String(dateVal).padStart(2, '0')}`;
        const dotShortDateStr = `${year}.${month}.${dateVal}`;

        // 1. 학사일정 업데이트
        let nextRawEvents = [...rawEvents];
        const eventIdx = nextRawEvents.findIndex(e => {
            const normalized = e.date.replace(/\s/g, '').replace(/-/g, '.');
            return normalized === dotDateStr || normalized === dotShortDateStr;
        });
        
        if (updatedEvents.length > 0) {
            if (eventIdx > -1) {
                nextRawEvents[eventIdx] = { date: nextRawEvents[eventIdx].date, events: updatedEvents };
            } else {
                nextRawEvents.push({ date: dotDateStr, events: updatedEvents });
            }
        } else {
            if (eventIdx > -1) {
                nextRawEvents.splice(eventIdx, 1);
            }
        }

        // 2. 공휴일 업데이트
        let nextHolidays = [...holidays];
        const holIdx = nextHolidays.findIndex(h => {
            return h.date.getFullYear() === year && h.date.getMonth() + 1 === month && h.date.getDate() === dateVal;
        });

        if (updatedHoliday && updatedHoliday.trim() !== '') {
            if (holIdx > -1) {
                nextHolidays[holIdx] = { date: targetDate, name: updatedHoliday.trim() };
            } else {
                nextHolidays.push({ date: targetDate, name: updatedHoliday.trim() });
            }
        } else {
            if (holIdx > -1) {
                nextHolidays.splice(holIdx, 1);
            }
        }

        // 3. 당직교사 업데이트
        let nextDuties = [...duties];
        const dutyIdx = nextDuties.findIndex(d => {
            return d.date.getFullYear() === year && d.date.getMonth() + 1 === month && d.date.getDate() === dateVal;
        });

        if (updatedDuty && updatedDuty.trim() !== '') {
            if (dutyIdx > -1) {
                nextDuties[dutyIdx] = { date: targetDate, teacher: updatedDuty.trim() };
            } else {
                nextDuties.push({ date: targetDate, teacher: updatedDuty.trim() });
            }
        } else {
            if (dutyIdx > -1) {
                nextDuties.splice(dutyIdx, 1);
            }
        }

        const newEventsCsv = serializeEventsCsv(nextRawEvents);
        const newHolidaysCsv = serializeHolidaysCsv(nextHolidays);
        const newDutiesCsv = serializeDutiesCsv(nextDuties);

        handleSaveData(schoolName, newEventsCsv, newHolidaysCsv, newDutiesCsv);

        // UI 모달 리로드 (사용자가 방금 저장한 구조 즉각 활성화)
        const freshEvents = updatedEvents.map(title => ({
            title: title.length > 15 ? title.substring(0, 12) + '...' : title,
            fullTitle: title,
            color: 'bg-sky-600 text-white'
        }));
        const freshHoliday = updatedHoliday ? { date: targetDate, name: updatedHoliday } : null;
        const freshDuty = updatedDuty ? { date: targetDate, teacher: updatedDuty } : null;

        setSelectedDay({
            date: targetDate,
            events: freshEvents,
            holiday: freshHoliday,
            teacherDuty: freshDuty
        });

    }, [rawEvents, holidays, duties, schoolName, handleSaveData]);

    return (
        <div className="bg-slate-50 h-screen font-sans text-slate-800 flex flex-col">
            <Header
                viewDate={viewDate}
                setViewDate={setViewDate}
                startOfWeek={startOfWeek}
                setStartOfWeek={setStartOfWeek}
                schoolName={schoolName}
                onOpenAdmin={() => setIsAdminOpen(true)}
            />
            <main className="flex-grow p-1 sm:p-2 lg:p-4 overflow-y-auto">
                <Calendar
                    viewDate={viewDate}
                    startOfWeek={startOfWeek}
                    calendarData={calendarData}
                    onDayClick={handleDayClick}
                />
            </main>
            <footer className="p-2 text-center text-xs text-slate-500 border-t border-slate-200">
                © 2025 KH KIM. All Rights Reserved.
            </footer>
            {selectedDay && (
                <EventModal 
                    dayData={selectedDay} 
                    onClose={() => setSelectedDay(null)} 
                    onUpdateDayData={handleUpdateDayData}
                />
            )}
            
            <AdminPanel
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                schoolName={schoolName}
                onSaveData={handleSaveData}
                onResetData={handleResetData}
                currentEventsCsv={eventsCsvStr}
                currentHolidaysCsv={holidaysCsvStr}
                currentDutiesCsv={dutiesCsvStr}
            />
        </div>
    );
};

export default App;