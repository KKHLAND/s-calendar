import React from 'react';
import type { CalendarData, DayData, MultiDayEvent } from '../types';

const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

interface DayCellProps {
    date: Date;
    dayData: DayData | undefined;
    isToday: boolean;
    isCurrentMonth: boolean;
    reservedHeight: string;
    onClick: (dayData: DayData) => void;
}

const DayCell: React.FC<DayCellProps> = ({ date, dayData, isToday, isCurrentMonth, reservedHeight, onClick }) => {
    const dayNumber = date.getDate();
    const dayOfWeek = date.getDay();

    const dayNumberColor = dayData?.holiday ? 'text-red-500' :
        dayOfWeek === 0 ? 'text-red-500' :
        dayOfWeek === 6 ? 'text-blue-500' :
        isCurrentMonth ? 'text-slate-700' : 'text-slate-400';

    const hasContent = (dayData?.events.length ?? 0) > 0 || dayData?.holiday || dayData?.teacherDuty;

    const MAX_ITEMS_IN_CELL = 3;
    const singleDayEvents = dayData?.events || [];
    const displayableItems: { type: 'event' | 'holiday', content: any }[] = [];

    if (dayData?.holiday) {
        displayableItems.push({ type: 'holiday', content: dayData.holiday });
    }
    
    singleDayEvents.forEach(event => {
        if (displayableItems.length < MAX_ITEMS_IN_CELL) {
            displayableItems.push({ type: 'event', content: event });
        }
    });
    
    const totalItems = (dayData?.holiday ? 1 : 0) + singleDayEvents.length;
    const hasMoreItems = totalItems > MAX_ITEMS_IN_CELL;
    const moreItemsCount = totalItems - displayableItems.length;

    const resolvedDayData: DayData = dayData || {
        date,
        events: [],
        holiday: null,
        teacherDuty: null
    };

    return (
        <div
            className={`border-b border-r border-slate-200 flex flex-col relative transition-colors duration-150 cursor-pointer hover:bg-sky-50/30 ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'}`}
            onClick={() => onClick(resolvedDayData)}
            style={{ minHeight: '7.2rem' }}
        >
            <div className="flex-shrink-0 p-0.5 text-center">
                <div className={`text-xs font-semibold mx-auto flex items-center justify-center ${dayNumberColor} ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6' : 'w-6 h-6'}`}>
                    {dayNumber}
                </div>
            </div>
            <div className="flex-grow overflow-y-auto px-1 pb-0.5 space-y-0.5">
                <div style={{ height: reservedHeight }} aria-hidden="true" />
                 {displayableItems.map((item, index) => {
                    if (item.type === 'holiday') {
                        return (
                             <div key={`item-${index}`} className="text-[11px] leading-tight rounded px-1 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis bg-red-100 text-red-700 font-semibold">
                                {item.content.name}
                            </div>
                        )
                    }
                    if (item.type === 'event') {
                        const event = item.content;
                        return (
                            <div key={`item-${index}`} className={`text-[11px] leading-tight rounded px-1 py-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${event.color}`}>
                                {event.title}
                            </div>
                        )
                    }
                    return null;
                })}
                {hasMoreItems && (
                    <div className="text-[10px] leading-tight text-slate-500 font-medium px-1 py-0.2">
                        + {moreItemsCount} more
                    </div>
                )}
            </div>
            {dayData?.teacherDuty && (
                <div className="flex-shrink-0 p-0.5 text-center text-[10px] font-semibold text-slate-500 bg-slate-100/60 truncate border-t border-slate-200 mt-0.5">
                    {dayData.teacherDuty.teacher}
                </div>
            )}
        </div>
    );
};

