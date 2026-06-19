import React, { useState, useEffect } from 'react';
import type { DayData } from '../types';
import { setCustomEventColor } from '../utils/dataProcessor';

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

interface EventModalProps {
    dayData: DayData;
    onClose: () => void;
    onUpdateDayData: (date: Date, events: string[], holiday: string | null, duty: string | null) => void;
}

interface EventWithColor {
    title: string;
    color: string;
}

const PALETTE_COLORS = [
    { label: '하늘', bg: 'bg-sky-600 text-white', dot: 'bg-sky-600' },
    { label: '초록', bg: 'bg-emerald-600 text-white', dot: 'bg-emerald-600' },
    { label: '노랑', bg: 'bg-amber-600 text-white', dot: 'bg-amber-600' },
    { label: '보라', bg: 'bg-violet-600 text-white', dot: 'bg-violet-600' },
    { label: '장미', bg: 'bg-rose-600 text-white', dot: 'bg-rose-600' },
    { label: '청록', bg: 'bg-teal-600 text-white', dot: 'bg-teal-600' },
    { label: '인디고', bg: 'bg-indigo-600 text-white', dot: 'bg-indigo-600' },
    { label: '주황', bg: 'bg-orange-600 text-white', dot: 'bg-orange-600' },
    { label: '빨강', bg: 'bg-red-600 text-white', dot: 'bg-red-600' },
    { label: '회색', bg: 'bg-slate-500 text-white', dot: 'bg-slate-500' },
];

