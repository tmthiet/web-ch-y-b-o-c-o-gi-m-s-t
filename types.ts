
export enum ShiftTime {
  S730 = '07h30',
  S930 = '09h30',
  S1330 = '13h30',
  S1530 = '15h30',
  S1730 = '17h30',
}

export enum AreaType {
  KV1 = 'KV1',
  KV2 = 'KV2',
}

export interface ReportData {
  supervisorName: string;
  examDate: string;
  shift: string; // Changed from Enum to string to allow dynamic values
  area: string;  // Changed from Enum to string to allow dynamic values
  subject: string;
  lateProctors: string;
  absentProctors: string;
  substituteProctors: string; // Cán bộ coi thi THẾ
  changedProctors: string;    // Cán bộ coi thi THAY (New)
  examPaperErrors: string;
  studentViolations: string;
  notes: string;
}

export interface SavedReport extends ReportData {
  id: string;
  timestamp: number;
  isSynced?: boolean; // New property to track sync status
}

export interface AreaOption {
  id: string;
  label: string;
  description: string;
}

export interface Staff {
  code: string;
  name: string;
}

export interface ScheduleItem {
  id: string;      // Unique identifier
  date: string;    // Normalized YYYY-MM-DD
  timeStr: string; // Raw time string from file
  subject: string;
  room?: string;   // Exam Room
  proctor?: string; // Proctor Name
  rawDate: string;
}
