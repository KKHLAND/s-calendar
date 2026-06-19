
export interface RawSchoolEvent {
    date: string;
    events: string[];
}

export interface Holiday {
    date: Date;
    name: string;
}

export interface TeacherDuty {
    date: Date;
    teacher: string;
}

export interface SchoolEvent {
    title: string;
    color: string;
    fullTitle: string;
}

export interface DayData {
    date: Date;
    events: SchoolEvent[];
    holiday: Holiday | null;
    teacherDuty: TeacherDuty | null;
}

export interface MultiDayEvent {
    id: string;
    start: Date;
    end: Date;
    title: string;
    color: string;
    lane: number;
}

export interface CalendarData {
    dayDataMap: Map<string, DayData>;
    multiDayEvents: MultiDayEvent[];
}
