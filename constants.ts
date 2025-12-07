
import { ShiftTime, AreaType, AreaOption } from './types';

// --- CẤU HÌNH MẶC ĐỊNH TOÀN HỆ THỐNG ---
// Điền thông tin vào đây để áp dụng cho TẤT CẢ thiết bị khi mở Web
export const APP_CONFIG = {
  // 1. Link Web App cho chức năng GỬI BÁO CÁO (File Lịch sử)
  // Copy link kết thúc bằng /exec dán vào giữa dấu ngoặc kép bên dưới
  DEFAULT_REPORT_URL: "", 

  // 2. Link Web App cho chức năng NGUỒN DỮ LIỆU (File Lịch thi/Danh sách)
  // Copy link kết thúc bằng /exec dán vào giữa dấu ngoặc kép bên dưới
  DEFAULT_SCHEDULE_URL: "",

  // 3. Mật khẩu Admin mặc định (Nếu muốn thay đổi cố định)
  DEFAULT_ADMIN_PASSWORD: "123@123@123@"
};

export const SHIFTS: ShiftTime[] = [
  ShiftTime.S730,
  ShiftTime.S930,
  ShiftTime.S1330,
  ShiftTime.S1530,
  ShiftTime.S1730,
];

export const AREAS: AreaOption[] = [
  {
    id: AreaType.KV1,
    label: 'Khu vực 1',
    description: 'KY, ĐD, PM',
  },
  {
    id: AreaType.KV2,
    label: 'Khu vực 2',
    description: 'RD, YT, KT',
  },
];

// Keywords to auto-detect Area based on Room name in Excel
// e.g. "10.RD" -> contains "RD" -> matches KV2
// Updated: Added CB, DD for KV1 as requested (PM1.CB, PM1.DD)
export const AREA_KEYWORDS: Record<string, string[]> = {
  [AreaType.KV1]: ['KY', 'ĐD', 'DD', 'PM', 'CB', 'KHOA Y', 'ĐIỀU DƯỠNG', 'PHÒNG MÁY'],
  [AreaType.KV2]: ['RD', 'YT', 'KT', 'RHM', 'RĂNG', 'Y TẾ', 'KỸ THUẬT', 'ODT'],
};

// Đã xóa danh sách mẫu theo yêu cầu. Dữ liệu sẽ được nạp từ Excel.
export const SUGGESTED_SUPERVISORS: string[] = [];

export const SUGGESTED_ROOMS = [
  "PM1.CB", "PM2.CB", "PM3.CB",
  "1.KY", "2.KY", "3.KY", "4.KY",
  "1.DD", "2.DD", "3.DD",
  "10.RD", "11.RD", "12.RD",
  "1.YT", "2.YT",
  "GĐ1", "GĐ2", "GĐ3"
];

// Helper to get date string YYYY-MM-DD
const getDateString = (offsetDays: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const today = getDateString(0);
const tomorrow = getDateString(1);

// Map specific subjects to dates (Demo data)
export const SUBJECTS_BY_DATE: Record<string, string[]> = {
  [today]: [
    "Dược lâm sàng (Lịch thi hôm nay)",
    "Hóa dược (Lịch thi hôm nay)",
    "Bào chế (Lịch thi hôm nay)",
    "Kiểm nghiệm thuốc"
  ],
  [tomorrow]: [
    "Nội bệnh lý (Lịch thi ngày mai)",
    "Ngoại bệnh lý (Lịch thi ngày mai)",
    "Phẫu thuật thực hành"
  ]
};

export const SUGGESTED_SUBJECTS = [
  "Giải phẫu học", 
  "Sinh lý học", 
  "Hóa sinh", 
  "Vi sinh - Ký sinh trùng",
  "Dược lý", 
  "Giải phẫu bệnh", 
  "Miễn dịch - Sinh lý bệnh", 
  "Dinh dưỡng - ATTP",
  "Nội cơ sở", 
  "Ngoại cơ sở", 
  "Điều dưỡng cơ bản", 
  "Sức khỏe môi trường",
  "Dịch tễ học", 
  "Tổ chức & Quản lý y tế", 
  "Răng Hàm Mặt", 
  "Tai Mũi Họng",
  "Mắt",
  "Da liễu",
  "Y học cổ truyền"
];

export const INITIAL_REPORT_DATA = {
  supervisorName: '',
  examDate: '', // Để trống mặc định theo yêu cầu (Thay vì today)
  shift: '' as any,
  area: '' as any,
  subject: '',
  lateProctors: '',
  absentProctors: '',
  substituteProctors: '', // THẾ
  changedProctors: '',    // THAY
  examPaperErrors: '',
  studentViolations: '',
  notes: '',
};
