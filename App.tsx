
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AreaOption, ReportData, ScheduleItem, Staff, SavedReport } from './types';
import { SHIFTS, AREAS, INITIAL_REPORT_DATA, SUGGESTED_SUPERVISORS, SUGGESTED_SUBJECTS, SUGGESTED_ROOMS, AREA_KEYWORDS } from './constants';
import { FormField } from './components/FormField';
import { IncidentInput } from './components/IncidentInput';
import { IncidentWithSelector } from './components/IncidentWithSelector';
import { CombinedSubstituteInput } from './components/CombinedSubstituteInput'; // Import new component
import { ScheduleManager } from './components/ScheduleManager';
import { SettingsManager } from './components/SettingsManager';
import { MultiSelectSubject } from './components/MultiSelectSubject';
import { Toast } from './components/Toast';
import { Combobox } from './components/Combobox';
import { ReportHistoryModal } from './components/ReportHistoryModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ReferenceListModal } from './components/ReferenceListModal'; // New Import

// Declare XLSX on window
declare global {
  interface Window {
    XLSX: any;
  }
}

// SVG Icons
const Icons = {
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Map: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Book: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Refresh: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Database: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  Cog: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Save: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Pencil: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Camera: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
};

// Helper for localStorage
const usePersistedState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

function App() {
  const [formData, setFormData] = useState<ReportData>(INITIAL_REPORT_DATA);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [formResetKey, setFormResetKey] = useState(0); // Used to force reset internal state of children
  
  // Customization State
  const [backgroundImage, setBackgroundImage] = usePersistedState<string>('app_background_image', '');
  const [bannerImage, setBannerImage] = usePersistedState<string>('app_banner_image', 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop');
  
  // New Info State
  const [appTitle, setAppTitle] = usePersistedState<string>('app_title', 'Báo Cáo Nhanh Giám Sát Thi');
  const [appDescription, setAppDescription] = usePersistedState<string>('app_description', 'Hệ thống báo cáo trực tuyến dành cho Cán bộ giám sát và Thư ký hội đồng thi');
  
  // Schedule state
  const [importedSchedule, setImportedSchedule] = useState<ScheduleItem[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  
  // Settings & Navigation state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'supervisors' | 'subjects' | 'areas' | 'shifts' | 'rooms' | 'staff' | 'background' | 'security' | undefined>(undefined);
  
  // History state
  const [savedReports, setSavedReports] = usePersistedState<SavedReport[]>('saved_reports', []);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Admin Auth State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Reference Modal State
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  
  // SECURITY CONFIGURATION
  // Default password set to 123@123@123@
  const [adminPassword, setAdminPassword] = usePersistedState<string>('admin_password', '123@123@123@');
  const [adminEmails, setAdminEmails] = usePersistedState<string[]>('admin_allowed_emails', []);
  
  // --- SPLIT GOOGLE SHEET CONFIGURATION ---
  // 1. Report URL (For POSTing reports - Lịch sử báo cáo)
  const [reportWebhookUrl, setReportWebhookUrl] = usePersistedState<string>('google_sheet_url', ''); // Maintain key for backward compatibility
  // 2. Schedule/Data URL (For GETting data - Lịch giám sát / Danh sách)
  const [scheduleSourceUrl, setScheduleSourceUrl] = usePersistedState<string>('schedule_source_url', '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CONFIGURATION STATE (Admin Info) ---
  const [supervisorsList, setSupervisorsList] = usePersistedState<string[]>('config_supervisors', SUGGESTED_SUPERVISORS);
  const [subjectsList, setSubjectsList] = usePersistedState<string[]>('config_subjects', SUGGESTED_SUBJECTS);
  const [areasList, setAreasList] = usePersistedState<AreaOption[]>('config_areas', AREAS);
  const [shiftsList, setShiftsList] = usePersistedState<string[]>('config_shifts', SHIFTS);
  const [roomsList, setRoomsList] = usePersistedState<string[]>('config_rooms', SUGGESTED_ROOMS); // New: Rooms List
  const [staffList, setStaffList] = usePersistedState<Staff[]>('config_staff', []); 

  // Compute Supervisor Options combining Staff List (with Codes) and Manual List
  const supervisorOptions = useMemo(() => {
    const fromStaff = staffList.map(s => `${s.name}${s.code ? ` (${s.code})` : ''}`);
    return Array.from(new Set([...fromStaff, ...supervisorsList]));
  }, [staffList, supervisorsList]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // --- ADMIN AUTH HELPER ---
  const requireAdmin = (action: () => void) => {
    if (isAdmin) {
      action();
    } else {
      setPendingAction(() => action);
      setIsAuthModalOpen(true);
    }
  };
  
  const handleLoginClick = () => {
    setPendingAction(null);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAdmin(true);
    showToast("Đã đăng nhập quyền Admin.", "success");
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    showToast("Đã đăng xuất quyền Admin.", "info");
    setIsSettingsOpen(false); // Close settings if open
    setIsManageModalOpen(false); // Close manage modal if open
    setIsReferenceModalOpen(false); // Close reference modal if open
    setIsHistoryOpen(false); // Close history modal if open
  };
  // -------------------------

  const openSettings = (tab?: 'supervisors' | 'subjects' | 'areas' | 'shifts' | 'rooms' | 'staff' | 'background' | 'security') => {
    requireAdmin(() => {
      setSettingsInitialTab(tab);
      setIsSettingsOpen(true);
    });
  };

  const openScheduleManager = () => {
    requireAdmin(() => {
      setIsManageModalOpen(true);
    });
  };
  
  // Protected Upload Handler
  const handleProtectedImportClick = () => {
     requireAdmin(() => {
        fileInputRef.current?.click();
     });
  };

  const handleResetConfig = () => {
    setSupervisorsList([]); 
    setSubjectsList(SUGGESTED_SUBJECTS);
    setAreasList(AREAS);
    setShiftsList(SHIFTS);
    setRoomsList(SUGGESTED_ROOMS);
    setStaffList([]);
    showToast("Đã khôi phục dữ liệu cấu hình về mặc định.", "info");
  };

  const handleInputChange = (field: keyof ReportData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- HISTORY MANAGEMENT ---
  const handleSaveReport = () => {
    if (!formData.supervisorName || !formData.examDate) {
      showToast("Vui lòng nhập ít nhất tên CBGS và ngày thi để lưu.", "error");
      return;
    }

    const newReport: SavedReport = {
      ...formData,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isSynced: false // New reports are not synced by default
    };

    setSavedReports(prev => [newReport, ...prev]);
    showToast("Đã lưu báo cáo và làm mới form!", "success");

    // Reset Form Data
    setFormData(INITIAL_REPORT_DATA);
    setFormResetKey(prev => prev + 1); // Force reset of internal states
  };

  const handleClearHistory = () => {
    setSavedReports([]);
  };

  const handleDeleteReport = (id: string) => {
    setSavedReports(prev => prev.filter(r => r.id !== id));
  };
  
  const handleMarkAsSynced = (ids: string[]) => {
    setSavedReports(prev => prev.map(report => 
      ids.includes(report.id) ? { ...report, isSynced: true } : report
    ));
  };

  // --- SCHEDULE MANAGEMENT LOGIC ---
  const handleUpdateScheduleItem = (id: string, field: keyof ScheduleItem, value: string) => {
    setImportedSchedule(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDeleteScheduleItem = (id: string) => {
    setImportedSchedule(prev => prev.filter(item => item.id !== id));
  };

  const handleClearSchedule = () => {
    setImportedSchedule([]);
    setUploadStatus('');
  };

  // --- FILE UPLOAD LOGIC (SCHEDULE) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.XLSX) {
      showToast("Thư viện xử lý Excel chưa tải xong. Vui lòng thử lại sau vài giây.", "error");
      return;
    }

    setUploadStatus('Đang xử lý...');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = window.XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const parsedItems: ScheduleItem[] = [];

        // Fill Down Variables (For Merged Cells)
        let lastRoom = '';
        let lastProctor = '';

        const parseDate = (raw: any): string => {
          if (!raw) return '';
          try {
            const str = String(raw).trim();
            const vnDateRegex = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;
            const match = str.match(vnDateRegex);
            
            if (match) {
               const day = match[1].padStart(2, '0');
               const month = match[2].padStart(2, '0');
               const year = match[3];
               return `${year}-${month}-${day}`;
            }

            if (raw instanceof Date) {
               const offset = raw.getTimezoneOffset() * 60000;
               const localDate = new Date(raw.getTime() - offset);
               if (isNaN(localDate.getTime())) return '';
               return localDate.toISOString().split('T')[0];
            }
            
            if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
              return str.substring(0, 10);
            }
            
            return '';
          } catch (e) {
            return '';
          }
        };

        jsonData.forEach((row: any) => {
          const keys = Object.keys(row);
          const dateKey = keys.find(k => k.toLowerCase().includes('ngày') || k.toLowerCase().includes('date') || k.toLowerCase().includes('buổi'));
          const timeKey = keys.find(k => k.toLowerCase().includes('giờ') || k.toLowerCase().includes('ca') || k.toLowerCase().includes('time') || k.toLowerCase().includes('tiết'));
          const subjectKey = keys.find(k => k.toLowerCase().includes('môn') || k.toLowerCase().includes('học phần') || k.toLowerCase().includes('subject'));
          const roomKey = keys.find(k => k.toLowerCase().includes('phòng') || k.toLowerCase().includes('room') || k.toLowerCase().includes('địa điểm'));
          const proctorKey = keys.find(k => k.toLowerCase().includes('cán bộ') || k.toLowerCase().includes('giám thị') || k.toLowerCase().includes('cbct') || k.toLowerCase().includes('proctor'));

          if (dateKey && subjectKey) {
            const dateStr = parseDate(row[dateKey]);

            // Fill Down Logic for Merged Cells
            // If Room/Proctor is empty but Subject exists, use previous value
            let currentRoom = roomKey ? String(row[roomKey]).trim() : '';
            let currentProctor = proctorKey ? String(row[proctorKey]).trim() : '';
            const currentSubject = String(row[subjectKey]).trim();

            if (currentSubject) {
                // Handle Room Fill Down
                if (currentRoom) {
                    lastRoom = currentRoom;
                } else if (lastRoom) {
                    currentRoom = lastRoom; // Use previous valid room
                }

                // Handle Proctor Fill Down
                if (currentProctor) {
                    lastProctor = currentProctor;
                } else if (lastProctor) {
                    currentProctor = lastProctor; // Use previous valid proctor
                }
            }

            if (dateStr && currentSubject) {
              parsedItems.push({
                id: Math.random().toString(36).substr(2, 9),
                date: dateStr,
                timeStr: timeKey ? String(row[timeKey]) : '',
                subject: currentSubject,
                room: currentRoom,
                proctor: currentProctor,
                rawDate: String(row[dateKey])
              });
            }
          }
        });

        if (parsedItems.length > 0) {
          setImportedSchedule(prev => [...prev, ...parsedItems]);
          setUploadStatus(`Đã nhập thêm ${parsedItems.length} dòng.`);
          showToast(`Đã nhập thành công ${parsedItems.length} dòng dữ liệu!`, 'success');
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          setUploadStatus('Không tìm thấy cột Ngày/Môn phù hợp.');
          showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel.', 'error');
        }

      } catch (error) {
        console.error(error);
        setUploadStatus('Lỗi khi đọc file.');
        showToast('Lỗi khi đọc file. Vui lòng kiểm tra định dạng.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };
  // -------------------------

  // Auto-detect Area ONLY (Kept same logic)
  useEffect(() => {
    if (importedSchedule.length === 0 || !formData.examDate || !formData.shift) {
      return;
    }

    const getHour = (str: string) => {
       if (!str) return -1;
       const match = str.match(/(\d+)/);
       return match ? parseInt(match[0]) : -1;
    };
    
    const selectedHour = getHour(formData.shift);

    const timeMatches = importedSchedule.filter(item => {
      if (item.date !== formData.examDate) return false;
      const itemHour = getHour(item.timeStr || '');
      
      if (selectedHour !== -1 && itemHour !== -1) {
         return Math.abs(itemHour - selectedHour) <= 1; 
      }
      return item.timeStr?.toLowerCase().includes(formData.shift.toLowerCase());
    });

    if (timeMatches.length === 0) return;

    let detectedArea = '';
    
    for (const item of timeMatches) {
      if (!item.room) continue;
      const roomUpper = item.room.toUpperCase();
      
      if (AREA_KEYWORDS['KV1']?.some(k => roomUpper.includes(k))) {
        detectedArea = 'KV1';
        break;
      }
      if (AREA_KEYWORDS['KV2']?.some(k => roomUpper.includes(k))) {
        detectedArea = 'KV2';
        break;
      }
    }

    if (detectedArea && !formData.area) {
      setFormData(prev => ({ ...prev, area: detectedArea }));
      showToast(`Đã tự động chọn khu vực: ${detectedArea}`, 'info');
    }
  }, [formData.examDate, formData.shift, importedSchedule]);

  // Compute available subjects (Kept same logic)
  const filteredSubjectsForSelection = useMemo(() => {
    if (!formData.examDate || !formData.shift) {
       return subjectsList;
    }

    const getHour = (str: string) => {
       if (!str) return -1;
       const match = str.match(/(\d+)/);
       return match ? parseInt(match[0]) : -1;
    };

    const selectedHour = getHour(formData.shift);
    const dateMatches = importedSchedule.filter(item => item.date === formData.examDate);

    if (dateMatches.length === 0) return subjectsList; 

    const timeMatches = dateMatches.filter(item => {
      const itemHour = getHour(item.timeStr || '');
      if (selectedHour !== -1 && itemHour !== -1) {
         return itemHour === selectedHour;
      }
      return item.timeStr?.toLowerCase().includes(formData.shift.toLowerCase());
    });

    if (timeMatches.length === 0) {
      return dateMatches.map(i => `${i.subject} (${i.timeStr})`).filter(Boolean);
    }

    if (formData.area) {
      const areaKeywords = AREA_KEYWORDS[formData.area] || [];
      const strictAreaMatches = timeMatches.filter(item => {
        if (!item.room) return false;
        const roomUpper = item.room.toUpperCase();
        return areaKeywords.some(kw => roomUpper.includes(kw));
      });

      const strictSubjects = Array.from(new Set(strictAreaMatches.map(i => i.subject))).filter(Boolean);
      if (strictSubjects.length > 0) return strictSubjects;
      
      const timeBasedSubjects = Array.from(new Set(timeMatches.map(i => i.subject))).filter(Boolean);
      return timeBasedSubjects;
    }

    return Array.from(new Set(timeMatches.map(i => i.subject))).filter(Boolean);
  }, [importedSchedule, formData.examDate, formData.shift, formData.area, subjectsList]);

  // Compute available Schedule Items for context (Kept same logic)
  const { filteredSchedule, countOnDate } = useMemo(() => {
    const getHour = (str: string) => {
       if (!str) return -1;
       const match = str.match(/(\d+)/);
       return match ? parseInt(match[0]) : -1;
    };
    const selectedHour = getHour(formData.shift);

    const examsOnDate = importedSchedule.filter(i => i.date === formData.examDate);
    const countOnDate = examsOnDate.length;

    let relevantItems = importedSchedule;
    
    if (formData.examDate) {
      relevantItems = relevantItems.filter(i => i.date === formData.examDate);
    }
    
    if (formData.shift && relevantItems.length > 0) {
       relevantItems = relevantItems.filter(item => {
          const itemHour = getHour(item.timeStr || '');
          if (selectedHour !== -1 && itemHour !== -1) {
             return itemHour === selectedHour;
          }
          return item.timeStr?.toLowerCase().includes(formData.shift.toLowerCase());
       });
    }

    if (formData.area && relevantItems.length > 0) {
        const areaKeywords = AREA_KEYWORDS[formData.area] || [];
        const areaMatches = relevantItems.filter(item => {
              if (!item.room) return false;
              const roomUpper = item.room.toUpperCase();
              return areaKeywords.some(kw => roomUpper.includes(kw));
        });
        
        if (areaMatches.length > 0) {
          relevantItems = areaMatches;
        }
    }

    if (formData.subject && relevantItems.length > 0) {
        const selectedSubjects = formData.subject.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        
        if (selectedSubjects.length > 0) {
            const subjectMatches = relevantItems.filter(item => {
                const itemSubject = item.subject.toLowerCase();
                return selectedSubjects.some(s => itemSubject.includes(s));
            });
            
            if (subjectMatches.length > 0) {
                relevantItems = subjectMatches;
            }
        }
    }

    return { 
      filteredSchedule: relevantItems,
      countOnDate
    };
  }, [importedSchedule, formData.examDate, formData.shift, formData.area, formData.subject]);

  return (
    <div 
      className="min-h-screen bg-gray-100 p-3 md:p-6 pb-12 transition-all duration-500"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: backgroundImage ? 'transparent' : '#f3f4f6'
      }}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Admin Authentication Modal */}
      <AdminAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => { setIsAuthModalOpen(false); setPendingAction(null); }} 
        onSuccess={handleAuthSuccess} 
        currentPassword={adminPassword}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Banner Section */}
        <div className="bg-white rounded-t-xl overflow-hidden shadow-lg mb-4 relative z-0 group">
          <div className="w-full h-48 relative bg-gray-200">
             {bannerImage ? (
                <img src={bannerImage} alt="Banner" className="w-full h-full object-fill" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-r from-blue-100 to-blue-50">
                   <span className="text-sm">Chưa có ảnh bìa</span>
                </div>
             )}
             
             {/* EDIT BUTTON FOR BANNER - Protected */}
             {isAdmin && (
               <button
                 onClick={() => openSettings('background')}
                 className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                 title="Chỉnh sửa ảnh bìa"
               >
                 <Icons.Pencil />
               </button>
             )}
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          
           {/* Application Title */}
          <div className="text-center py-6 px-4 bg-white border-b border-gray-100">
             <h1 className="text-2xl md:text-3xl font-bold text-blue-900 uppercase tracking-wide">
               {appTitle}
             </h1>
             <p className="text-gray-500 text-sm mt-2 max-w-lg mx-auto">
               {appDescription}
             </p>
          </div>

          {/* Section 1: General Info & Actions */}
          <div className="bg-blue-50 px-4 py-4 border-b border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h2 className="text-lg font-semibold text-blue-800 flex items-center">
              <span className="mr-2"><Icons.User /></span>
              Thông Tin Chung
            </h2>
            
            <div className="flex flex-wrap items-center gap-2">
               
               {/* PUBLIC BUTTON: REFERENCE LIST */}
               <button 
                 onClick={() => setIsReferenceModalOpen(true)}
                 className="flex items-center text-xs bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium"
               >
                 <span className="mr-1"><Icons.List /></span>
                 DANH SÁCH
               </button>

               {/* VISIBLE ONLY TO ADMIN */}
               {isAdmin ? (
                 <>
                   {/* HISTORY - ONLY ADMIN */}
                   <button 
                     onClick={() => setIsHistoryOpen(true)}
                     className="flex items-center text-xs bg-green-600 text-white border border-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium ml-1"
                   >
                     <span className="mr-1"><Icons.List /></span>
                     Lịch Sử ({savedReports.length})
                   </button>

                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleFileUpload} 
                     accept=".xlsx, .xls, .csv" 
                     className="hidden" 
                   />
                   <button 
                     onClick={handleProtectedImportClick}
                     className="flex items-center text-xs bg-white text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium"
                   >
                     <span className="mr-1"><Icons.Upload /></span>
                     Nhập Lịch
                   </button>
                   
                   <button 
                     onClick={openScheduleManager}
                     className="flex items-center text-xs bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium"
                   >
                     <span className="mr-1"><Icons.Database /></span>
                     QL Lịch ({importedSchedule.length})
                   </button>
                   
                   <button 
                     onClick={() => openSettings()}
                     className="flex items-center text-xs text-white border hover:opacity-90 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium bg-orange-600 border-orange-600"
                   >
                     <span className="mr-1"><Icons.Cog /></span>
                     Cấu hình
                   </button>
                 </>
               ) : (
                 /* VISIBLE TO NORMAL USERS */
                 <button 
                   onClick={handleLoginClick}
                   className="flex items-center text-xs text-gray-500 hover:text-blue-700 hover:underline px-2"
                   title="Dành cho Quản trị viên"
                 >
                   <span className="mr-1"><Icons.Lock /></span>
                   Đăng nhập Admin
                 </button>
               )}
            </div>
          </div>
          {uploadStatus && isAdmin && (
             <div className="px-4 py-2 bg-green-50 text-xs text-green-700 border-b border-green-100 flex justify-end">
                {uploadStatus}
             </div>
           )}
          
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Cán bộ giám sát" htmlFor="supervisorName" required icon={<Icons.User />}>
              <Combobox
                key={`supervisor-${formResetKey}`}
                id="supervisorName"
                value={formData.supervisorName}
                onChange={(value) => handleInputChange('supervisorName', value)}
                options={supervisorOptions}
                placeholder="Nhập tên hoặc Mã cán bộ (MSCB)..."
              />
            </FormField>

            <FormField label="Ngày thi" htmlFor="examDate" required icon={<Icons.Calendar />}>
              <div className="relative">
                <input
                  id="examDate"
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => handleInputChange('examDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {importedSchedule.length > 0 && formData.examDate && (
                  <div className="absolute top-full right-0 text-[10px] text-gray-500 mt-1">
                    Tìm thấy {countOnDate} ca thi trong dữ liệu
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Ca thi" htmlFor="shift" required icon={<Icons.Clock />}>
              <Combobox
                key={`shift-${formResetKey}`}
                id="shift"
                value={formData.shift}
                onChange={(value) => handleInputChange('shift', value)}
                options={shiftsList}
                placeholder="Chọn hoặc nhập ca thi (VD: 07h30)..."
              />
            </FormField>

            <FormField label="Khu vực giám sát" htmlFor="area" required icon={<Icons.Map />}>
              <select
                id="area"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Chọn khu vực --</option>
                {areasList.map(area => (
                  <option key={area.id} value={area.id}>{area.label} ({area.description})</option>
                ))}
              </select>
            </FormField>
            
            <div className="md:col-span-2">
              <MultiSelectSubject
                 key={`subject-${formResetKey}`}
                 id="subject"
                 label="Môn thi / Học phần"
                 required
                 icon={<Icons.Book />}
                 value={formData.subject}
                 onChange={(val) => handleInputChange('subject', val)}
                 options={filteredSubjectsForSelection}
                 placeholder={formData.examDate && formData.shift && formData.area 
                    ? "Chọn môn thi (Nếu không thấy, kiểm tra lại ngày/giờ)..." 
                    : "Nhập hoặc chọn môn thi..."
                 }
              />
            </div>
          </div>

          {/* Section 2: Incidents */}
          <div className="bg-red-50 px-4 py-3 border-t border-b border-red-100">
            <h2 className="text-lg font-semibold text-red-800 flex items-center">
              <span className="mr-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></span>
              Báo Cáo Sự Cố & Vi Phạm
            </h2>
            <p className="text-xs text-red-600 mt-1">Sử dụng công cụ chọn nhanh: Chọn Phòng thi để lọc danh sách Cán bộ tương ứng</p>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            
            <IncidentWithSelector
              key={`late-${formResetKey}`}
              id="lateProctors"
              label="Cán bộ coi thi TRỄ"
              value={formData.lateProctors}
              onChange={(e) => handleInputChange('lateProctors', e.target.value)}
              hasIncident={!!formData.lateProctors}
              placeholder="Chọn phòng trước, sau đó chọn tên cán bộ..."
              scheduleData={filteredSchedule}
              defaultProctors={supervisorsList}
              defaultRooms={roomsList}
              staffList={staffList}
              selectedArea={formData.area}
            />
            
            <IncidentWithSelector
              key={`absent-${formResetKey}`}
              id="absentProctors"
              label="Cán bộ VẮNG coi thi"
              value={formData.absentProctors}
              onChange={(e) => handleInputChange('absentProctors', e.target.value)}
              hasIncident={!!formData.absentProctors}
              placeholder="Chọn phòng trước, sau đó chọn tên cán bộ..."
              scheduleData={filteredSchedule}
              defaultProctors={supervisorsList}
              defaultRooms={roomsList}
              staffList={staffList}
              selectedArea={formData.area}
            />

            <CombinedSubstituteInput
              key={`combined-sub-${formResetKey}`}
              substituteValue={formData.substituteProctors}
              changedValue={formData.changedProctors}
              onSubstituteChange={(val) => handleInputChange('substituteProctors', val)}
              onChangedChange={(val) => handleInputChange('changedProctors', val)}
              scheduleData={filteredSchedule}
              defaultProctors={supervisorsList}
              defaultRooms={roomsList}
              staffList={staffList}
              selectedArea={formData.area}
            />

            {/* Standard Inputs */}
            <IncidentInput
              id="examPaperErrors"
              label="Sai sót đề thi"
              value={formData.examPaperErrors}
              onChange={(e) => handleInputChange('examPaperErrors', e.target.value)}
              hasIncident={!!formData.examPaperErrors}
              placeholder="VD: Mã đề 102 mờ trang 3, thiếu câu hỏi..."
            />

            <IncidentInput
              id="studentViolations"
              label="SV/HV Vi phạm quy chế"
              value={formData.studentViolations}
              onChange={(e) => handleInputChange('studentViolations', e.target.value)}
              hasIncident={!!formData.studentViolations}
              placeholder="VD: SV Nguyễn Văn B sử dụng tài liệu..."
            />
            
             <FormField label="Ghi chú khác" htmlFor="notes">
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Các vấn đề khác..."
              />
            </FormField>
          </div>
          
          {/* STATIC SAVE BUTTON AREA */}
          <div className="bg-gray-50 border-t border-gray-200 p-4">
             <button
              onClick={handleSaveReport}
              className="flex items-center justify-center w-full px-6 py-3.5 bg-green-600 text-white font-bold text-base uppercase tracking-wide rounded-lg shadow-lg hover:bg-green-700 hover:shadow-xl focus:outline-none active:scale-95 transition-all transform hover:-translate-y-0.5"
            >
              <span className="mr-2"><Icons.Save /></span>
              LƯU VÀO DANH SÁCH
            </button>
          </div>
        </div>

      </div>

      {/* Schedule Manager Modal - Only for Admins */}
      <ScheduleManager
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        items={importedSchedule}
        onUpdateItem={handleUpdateScheduleItem}
        onDeleteItem={handleDeleteScheduleItem}
        onClearAll={handleClearSchedule}
      />

      {/* Settings Manager Modal - Only for Admins */}
      <SettingsManager
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsInitialTab}
        supervisors={supervisorsList}
        setSupervisors={setSupervisorsList}
        subjects={subjectsList}
        setSubjects={setSubjectsList}
        areas={areasList}
        setAreas={setAreasList}
        shifts={shiftsList}
        setShifts={setShiftsList}
        rooms={roomsList}
        setRooms={setRoomsList}
        staffList={staffList}
        setStaffList={setStaffList}
        onResetDefaults={handleResetConfig}
        backgroundImage={backgroundImage}
        setBackgroundImage={setBackgroundImage}
        bannerImage={bannerImage}
        setBannerImage={setBannerImage}
        appTitle={appTitle}
        setAppTitle={setAppTitle}
        appDescription={appDescription}
        setAppDescription={setAppDescription}
        onLogout={handleLogoutAdmin}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        adminEmails={adminEmails}
        setAdminEmails={setAdminEmails}
        // PASSED BOTH URLs
        reportWebhookUrl={reportWebhookUrl}
        setReportWebhookUrl={setReportWebhookUrl}
        scheduleSourceUrl={scheduleSourceUrl}
        setScheduleSourceUrl={setScheduleSourceUrl}
        setImportedSchedule={setImportedSchedule}
      />

      {/* History Modal - Only for Admins */}
      {isAdmin && (
        <ReportHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          reports={savedReports}
          areasList={areasList}
          onClearHistory={handleClearHistory}
          onDeleteReport={handleDeleteReport}
          reportWebhookUrl={reportWebhookUrl} // Use Specific Report URL
          onMarkAsSynced={handleMarkAsSynced}
        />
      )}

      {/* Reference List Modal - Visible to EVERYONE */}
      <ReferenceListModal
          isOpen={isReferenceModalOpen}
          onClose={() => setIsReferenceModalOpen(false)}
          scheduleSourceUrl={scheduleSourceUrl} // Use Specific Schedule Source URL
          onOpenSettings={() => openSettings('security')} 
      />
    </div>
  );
}

export default App;