interface CalendarProps {
    viewDate: Date;
    startOfWeek: number;
    calendarData: CalendarData | null;
    onDayClick: (dayData: DayData) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ viewDate, startOfWeek: startOfWeekProp, calendarData, onDayClick }) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const diff = (startDayOfWeek - startOfWeekProp + 7) % 7;
    startDate.setDate(startDate.getDate() - diff);

    const endDate = new Date(lastDayOfMonth);
    const endDayOfWeek = lastDayOfMonth.getDay();
    const endDiff = (6 - (endDayOfWeek - startOfWeekProp + 7) % 7);
    endDate.setDate(endDate.getDate() + endDiff);

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        currentWeek.push(new Date(currentDate));
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
     if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
    if (startOfWeekProp === 1) {
        dayHeaders.push(dayHeaders.shift()!);
    }

    const today = new Date();
    const todayKey = formatDateKey(today);

    const getWeekMultiDayEvents = (week: Date[]): MultiDayEvent[] => {
        if (!calendarData) return [];
        const weekStart = week[0];
        const weekEnd = week[6];
        return calendarData.multiDayEvents.filter(event => 
            event.start <= weekEnd && event.end >= weekStart
        );
    }

    const dayHeaderTopAreaHeight = '1.8rem'; // Approx height for date number
    const multiDayEventHeight = '1.4rem'; // Height of each multi-day event bar

    return (
        <div className="border-t border-l border-slate-200 bg-white flex flex-col flex-grow shadow-lg rounded-xl overflow-hidden">
            <div className="grid grid-cols-7">
                {dayHeaders.map((day) => (
                    <div key={day} className={`bg-sky-100 text-center py-1 text-xs sm:text-sm font-bold border-r border-b border-slate-200 ${day === '일' ? 'text-red-500' : day === '토' ? 'text-blue-500' : 'text-slate-600'}`}>
                        {day}
                    </div>
                ))}
            </div>
            <div className="flex-grow grid" style={{gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))`}}>
                {weeks.map((week, weekIndex) => {
                    const multiDayEventsInWeek = getWeekMultiDayEvents(week);
                    const maxLanes = multiDayEventsInWeek.length > 0 ? Math.max(...multiDayEventsInWeek.map(e => e.lane)) + 1 : 0;
                    const reservedHeight = `calc(${maxLanes} * ${multiDayEventHeight})`;

                    return (
                        <div key={weekIndex} className="grid grid-cols-7 relative border-b border-slate-200">
                            {/* Multi-day event bars */}
                            {multiDayEventsInWeek.map(event => {
                                const weekStart = new Date(week[0]);
                                weekStart.setHours(0,0,0,0);

                                const eventStart = new Date(event.start);
                                eventStart.setHours(0,0,0,0);
                                
                                const eventEnd = new Date(event.end);
                                eventEnd.setHours(0,0,0,0);

                                const startDayIndex = Math.max(0, Math.round((eventStart.getTime() - weekStart.getTime()) / (1000 * 3600 * 24)));
                                const endDayIndex = Math.min(6, Math.round((eventEnd.getTime() - weekStart.getTime()) / (1000 * 3600 * 24)));
                                
                                const startCol = startDayIndex;
                                const span = endDayIndex - startDayIndex + 1;
                                
                                if (span <= 0) return null;

                                return (
                                    <div 
                                        key={event.id}
                                        className={`absolute text-xs p-1 rounded overflow-hidden text-ellipsis whitespace-nowrap font-medium ${event.color}`}
                                        style={{ 
                                            top: `calc(${dayHeaderTopAreaHeight} + ${event.lane} * ${multiDayEventHeight})`, 
                                            left: `calc(${(100 / 7) * startCol}% + 2px)`,
                                            width: `calc(${(100 / 7) * span}% - 4px)`,
                                            height: `calc(${multiDayEventHeight} - 2px)`,
                                            zIndex: 5
                                        }}
                                    >
                                        {event.title}
                                    </div>
                                )
                            })}

                            {week.map((date) => {
                                const dateKey = formatDateKey(date);
                                const dayData = calendarData?.dayDataMap.get(dateKey);
                                return (
                                    <DayCell
                                        key={dateKey}
                                        date={date}
                                        dayData={dayData}
                                        isToday={dateKey === todayKey}
                                        isCurrentMonth={date.getMonth() === month}
                                        reservedHeight={reservedHeight}
                                        onClick={onDayClick}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};