export const EventModal: React.FC<EventModalProps> = ({ dayData, onClose, onUpdateDayData }) => {
    const { date, events, holiday, teacherDuty } = dayData;
    
    const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

    // -------------------------------------------------------------------------
    // 1. Local Edit States
    // -------------------------------------------------------------------------
    const [eventsList, setEventsList] = useState<EventWithColor[]>([]);
    const [holidayName, setHolidayName] = useState<string>('');
    const [dutyTeacher, setDutyTeacher] = useState<string>('');
    const [newEventText, setNewEventText] = useState<string>('');
    const [newEventColor, setNewEventColor] = useState<string>('bg-sky-600 text-white');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Sync state when dayData changes
    useEffect(() => {
        setEventsList(events.map(e => ({
            title: e.fullTitle,
            color: e.color
        })));
        setHolidayName(holiday ? holiday.name : '');
        setDutyTeacher(teacherDuty ? teacherDuty.teacher : '');
        setNewEventText('');
        setNewEventColor('bg-sky-600 text-white');
    }, [dayData, events, holiday, teacherDuty]);

    // -------------------------------------------------------------------------
    // 2. Editor Actions
    // -------------------------------------------------------------------------
    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newEventText.trim();
        if (trimmed) {
            // 최대 4개 제한
            if (eventsList.length >= 4) return;
            
            setEventsList(prev => [...prev, {
                title: trimmed,
                color: newEventColor
            }]);
            setNewEventText('');
        }
    };

    const handleRemoveEvent = (index: number) => {
        setEventsList(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateEventColor = (index: number, chosenColor: string) => {
        setEventsList(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, color: chosenColor };
            }
            return item;
        }));
    };

    const handleSave = () => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const dateVal = date.getDate();
        const dotDateStr = `${year}-${String(month).padStart(2, '0')}-${String(dateVal).padStart(2, '0')}`;

        // 로컬 정밀 색상 매핑 저장
        eventsList.forEach(evt => {
            // 특정 날짜_행사이름 해시
            setCustomEventColor(evt.title, evt.color, dotDateStr);
            // 일반 행사이름 해시
            setCustomEventColor(evt.title, evt.color);
        });

        onUpdateDayData(
            date,
            eventsList.map(e => e.title),
            holidayName.trim() || null,
            dutyTeacher.trim() || null
        );
        setShowSuccessToast(true);
        setTimeout(() => {
            setShowSuccessToast(false);
            onClose(); // 자동으로 모달을 닫아 경험을 상쾌하게 유지
        }, 800);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Area */}
                <header className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase block mb-0.5">🗓️ 구글 스타일 일정 에디터</span>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-1.5" id="modal-title-date">
                            {formattedDate}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
                        id="btn-close-modal"
                    >
                        <XMarkIcon />
                    </button>
                </header>

                {/* Main Content Areas */}
                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    
                    {showSuccessToast && (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-xs font-semibold flex items-center justify-center animate-bounce">
                            ✓ 작성한 일정이 성공적으로 지정한 색으로 저장 및 동기화되었습니다!
                        </div>
                    )}

                    {/* Section 1: Academic Events (Editable List) */}
                    <section className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700">학사 일정 편집 (최대 4개)</label>
                        
                        {/* Event List */}
                        {eventsList.length > 0 ? (
                            <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {eventsList.map((evt, idx) => (
                                    <li 
                                        key={idx} 
                                        className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-xl hover:border-slate-300 transition-all"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 truncate">
                                                <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${evt.color.split(' ')[0]} shadow-sm`} />
                                                <span className="truncate text-sm text-slate-800 font-semibold">{evt.title}</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveEvent(idx)}
                                                className="p-1 rounded-md hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all shrink-0"
                                                title="일정 삭제"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                        
                                        {/* Color Selection Buttons */}
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                            <span className="text-[11px] text-slate-400 font-medium mr-1 select-none">색상 변경:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {PALETTE_COLORS.map(pc => {
                                                    const isActive = evt.color === pc.bg;
                                                    return (
                                                        <button
                                                            key={pc.bg}
                                                            type="button"
                                                            onClick={() => handleUpdateEventColor(idx, pc.bg)}
                                                            className={`w-4 h-4 rounded-full transition-transform hover:scale-125 focus:outline-none ${pc.dot} ${
                                                                isActive ? 'ring-2 ring-slate-800 ring-offset-1 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                                                            }`}
                                                            title={pc.label}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-slate-400 italic bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                                등록된 학사 행사가 없습니다. 아래에서 색상을 선택한 후 일정을 추가해 보세요!
                            </p>
                        )}

                        {/* Add New Event Form */}
                        {eventsList.length < 4 ? (
                            <form onSubmit={handleAddEvent} className="flex flex-col gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl mt-2">
                                <span className="text-xs font-bold text-slate-600">새 일정 빠른 등록</span>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newEventText}
                                        onChange={(e) => setNewEventText(e.target.value)}
                                        placeholder="일정명을 입력하세요 (예: 축제 준비일)"
                                        className="flex-grow px-3 py-2 text-sm border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                                        id="input-new-event"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors shrink-0 text-sm font-bold"
                                        title="일정 추가"
                                        id="btn-add-event"
                                    >
                                        <PlusIcon />
                                        <span className="ml-1">추가</span>
                                    </button>
                                </div>
                                
                                {/* New Event Color Palette */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-400 font-semibold shrink-0 select-none">기본 적용할 색상:</span>
                                    <div className="flex gap-1.5 overflow-x-auto py-1">
                                        {PALETTE_COLORS.map(pc => {
                                            const isSelected = newEventColor === pc.bg;
                                            return (
                                                <button
                                                    key={pc.bg}
                                                    type="button"
                                                    onClick={() => setNewEventColor(pc.bg)}
                                                    className={`w-5 h-5 rounded-full transition-all hover:scale-110 shrink-0 focus:outline-none ${pc.dot} ${
                                                        isSelected ? 'ring-2 ring-slate-800 ring-offset-1 scale-115 shadow-sm' : 'opacity-60 hover:opacity-100'
                                                    }`}
                                                    title={pc.label}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <p className="text-[11px] text-amber-600 font-medium bg-amber-50 p-3 rounded-xl border border-amber-100">
                                ⚠️ 하루에 표시할 학사 일정은 최대 4개까지만 생성할 수 있습니다.
                            </p>
                        )}
                    </section>

                    {/* Section 2: Holiday Name Input */}
                    <section className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">공휴일 / 휴일 설정</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={holidayName}
                                onChange={(e) => setHolidayName(e.target.value)}
                                placeholder="공휴일 또는 재량 휴업일명을 입력하세요 (비우면 평일로 작동)"
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-red-50/10 text-rose-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400"
                                id="input-holiday-name"
                            />
                            {holidayName && (
                                <button 
                                    onClick={() => setHolidayName('')}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500">※ 입력한 날짜의 달력 숫자가 자동으로 붉은색으로 표기됩니다.</p>
                    </section>

                    {/* Section 3: Teacher's On-Duty Name Input */}
                    <section className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">지도 교사 (당직)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={dutyTeacher}
                                onChange={(e) => setDutyTeacher(e.target.value)}
                                placeholder="당직 근무 혹은 전담 지도 교사 이름을 입력하세요"
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                                id="input-duty-teacher"
                            />
                            {dutyTeacher && (
                                <button 
                                    onClick={() => setDutyTeacher('')}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500">※ 당직 교사 이름이 입력되면 달력 셀 하단에 파란색 명찰로 요약되어 출력됩니다.</p>
                    </section>

                </div>

                {/* Footer Controls Area */}
                <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-all"
                        id="btn-modal-cancel"
                    >
                        취소 및 닫기
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 hover:shadow-md transition-all flex items-center gap-1.5"
                        id="btn-modal-save"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        저장하기
                    </button>
                </footer>
            </div>
        </div>
    );
};
