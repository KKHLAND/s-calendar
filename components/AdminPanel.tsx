import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    schoolName: string;
    onSaveData: (schoolName: string, eventsCsv: string, holidaysCsv: string, dutiesCsv: string) => void;
    onResetData: () => void;
    currentEventsCsv: string;
    currentHolidaysCsv: string;
    currentDutiesCsv: string;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DocumentArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m0 0l-3-3m3 3l3-3m-12 8h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({
    isOpen,
    onClose,
    schoolName: initialSchoolName,
    onSaveData,
    onResetData,
    currentEventsCsv,
    currentHolidaysCsv,
    currentDutiesCsv
}) => {
    const [schoolName, setSchoolName] = useState(initialSchoolName);
    const [dragActive, setDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Excel Template Download Handler
    const handleDownloadTemplate = () => {
        try {
            const wb = XLSX.book_new();

            // 1. 학사일정 시트 데이터 및 헤더 정의
            const eventsCols = ["날짜", "행사1", "행사2", "행사3", "행사4"];
            const eventsData = [
                { "날짜": "2025.10.16", "행사1": "중간고사 1일차", "행사2": "교직원 연수", "행사3": "", "행사4": "" },
                { "날짜": "2025.10.17", "행사1": "중간고사 2일차", "행사2": "", "행사3": "", "행사4": "" },
                { "날짜": "2025.10.20", "행사1": "중간고사 3일차", "행사2": "", "행사3": "", "행사4": "" }
            ];
            const wsEvents = XLSX.utils.json_to_sheet(eventsData, { header: eventsCols });

            // 2. 공휴일 시트 데이터 및 헤더
            const holidayCols = ["날짜", "휴일"];
            const holidaysData = [
                { "날짜": "2025-10-03", "휴일": "개천절" },
                { "날짜": "2025-10-09", "휴일": "한글날" }
            ];
            const wsHolidays = XLSX.utils.json_to_sheet(holidaysData, { header: holidayCols });

            // 3. 지도교사 시트 데이터 및 헤더
            const dutyCols = ["날짜", "요일", "지도 교사", "종류", "비고"];
            const dutiesData = [
                { "날짜": "2025.10.16", "요일": "목", "지도 교사": "홍길동", "종류": "평일초과", "비고": "중간고사" },
                { "날짜": "2025.10.17", "요일": "금", "지도 교사": "이순신", "종류": "평일초과", "비고": "" }
            ];
            const wsDuties = XLSX.utils.json_to_sheet(dutiesData, { header: dutyCols });

            // 시트 이름들을 통합 문서에 바인드
            XLSX.utils.book_append_sheet(wb, wsEvents, "학사일정 (Events)");
            XLSX.utils.book_append_sheet(wb, wsHolidays, "공휴일 (Holidays)");
            XLSX.utils.book_append_sheet(wb, wsDuties, "지도 교사 (Duties)");

            // 가공 완료된 엑셀 파일 브라우저 다운로드 처리
            XLSX.writeFile(wb, `${schoolName || '학교'}_학사일정_작성_템플릿.xlsx`);
            showToast('success', '엑셀 템플릿 파일이 다운로드 되었습니다. 작성 후 이 창에 업로드해 주세요!');
        } catch (e) {
            console.error(e);
            showToast('error', '템플릿 생성 중 알 수 없는 오류가 발생했습니다.');
        }
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    // Drag-And-Drop Handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    // Main Core File Reader and CSV Generator 
    const processFile = async (file: File) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
            showToast('error', '엑셀(.xlsx, .xls) 또는 CSV 형식의 파일만 업로드할 수 있습니다.');
            return;
        }

        setIsProcessing(true);
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                let eventsCsv = "";
                let holidaysCsv = "";
                let dutiesCsv = "";

                let hasValidSheet = false;

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const csv = XLSX.utils.sheet_to_csv(worksheet, { strip: false });

                    // 시트 이름 분석 매핑
                    if (sheetName.includes("일정") || sheetName.includes("행사") || sheetName.includes("Events") || sheetName.includes("event")) {
                        eventsCsv = csv;
                        hasValidSheet = true;
                    } else if (sheetName.includes("휴일") || sheetName.includes("공휴일") || sheetName.includes("Holidays")) {
                        holidaysCsv = csv;
                        hasValidSheet = true;
                    } else if (sheetName.includes("교사") || sheetName.includes("당직") || sheetName.includes("Duties") || sheetName.includes("지도")) {
                        dutiesCsv = csv;
                        hasValidSheet = true;
                    }
                });

                // 시트 이름이 명확하지 않아 파싱 실패 시, 첫 번째 시트를 학사일정으로 간주하여 대체 처리
                if (!hasValidSheet && workbook.SheetNames.length > 0) {
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    eventsCsv = XLSX.utils.sheet_to_csv(firstSheet);
                    showToast('success', '시트명이 일치하지 않아 첫 번째 시트를 학사일정 데이터로 업로드했습니다.');
                }

                // 부모 State에 저장 콜백 전달
                onSaveData(
                    schoolName || '스마트 스쿨 캘린더', 
                    eventsCsv || currentEventsCsv, 
                    holidaysCsv || currentHolidaysCsv, 
                    dutiesCsv || currentDutiesCsv
                );
                
                showToast('success', '학사 일정 엑셀 데이터를 성공적으로 불러와 달력에 적용했습니다!');
                } catch (err) {
                    console.error(err);
                    showToast('error', '템플릿 내용을 분석하는 도중 파일 파싱 에러가 발생했습니다.');
                } finally {
                    setIsProcessing(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error(error);
            showToast('error', '파일 업로드 중 알 수 없는 장애가 발생했습니다.');
            setIsProcessing(false);
        }
    };

    const handleSaveSchoolNameOnly = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveData(schoolName, currentEventsCsv, currentHolidaysCsv, currentDutiesCsv);
        showToast('success', `학교명이 '${schoolName}'(으)로 최종 변경되었습니다.`);
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
                
                {/* Header Area */}
                <header className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">🏫 학교 설정 및 학사 일정 데이터 관리</h2>
                        <p className="text-xs text-slate-500 mt-0.5">달력에 표시할 학교 정보와 일정 데이터를 편집 및 업로드합니다.</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
                        id="btn-close-admin-panel"
                    >
                        <XMarkIcon />
                    </button>
                </header>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {message && (
                        <div className={`p-4 rounded-lg text-sm font-medium flex items-start leading-relaxed ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
                            <span className="mr-1.5">{message.type === 'success' ? '✓' : '✗'}</span>
                            <span>{message.text}</span>
                        </div>
                    )}

                    {/* Section 1: School Name Configuration */}
                    <section className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <h3 className="font-bold text-slate-700 text-sm flex items-center">
                            <span className="bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">1</span>
                            학교 정보 설정
                        </h3>
                        <form onSubmit={handleSaveSchoolNameOnly} className="flex gap-2">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    placeholder="학교 이름을 입력해 주세요 (예: 한국고등학교)"
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                                    id="input-school-name"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all"
                            >
                                이름 저장
                            </button>
                        </form>
                    </section>

                    {/* Section 2: Instructions and Sample XLSX Download */}
                    <section className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl space-y-3">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                                <h3 className="font-bold text-slate-700 text-sm flex items-center">
                                    <span className="bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">2</span>
                                    작성 가이드 및 샘플 다운로드
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 pl-7 leading-relaxed">
                                    통합 엑셀 문서 파일 하나로 학사 일정, 공휴일, 지도 교사 당직 정보를 관리할 수 있습니다.<br />
                                    반드시 아래 제공되는 양식을 다운로드해 규칙에 맞게 작성 후 재업로드하십시오.
                                </p>
                            </div>
                            <button
                                onClick={handleDownloadTemplate}
                                className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all pl-3"
                                id="btn-download-xlsx-template"
                            >
                                <DocumentArrowDownIcon />
                                엑셀 양식 다운로드 (.xlsx)
                            </button>
                        </div>

                        {/* Formatting Guidelines Table */}
                        <div className="text-xs text-slate-600 pl-7 space-y-1 bg-white p-3.5 rounded-lg border border-slate-100 space-y-2 mt-2">
                            <p className="font-semibold text-slate-700 text-xs">🛠️ 엑셀 통합 시트 구성 방식:</p>
                            <ul className="list-disc pl-4 space-y-1 text-slate-500">
                                <li><strong className="text-slate-700">시트 1: [학사일정]</strong> 날짜는 <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">YYYY.MM.DD</code> 형식, 행사1 ~ 행사4까지 입력 가능</li>
                                <li><strong className="text-slate-700">시트 2: [공휴일]</strong> 날짜와 휴일 이름을 입력 (예: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">YYYY-MM-DD</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">지정일</code>)</li>
                                <li><strong className="text-slate-700">시트 3: [지도교사]</strong> 날짜, 요일, 지도 교사, 종류, 비고 입력</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: Smart File Drag and Drop Zone Client Parsing */}
                    <section className="space-y-3">
                        <h3 className="font-bold text-slate-700 text-sm flex items-center">
                            <span className="bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">3</span>
                            작성한 파일 업로드 (.xlsx / .csv)
                        </h3>

                        <div 
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3
                                ${dragActive ? 'border-sky-500 bg-sky-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/30'}
                                ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}
                            `}
                            onClick={onButtonClick}
                            id="file-dropzone-admin"
                        >
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                onChange={handleFileChange}
                                accept=".xlsx, .xls, .csv"
                                disabled={isProcessing}
                            />
                            
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>

                            {isProcessing ? (
                                <p className="text-sm font-semibold text-sky-600 animate-pulse">엑셀 파일 내의 데이터 시트를 열심히 파싱하여 달력에 주입하는 중입니다...</p>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-700">작성한 엑셀 파일(.xlsx) 또는 CSV 파일을 올려 주세요</p>
                                    <p className="text-xs text-slate-500 font-normal">이 곳에 마우스로 드래그해서 놓거나, 클릭하여 탐색기에서 선택할 수 있습니다.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Section 4: Data Reset Control */}
                    <section className="bg-rose-50/50 p-4 border border-rose-100 rounded-xl flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h4 className="font-bold text-rose-900 text-sm">위험 구역 (전체 일정 초기화)</h4>
                            <p className="text-xs text-rose-700 mt-0.5">학교 명 및 입력된 모든 학사일정, 공휴일, 다단계 당직 기록을 깨끗이 지웁니다.</p>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm("정말로 등록된 학교 이름 및 모든 학사 일정, 공휴일, 당직 데이터를 완전히 초기화하고 비우시겠습니까?")) {
                                    onResetData();
                                    setSchoolName('');
                                    showToast('success', '달력의 모든 일정 데이터가 깨끗하게 초기화되었습니다.');
                                }
                            }}
                            className="inline-flex items-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                            id="btn-reset-school-data"
                        >
                            <TrashIcon />
                            전체 데이터 공백 초기화
                        </button>
                    </section>
                </div>

                <footer className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all"
                        id="btn-close-admin-footer"
                    >
                        닫기 및 달력 복귀
                    </button>
                </footer>
            </div>
        </div>
    );
};
