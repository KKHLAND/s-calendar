import React from 'react';
import {
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek as dateFnsStartOfWeek
} from 'date-fns';

interface HeaderProps {
    viewDate: Date;
    setViewDate: (date: Date) => void;
    startOfWeek: number;
    setStartOfWeek: (day: number) => void;
    schoolName: string;
    onOpenAdmin: () => void;
}

const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const MiniCalendar: React.FC<{ date: Date; startOfWeek: number }> = ({ date, startOfWeek }) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = dateFnsStartOfWeek(monthStart, { weekStartsOn: startOfWeek as 0 | 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: startOfWeek as 0 | 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    let dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    if (startOfWeek === 1) {
        dayHeaders.push(dayHeaders.shift()!);
    }

    return (
        <div className="w-48">
            <h3 className="text-center font-semibold text-sm mb-2 text-slate-700">{format(date, 'MMMM yyyy')}</h3>
            <div className="grid grid-cols-7 text-center text-xs text-slate-500">
                {dayHeaders.map(day => <div key={Math.random()}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 text-center text-xs mt-1">
                {days.map(day => (
                    <div
                        key={day.toString()}
                        className={`
                            w-6 h-4 flex items-center justify-center rounded-full
                            ${isToday(day) ? 'bg-blue-600 text-white' : ''}
                            ${!isSameMonth(day, date) ? 'text-slate-300' : 'text-slate-600'}
                        `}
                    >
                        {format(day, 'd')}
                    </div>
                ))}
            </div>
        </div>
    );
};


export const Header: React.FC<HeaderProps> = ({ viewDate, setViewDate, startOfWeek, setStartOfWeek, schoolName, onOpenAdmin }) => {
    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const goToPreviousMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
    const goToNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
    const goToToday = () => setViewDate(new Date());

    const prevMonth = new Date(currentYear, currentMonth - 1, 1);
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    
    const selectBaseClasses = "bg-white text-slate-700 text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-2.5 py-1.5";
    const buttonBaseClasses = `px-3 py-2 border border-gray-300 bg-white text-slate-700 text-sm font-medium rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`;
    const settingsButtonClasses = `px-3 py-2 border border-sky-200 bg-sky-50 text-sky-700 text-sm font-semibold rounded-md shadow-sm hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 flex items-center transition-colors`;

    return (
        <header className="bg-white shadow-sm sticky top-0 z-20">
             <div className="p-2 flex justify-between items-center gap-4">
                <div className="hidden lg:block">
                    <MiniCalendar date={prevMonth} startOfWeek={startOfWeek} />
                </div>
                <div className="text-center py-3.5 px-4 sm:py-4.5 sm:px-6 rounded-xl shadow-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white select-none flex-grow">
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight">스마트 스쿨 캘린더</h1>
                    <p className="text-sm sm:text-base mt-0.5 leading-snug">
                        {schoolName ? `${schoolName} 학사 일정 관리 시스템` : '누구나 쉽게 사용하는 범용 학사 일정 스마트 관리기'}
                    </p>
                </div>
                <div className="hidden lg:block">
                    <MiniCalendar date={nextMonth} startOfWeek={startOfWeek} />
                </div>
             </div>

            <div className="p-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                 <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <span className="font-bold text-lg sm:text-xl text-slate-700 mr-1 shrink-0">
                        🏫 {schoolName || '학교 미설정'}
                    </span>
                    <button onClick={goToToday} className={buttonBaseClasses} id="btn-header-today">
                        오늘
                    </button>
                    <button onClick={onOpenAdmin} className={settingsButtonClasses} id="btn-header-settings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 animate-spin-hover" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        설정 및 일정 업로드
                    </button>
                </div>
                
                <div className="flex items-center absolute left-1/2 -translate-x-1/2">
                    <button onClick={goToPreviousMonth} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                        <ChevronLeftIcon />
                    </button>
                    <h2 className="text-lg font-semibold text-slate-800 w-32 text-center">
                        {`${currentYear}년 ${currentMonth + 1}월`}
                    </h2>
                    <button onClick={goToNextMonth} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                        <ChevronRightIcon />
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <select value={startOfWeek} onChange={(e) => setStartOfWeek(Number(e.target.value))} className={selectBaseClasses}>
                        <option value={0}>일요일 시작</option>
                        <option value={1}>월요일 시작</option>
                    </select>
                </div>
            </div>
        </header>
    );
};