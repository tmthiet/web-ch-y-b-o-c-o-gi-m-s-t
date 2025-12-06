
import React, { useState, useRef, useEffect } from 'react';
import { AreaOption, Staff, ScheduleItem } from '../types';

interface SettingsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  
  supervisors: string[];
  setSupervisors: (data: string[]) => void;
  
  subjects: string[];
  setSubjects: (data: string[]) => void;
  
  areas: AreaOption[];
  setAreas: (data: AreaOption[]) => void;
  
  shifts: string[];
  setShifts: (data: string[]) => void;

  rooms: string[];
  setRooms: (data: string[]) => void;

  staffList: Staff[];
  setStaffList: (data: Staff[]) => void;

  onResetDefaults: () => void;

  backgroundImage?: string;
  setBackgroundImage?: (url: string) => void;
  
  bannerImage?: string;
  setBannerImage?: (url: string) => void;
  
  // New: Title & Description
  appTitle: string;
  setAppTitle: (val: string) => void;
  appDescription: string;
  setAppDescription: (val: string) => void;

  initialTab?: 'supervisors' | 'subjects' | 'areas' | 'shifts' | 'rooms' | 'staff' | 'background' | 'security';

  onLogout?: () => void;
  
  // Security Props
  adminPassword?: string;
  setAdminPassword?: (pass: string) => void;
  adminEmails?: string[];
  setAdminEmails?: (emails: string[]) => void;

  // Google Sheet Props (Split into Two)
  reportWebhookUrl?: string; // For POSTing reports
  setReportWebhookUrl?: (url: string) => void;
  
  scheduleSourceUrl?: string; // For GETting data
  setScheduleSourceUrl?: (url: string) => void;

  // Schedule Sync Prop
  setImportedSchedule?: (data: ScheduleItem[]) => void;
}

type TabType = 'supervisors' | 'subjects' | 'areas' | 'shifts' | 'rooms' | 'staff' | 'background' | 'security';

const PRESET_BACKGROUNDS = [
  { name: 'Xanh công nghệ', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Thiên nhiên mờ', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Trừu tượng', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Kiến trúc sáng', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop' },
  { name: 'Hoàng hôn', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9d856?q=80&w=2069&auto=format&fit=crop' },
  { name: 'Giấy trắng', url: 'https://images.unsplash.com/photo-1594383688176-57849e6cb3e6?q=80&w=2070&auto=format&fit=crop' }
];

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  isOpen,
  onClose,
  supervisors,
  setSupervisors,
  subjects,
  setSubjects,
  areas,
  setAreas,
  shifts,
  setShifts,
  rooms,
  setRooms,
  staffList,
  setStaffList,
  onResetDefaults,
  backgroundImage,
  setBackgroundImage,
  bannerImage,
  setBannerImage,
  appTitle,
  setAppTitle,
  appDescription,
  setAppDescription,
  initialTab,
  onLogout,
  adminPassword,
  setAdminPassword,
  adminEmails,
  setAdminEmails,
  reportWebhookUrl,
  setReportWebhookUrl,
  scheduleSourceUrl,
  setScheduleSourceUrl,
  setImportedSchedule
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [newItem, setNewItem] = useState('');
  
  // Update active tab when initialTab changes or modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // State for Area editing
  const [newAreaId, setNewAreaId] = useState('');
  const [newAreaLabel, setNewAreaLabel] = useState('');
  const [newAreaDesc, setNewAreaDesc] = useState('');

  // State for Staff editing
  const [newStaffCode, setNewStaffCode] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const staffFileInputRef = useRef<HTMLInputElement>(null);
  const [staffUploadStatus, setStaffUploadStatus] = useState('');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isSyncingScheduleCloud, setIsSyncingScheduleCloud] = useState(false);

  // State for Background
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  
  // State for Security
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  if (!isOpen) return null;

  // --- Handlers for Strings (Supervisors, Subjects, Shifts) ---
  const handleAddItem = (
    list: string[], 
    setList: (l: string[]) => void
  ) => {
    if (newItem.trim()) {
      setList([...list, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleDeleteItem = (
    index: number, 
    list: string[], 
    setList: (l: string[]) => void
  ) => {
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  const handleUpdateItem = (
    index: number,
    value: string,
    list: string[],
    setList: (l: string[]) => void
  ) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  // --- Handlers for Areas ---
  const handleAddArea = () => {
    if (newAreaId.trim() && newAreaLabel.trim()) {
      setAreas([...areas, {
        id: newAreaId.trim(),
        label: newAreaLabel.trim(),
        description: newAreaDesc.trim()
      }]);
      setNewAreaId('');
      setNewAreaLabel('');
      setNewAreaDesc('');
    }
  };

  const handleDeleteArea = (index: number) => {
    const newAreas = [...areas];
    newAreas.splice(index, 1);
    setAreas(newAreas);
  };

  const handleUpdateArea = (index: number, field: keyof AreaOption, value: string) => {
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], [field]: value };
    setAreas(newAreas);
  };

  // --- Handlers for Staff ---
  const handleAddStaff = () => {
    if (newStaffName.trim()) {
      setStaffList([...staffList, {
        code: newStaffCode.trim(),
        name: newStaffName.trim()
      }]);
      // Also add to supervisors for consistency
      setSupervisors([...supervisors, newStaffName.trim()]);

      setNewStaffCode('');
      setNewStaffName('');
    }
  };

  const handleDeleteStaff = (index: number) => {
    const newList = [...staffList];
    newList.splice(index, 1);
    setStaffList(newList);
  };

  const handleUpdateStaff = (index: number, field: keyof Staff, value: string) => {
    const newList = [...staffList];
    newList[index] = { ...newList[index], [field]: value };
    setStaffList(newList);
  };

  const handleStaffFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.XLSX) {
      alert("Thư viện xử lý Excel chưa sẵn sàng.");
      return;
    }

    setStaffUploadStatus('Đang xử lý...');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = window.XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const parsedStaff: Staff[] = [];
        
        jsonData.forEach((row: any) => {
          const keys = Object.keys(row);
          // Look for Code/ID and Name columns with STRICT MATCHING for MSCB
          const codeKey = keys.find(k => 
             /mscb/i.test(k) || 
             /mã/i.test(k) || 
             /code/i.test(k) || 
             /id/i.test(k)
          );
          const nameKey = keys.find(k => 
             /tên/i.test(k) || 
             /họ/i.test(k) || 
             /name/i.test(k)
          );
          
          if (nameKey) {
             const name = String(row[nameKey]).trim();
             const code = codeKey ? String(row[codeKey]).trim() : '';
             if (name) {
               parsedStaff.push({ name, code });
             }
          }
        });

        if (parsedStaff.length > 0) {
           // Update Staff List (Merge by Code/Name to avoid duplicates)
           const newStaffList = [...staffList];
           const existingMap = new Map(newStaffList.map(s => [s.code || s.name, s]));
           
           parsedStaff.forEach(s => {
               existingMap.set(s.code || s.name, s);
           });
           
           setStaffList(Array.from(existingMap.values()));

           setStaffUploadStatus(`Đã thêm ${parsedStaff.length} cán bộ.`);
           if (staffFileInputRef.current) staffFileInputRef.current.value = "";
        } else {
           setStaffUploadStatus('Không tìm thấy cột MSCB hoặc Tên.');
        }

      } catch (error) {
        console.error(error);
        setStaffUploadStatus('Lỗi đọc file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- Handlers for CLOUD IMPORT (Google Sheet) ---
  // Uses scheduleSourceUrl because that's where "DATA" lives
  const handleCloudImport = async () => {
     if (!scheduleSourceUrl) {
        alert("Bạn chưa cấu hình 'Nguồn Dữ Liệu' trong tab 'Bảo mật & Đồng bộ'.");
        return;
     }
     
     setIsSyncingCloud(true);
     setStaffUploadStatus('Đang tải từ Google Sheet...');
     
     try {
        const response = await fetch(scheduleSourceUrl);
        if (!response.ok) throw new Error("Lỗi kết nối");
        
        const json = await response.json();
        
        if (json.status !== 'success' || !json.data) {
           throw new Error("Dữ liệu trả về không hợp lệ.");
        }
        
        const sheets = json.data;
        const parsedStaff: Staff[] = [];
        
        // Iterate through all sheets to find staff data
        Object.keys(sheets).forEach(sheetName => {
           const rows = sheets[sheetName];
           if (rows.length < 2) return; // Need header + at least 1 row
           
           const headers = rows[0].map((h: any) => String(h).toLowerCase());
           
           // Find column indexes
           const nameIdx = headers.findIndex((h: string) => h.includes('tên') || h.includes('name') || h.includes('họ'));
           const codeIdx = headers.findIndex((h: string) => h.includes('mã') || h.includes('code') || h.includes('mscb') || h.includes('id'));
           
           if (nameIdx !== -1) {
              // Iterate rows
              for (let i = 1; i < rows.length; i++) {
                 const row = rows[i];
                 const name = row[nameIdx] ? String(row[nameIdx]).trim() : '';
                 const code = (codeIdx !== -1 && row[codeIdx]) ? String(row[codeIdx]).trim() : '';
                 
                 if (name && name.length > 2) { // Basic validation
                    parsedStaff.push({ name, code });
                 }
              }
           }
        });

        if (parsedStaff.length > 0) {
           const newStaffList = [...staffList];
           const existingMap = new Map(newStaffList.map(s => [s.code || s.name, s]));
           
           parsedStaff.forEach(s => {
               existingMap.set(s.code || s.name, s);
           });
           
           const mergedList = Array.from(existingMap.values());
           setStaffList(mergedList);
           
           // Update Supervisors list too for consistency
           const newSupervisors = Array.from(new Set([...supervisors, ...mergedList.map(s => s.name)]));
           setSupervisors(newSupervisors);

           alert(`✅ Đã đồng bộ thành công!\n\nTìm thấy và cập nhật ${parsedStaff.length} cán bộ từ Google Sheet.`);
           setStaffUploadStatus(`Đã tải ${parsedStaff.length} CB từ Cloud.`);
        } else {
           alert("⚠️ Không tìm thấy dữ liệu cán bộ nào.\n\nHãy chắc chắn trên Google Sheet có cột tên là 'Họ tên', 'Tên', hoặc 'Name'.");
           setStaffUploadStatus('Không tìm thấy cột Tên.');
        }

     } catch (e: any) {
        console.error(e);
        alert(`❌ Lỗi khi đồng bộ: ${e.message}\n\nKiểm tra lại đường dẫn Webhook và Script.`);
        setStaffUploadStatus('Lỗi đồng bộ.');
     } finally {
        setIsSyncingCloud(false);
     }
  };

  // --- Handlers for SCHEDULE IMPORT (Google Sheet) ---
  // Uses scheduleSourceUrl
  const handleScheduleCloudImport = async () => {
    if (!scheduleSourceUrl) {
      alert("Bạn chưa cấu hình 'Nguồn Dữ Liệu' trong tab 'Bảo mật & Đồng bộ'.");
      return;
    }

    if (!setImportedSchedule) {
      alert("Lỗi cấu hình hệ thống: Không thể cập nhật lịch thi.");
      return;
    }

    setIsSyncingScheduleCloud(true);

    try {
      const response = await fetch(scheduleSourceUrl);
      if (!response.ok) throw new Error("Lỗi kết nối");

      const json = await response.json();
      if (json.status !== 'success' || !json.data) {
        throw new Error("Dữ liệu trả về không hợp lệ.");
      }

      const sheets = json.data;
      const parsedItems: ScheduleItem[] = [];

      // Iterate sheets to find Schedule Data
      Object.keys(sheets).forEach(sheetName => {
        const rows = sheets[sheetName];
        if (rows.length < 2) return;

        const headers = rows[0].map((h: any) => String(h).toLowerCase());

        // Find key columns
        const dateIdx = headers.findIndex((k: string) => k.includes('ngày') || k.includes('date') || k.includes('buổi'));
        const timeIdx = headers.findIndex((k: string) => k.includes('giờ') || k.includes('ca') || k.includes('time') || k.includes('tiết'));
        const subjectIdx = headers.findIndex((k: string) => k.includes('môn') || k.includes('học phần') || k.includes('subject'));
        const roomIdx = headers.findIndex((k: string) => k.includes('phòng') || k.includes('room') || k.includes('địa điểm'));
        const proctorIdx = headers.findIndex((k: string) => k.includes('cán bộ') || k.includes('giám thị') || k.includes('cbct') || k.includes('proctor'));

        if (dateIdx !== -1 && subjectIdx !== -1) {
           // Fill Down Variables
           let lastRoom = '';
           let lastProctor = '';

           for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              
              const rawDate = row[dateIdx];
              let dateStr = '';

              // Parse Date Logic (Duplicated from App.tsx for consistency)
              try {
                if (rawDate) {
                  const str = String(rawDate).trim();
                  // Check formats like DD/MM/YYYY or YYYY-MM-DD
                  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
                     dateStr = str.substring(0, 10); // Matches "2024-12-16T..."
                  } else {
                     const vnDateRegex = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;
                     const match = str.match(vnDateRegex);
                     if (match) {
                        const day = match[1].padStart(2, '0');
                        const month = match[2].padStart(2, '0');
                        const year = match[3];
                        dateStr = `${year}-${month}-${day}`;
                     }
                  }
                }
              } catch (e) {}

              // Fill Down Logic
              let currentRoom = (roomIdx !== -1 && row[roomIdx]) ? String(row[roomIdx]).trim() : '';
              let currentProctor = (proctorIdx !== -1 && row[proctorIdx]) ? String(row[proctorIdx]).trim() : '';
              const currentSubject = (subjectIdx !== -1 && row[subjectIdx]) ? String(row[subjectIdx]).trim() : '';

              if (currentSubject) {
                 if (currentRoom) lastRoom = currentRoom;
                 else if (lastRoom) currentRoom = lastRoom;

                 if (currentProctor) lastProctor = currentProctor;
                 else if (lastProctor) currentProctor = lastProctor;
              }

              if (dateStr && currentSubject) {
                 parsedItems.push({
                   id: Math.random().toString(36).substr(2, 9),
                   date: dateStr,
                   timeStr: (timeIdx !== -1 && row[timeIdx]) ? String(row[timeIdx]) : '',
                   subject: currentSubject,
                   room: currentRoom,
                   proctor: currentProctor,
                   rawDate: String(rawDate)
                 });
              }
           }
        }
      });

      if (parsedItems.length > 0) {
        setImportedSchedule(parsedItems); // Update App state
        alert(`✅ Đã đồng bộ Lịch thi thành công!\n\nTìm thấy ${parsedItems.length} ca thi từ Google Sheet.`);
      } else {
        alert("⚠️ Không tìm thấy dữ liệu Lịch thi phù hợp.\n\nHãy chắc chắn Sheet có các cột: 'Ngày', 'Môn', 'Phòng', 'Cán bộ'.");
      }

    } catch (e: any) {
      console.error(e);
      alert(`❌ Lỗi khi đồng bộ Lịch: ${e.message}`);
    } finally {
      setIsSyncingScheduleCloud(false);
    }
  };

  // --- Handlers for Images (Bg, Banner) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter?: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file || !setter) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("File ảnh quá lớn (>3MB). Vui lòng chọn ảnh nhỏ hơn để tránh lỗi bộ nhớ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setter(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // --- Handlers for Security ---
  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (setAdminPassword) {
      setAdminPassword(newPassword);
      setNewPassword('');
      alert("Đã cập nhật mật khẩu Admin thành công!");
    }
  };
  
  const handleAddEmail = () => {
     if (newEmail && newEmail.includes('@') && setAdminEmails && adminEmails) {
        setAdminEmails([...adminEmails, newEmail.trim()]);
        setNewEmail('');
     }
  };
  
  const handleRemoveEmail = (idx: number) => {
    if(setAdminEmails && adminEmails) {
      const newList = [...adminEmails];
      newList.splice(idx, 1);
      setAdminEmails(newList);
    }
  };

  const renderStringList = (data: string[], setData: (l: string[]) => void, placeholder: string) => (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(data, setData)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={() => handleAddItem(data, setData)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          Thêm
        </button>
      </div>
      <div className="flex-1 overflow-auto border rounded-md bg-gray-50 p-2 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex gap-2 items-center bg-white p-2 rounded shadow-sm border border-gray-200">
            <input 
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              value={item}
              onChange={(e) => handleUpdateItem(index, e.target.value, data, setData)}
            />
            <button
              onClick={() => handleDeleteItem(index, data, setData)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
        {data.length === 0 && <div className="text-gray-400 text-center py-4">Chưa có dữ liệu</div>}
      </div>
    </div>
  );

  return (
    // Z-Index 110 để đảm bảo luôn nằm trên các Modal khác (Lịch sử: 100, Danh sách: 80)
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Cấu hình Hệ thống (Admin)
            </h2>
            <p className="text-gray-400 text-sm">Chỉnh sửa danh sách hiển thị trong ứng dụng</p>
          </div>
          <div className="flex items-center gap-3">
             {onLogout && (
               <button 
                onClick={onLogout}
                className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
               >
                 Đăng xuất Admin
               </button>
             )}
             <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-1/4 bg-gray-100 border-r border-gray-200 p-2 space-y-1 overflow-y-auto">
             <button
              onClick={() => { setActiveTab('security'); setNewItem(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'bg-white text-red-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Bảo mật & Đồng bộ
            </button>
             <button
              onClick={() => { setActiveTab('staff'); setNewItem(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'staff' ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Danh sách Cán bộ
            </button>
             <button
              onClick={() => { setActiveTab('background'); setNewItem(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'background' ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Thông tin & Giao diện
            </button>
            <button
              onClick={() => { setActiveTab('supervisors'); setNewItem(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'supervisors' ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              DS Cán bộ (Giám sát)
            </button>
            <button
              onClick={() => { setActiveTab('subjects'); setNewItem(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subjects' ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Danh sách Môn thi
            </button>
            <button
              onClick={() => { setActiveTab('rooms'); setNewItem(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'rooms' ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Danh sách Phòng thi
            </button>
            <button
              onClick={() => { setActiveTab('areas'); setNewItem(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'areas' ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Danh sách Khu vực
            </button>
            <button
              onClick={() => { setActiveTab('shifts'); setNewItem(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'shifts' ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Danh sách Ca thi
            </button>
            
            <div className="pt-4 mt-4 border-t border-gray-300">
               <button 
                onClick={() => {
                   if(window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ danh sách về mặc định ban đầu?')) {
                     onResetDefaults();
                   }
                }}
                className="w-full text-left px-4 py-2 text-red-600 text-xs hover:bg-red-50 rounded"
               >
                 ↺ Khôi phục mặc định
               </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
              {activeTab === 'staff' && 'Quản lý Danh sách Cán bộ (Mã + Tên)'}
              {activeTab === 'supervisors' && 'Quản lý Cán bộ Giám sát (Gợi ý nhanh)'}
              {activeTab === 'subjects' && 'Quản lý Môn thi (Gợi ý)'}
              {activeTab === 'rooms' && 'Quản lý Danh sách Phòng thi'}
              {activeTab === 'areas' && 'Quản lý Khu vực thi'}
              {activeTab === 'shifts' && 'Quản lý Ca thi'}
              {activeTab === 'background' && 'Tùy chỉnh Thông tin & Giao diện'}
              {activeTab === 'security' && 'Bảo mật & Đồng bộ Google Sheet (2 File Riêng Biệt)'}
            </h3>

            {activeTab === 'security' && (
               <div className="h-full overflow-y-auto pr-2 pb-10">
                  
                  {/* Google Sheet Integration Section */}
                  <div className="mb-8 bg-blue-50 p-4 rounded border border-blue-200">
                     <h4 className="text-md font-bold text-blue-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Kết nối & Đồng bộ Cloud (Webhook)
                     </h4>
                     
                     {/* INPUT 1: REPORT WEBHOOK */}
                     <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                           1. GỬI BÁO CÁO (Lưu vào file Lịch Sử Báo Cáo):
                        </label>
                        <input 
                            type="text"
                            className={`w-full px-3 py-2 border rounded shadow-sm text-sm ${reportWebhookUrl && reportWebhookUrl.includes('docs.google.com') ? 'border-red-500 bg-red-50' : ''}`}
                            placeholder="Dán link Web App (/exec) của file Lịch sử Báo Cáo..."
                            value={reportWebhookUrl || ''}
                            onChange={(e) => setReportWebhookUrl && setReportWebhookUrl(e.target.value)}
                            onBlur={(e) => setReportWebhookUrl && setReportWebhookUrl(e.target.value.trim())}
                        />
                        <p className="text-xs text-gray-500 mt-1">Dùng để lưu dữ liệu khi bấm nút "Đồng bộ" trong phần Lịch Sử.</p>
                     </div>

                     {/* INPUT 2: SCHEDULE WEBHOOK */}
                     <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                           2. NGUỒN DỮ LIỆU (Đọc từ file Lịch Giám Sát/Danh Sách):
                        </label>
                        <input 
                            type="text"
                            className={`w-full px-3 py-2 border rounded shadow-sm text-sm ${scheduleSourceUrl && scheduleSourceUrl.includes('docs.google.com') ? 'border-red-500 bg-red-50' : ''}`}
                            placeholder="Dán link Web App (/exec) của file Lịch Giám Sát..."
                            value={scheduleSourceUrl || ''}
                            onChange={(e) => setScheduleSourceUrl && setScheduleSourceUrl(e.target.value)}
                            onBlur={(e) => setScheduleSourceUrl && setScheduleSourceUrl(e.target.value.trim())}
                        />
                        <p className="text-xs text-gray-500 mt-1">Dùng để tải Lịch thi và Danh sách cán bộ về ứng dụng.</p>
                     </div>
                     
                     {/* SYNC SCHEDULE BUTTON */}
                     {setImportedSchedule && (
                       <div className="mt-4 p-3 bg-white border border-blue-300 rounded-lg shadow-sm">
                          <h5 className="font-bold text-gray-800 text-sm mb-2">📥 Đồng bộ Dữ liệu Lịch thi (Từ Nguồn Dữ Liệu)</h5>
                          <button 
                            onClick={handleScheduleCloudImport}
                            disabled={isSyncingScheduleCloud}
                            className={`w-full flex items-center justify-center px-4 py-2 text-white font-medium rounded transition-colors ${isSyncingScheduleCloud ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                          >
                             {isSyncingScheduleCloud ? 'Đang tải lịch thi...' : 'Đồng bộ Lịch thi ngay'}
                          </button>
                       </div>
                     )}

                     <details className="mt-4 p-3 bg-white border border-blue-300 rounded text-xs" open>
                        <summary className="cursor-pointer font-bold text-blue-700 text-sm">Hướng dẫn Script (Dùng cho CẢ 2 FILE)</summary>
                        <div className="mt-2 text-gray-700 space-y-2">
                           <p>Nếu bạn dùng 2 file riêng biệt, hãy thực hiện các bước sau cho <b>CẢ 2 FILE</b>:</p>
                           <p>1. Mở Sheet &gt; <b>Tiện ích mở rộng</b> &gt; <b>Apps Script</b>.</p>
                           <p>2. Xóa code cũ, dán đoạn mã sau vào <code>Code.gs</code>:</p>
                           <pre className="bg-gray-100 p-2 rounded border border-gray-300 overflow-x-auto select-all font-mono text-xs text-blue-800">
{`// Script xử lý chung (Dùng cho cả Lưu báo cáo và Đọc dữ liệu)
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName('Baocao');
    if (!sheet) {
       // Nếu là file Lịch Giám Sát thì sẽ không có sheet Baocao -> Không sao, chỉ cần file Báo cáo có sheet này.
       sheet = doc.insertSheet('Baocao');
       sheet.appendRow(["STT", "TRẠNG THÁI", "THỜI GIAN GỬI", "CÁN BỘ GIÁM SÁT", "NGÀY THI", "CA THI", "KHU VỰC", "MÔN THI", "TRỄ", "VẮNG", "THẾ", "THAY", "LỖI ĐỀ", "VI PHẠM", "GHI CHÚ"]);
    }
    
    var data = JSON.parse(e.postData.contents);
    if (!Array.isArray(data)) data = [data];

    var startRow = sheet.getLastRow();
    var newRows = [];
    var now = new Date();
    var timeString = "'" + Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

    data.forEach(function(row, index) {
      newRows.push([
         startRow + index, 
         "Đã đồng bộ", 
         timeString,
         row.supervisorName || "",
         row.examDate || "",
         row.shift || "",
         row.area || "",
         row.subject || "",
         row.lateProctors || "",
         row.absentProctors || "",
         row.substituteProctors || "", 
         row.changedProctors || "",    
         row.examPaperErrors || "",
         row.studentViolations || "",
         row.notes || ""
      ]);
    });

    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'count': newRows.length })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = doc.getSheets();
  var result = {};
  
  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    if (name !== 'Baocao') {
      var data = sheet.getDataRange().getValues();
      if (data.length > 0) {
        result[name] = data;
      }
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify({ 'status': 'success', 'data': result })).setMimeType(ContentService.MimeType.JSON);
}`}
                           </pre>
                           <p>3. <b>Deploy (Triển khai)</b> &gt; <b>New deployment</b> &gt; Web app &gt; Executed as: <b>Me</b> &gt; Access: <b>Anyone (Bất kỳ ai)</b>.</p>
                           <p>4. Copy link <code>/exec</code> của file 1 dán vào ô "GỬI BÁO CÁO".</p>
                           <p>5. Copy link <code>/exec</code> của file 2 dán vào ô "NGUỒN DỮ LIỆU".</p>
                        </div>
                     </details>
                  </div>

                  <hr className="my-6 border-gray-200" />
                  
                  {/* Password Change Section */}
                  <div className="mb-8">
                     <h4 className="text-md font-bold text-gray-800 mb-3 flex items-center">
                        <span className="bg-gray-200 p-1 rounded mr-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></span>
                        Đổi mật khẩu Admin
                     </h4>
                     <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="text-sm text-gray-600 mb-2">Mật khẩu mặc định là: <b>123@123@123@</b></div>
                        <div className="flex gap-2 items-center">
                           <input 
                              type="password"
                              className="flex-1 px-3 py-2 border rounded shadow-sm"
                              placeholder="Nhập mật khẩu mới..."
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                           />
                           <button 
                              onClick={handleChangePassword}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                           >
                              Lưu thay đổi
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Delegation Section */}
                  <div>
                     <h4 className="text-md font-bold text-gray-800 mb-3 flex items-center">
                        <span className="bg-gray-200 p-1 rounded mr-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></span>
                        Phân quyền Admin qua Email
                     </h4>
                     <div className="flex gap-2 mb-4">
                        <input
                           type="email"
                           className="flex-1 px-3 py-2 border rounded shadow-sm"
                           placeholder="nhanvien@example.com"
                           value={newEmail}
                           onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <button 
                           onClick={handleAddEmail}
                           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                        >
                           Thêm Email
                        </button>
                     </div>

                     <div className="space-y-2 border rounded bg-gray-50 p-2 max-h-60 overflow-y-auto">
                        {adminEmails && adminEmails.length > 0 ? adminEmails.map((email, idx) => (
                           <div key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border">
                              <span className="text-sm font-medium">{email}</span>
                              <div className="flex gap-2">
                                 <a 
                                    href={`mailto:${email}?subject=Mời tham gia quản trị hệ thống Báo Cáo Thi&body=Xin chào,%0D%0A%0D%0ABạn đã được cấp quyền quản trị hệ thống Báo Cáo Giám Sát Thi.%0D%0A%0D%0AMật khẩu đăng nhập hiện tại là: ${adminPassword}%0D%0A%0D%0AVui lòng truy cập hệ thống để làm việc.`}
                                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                                    title="Gửi mail thông báo"
                                 >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    Gửi Invite
                                 </a>
                                 <button 
                                    onClick={() => handleRemoveEmail(idx)}
                                    className="text-red-500 hover:text-red-700"
                                 >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                 </button>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center text-gray-400 py-4 text-sm">Chưa có email nào được phân quyền.</div>
                        )}
                     </div>
                  </div>

               </div>
            )}

            {activeTab === 'background' && setBackgroundImage && (
              <div className="h-full overflow-y-auto pr-2">
                 
                 {/* TITLE & DESCRIPTION */}
                 <div className="mb-6">
                    <h4 className="text-md font-bold text-blue-800 mb-2">1. Thông tin Ứng dụng</h4>
                    <div className="space-y-3">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tên Tiêu Đề</label>
                          <input 
                             type="text"
                             className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                             value={appTitle}
                             onChange={(e) => setAppTitle(e.target.value)}
                             placeholder="VD: Báo Cáo Nhanh Giám Sát Thi"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                          <textarea 
                             className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                             value={appDescription}
                             onChange={(e) => setAppDescription(e.target.value)}
                             placeholder="VD: Hệ thống báo cáo trực tuyến..."
                             rows={2}
                          />
                       </div>
                    </div>
                 </div>

                 <hr className="my-6 border-gray-300" />

                 {/* APP BACKGROUND SECTION */}
                 <div className="mb-6">
                   <h4 className="text-md font-bold text-blue-800 mb-2">2. Hình Nền Ứng Dụng (Background)</h4>
                   <div className="mb-4">
                     <div className="text-sm font-medium text-gray-700 mb-2">Ảnh đang dùng:</div>
                     <div className="h-24 w-full bg-gray-200 rounded-lg overflow-hidden border border-gray-300 relative group">
                       {backgroundImage ? (
                         <img src={backgroundImage} alt="Current bg" className="w-full h-full object-cover" />
                       ) : (
                         <div className="flex items-center justify-center h-full text-gray-400">Mặc định (Xám nhạt)</div>
                       )}
                       {backgroundImage && (
                         <button 
                          onClick={() => setBackgroundImage('')}
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           Gỡ bỏ hình nền
                         </button>
                       )}
                     </div>
                   </div>

                   <div className="mb-4">
                     <div className="text-sm font-medium text-gray-700 mb-2">Ảnh đẹp có sẵn (Nhấp để chọn):</div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {PRESET_BACKGROUNDS.map((bg, idx) => (
                         <div 
                          key={idx} 
                          className="cursor-pointer rounded-lg overflow-hidden border border-gray-200 h-16 relative group"
                          onClick={() => setBackgroundImage(bg.url)}
                         >
                            <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                            {backgroundImage === bg.url && (
                               <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none"></div>
                            )}
                         </div>
                       ))}
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Tải ảnh lên:</div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setBackgroundImage)}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                     </div>
                     <div>
                         <div className="text-sm font-medium text-gray-700 mb-1">Hoặc dùng URL:</div>
                         <div className="flex gap-1">
                           <input 
                            className="flex-1 px-2 py-1 border rounded-md text-xs"
                            placeholder="https://..."
                            value={customBgUrl}
                            onChange={(e) => setCustomBgUrl(e.target.value)}
                           />
                           <button 
                            onClick={() => { if(customBgUrl) { setBackgroundImage(customBgUrl); setCustomBgUrl(''); }}}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                           >
                             Lưu
                           </button>
                        </div>
                     </div>
                   </div>
                 </div>
                 
                 <hr className="my-6 border-gray-300" />

                 {/* BANNER SECTION */}
                 <div className="mb-6">
                    <h4 className="text-md font-bold text-blue-800 mb-2">3. Ảnh Bìa (Banner Header)</h4>
                    <p className="text-xs text-gray-500 mb-2">Ảnh này sẽ được hiển thị "vừa khung" (object-fill) để lấp đầy phần đầu trang.</p>
                    <div className="flex items-start gap-4 mb-3">
                       <div className="w-1/2 h-24 bg-gray-100 border rounded overflow-hidden relative group">
                          {bannerImage ? <img src={bannerImage} className="w-full h-full object-fill" /> : <span className="flex items-center justify-center h-full text-xs text-gray-400">Trống</span>}
                           {bannerImage && setBannerImage && (
                             <button 
                              onClick={() => setBannerImage('')}
                              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                             >Xóa</button>
                           )}
                       </div>
                       <div className="flex-1 space-y-2">
                           <div>
                              <div className="text-xs font-medium text-gray-700">Tải ảnh bìa:</div>
                              <input 
                                type="file" accept="image/*"
                                onChange={(e) => handleImageUpload(e, setBannerImage)}
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                           </div>
                           <div className="flex gap-1">
                               <input 
                                className="flex-1 px-2 py-1 border rounded-md text-xs"
                                placeholder="URL Ảnh bìa..."
                                value={customBannerUrl}
                                onChange={(e) => setCustomBannerUrl(e.target.value)}
                               />
                               <button 
                                onClick={() => { if(customBannerUrl && setBannerImage) { setBannerImage(customBannerUrl); setCustomBannerUrl(''); }}}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                               >Lưu</button>
                           </div>
                       </div>
                    </div>
                 </div>

              </div>
            )}

            {activeTab === 'supervisors' && (
              <>
                 <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded">
                    Lưu ý: Bạn có thể nhập thêm các tên viết tắt hoặc tên thường gọi vào đây. Danh sách đầy đủ được lấy từ mục "Danh sách Cán bộ".
                 </div>
                 {renderStringList(supervisors, setSupervisors, 'Nhập tên cán bộ...')}
              </>
            )}
            
            {activeTab === 'subjects' && renderStringList(subjects, setSubjects, 'Nhập tên môn thi...')}
            
            {activeTab === 'rooms' && renderStringList(rooms, setRooms, 'Nhập tên phòng (VD: P.201, GĐ1)...')}
            
            {activeTab === 'shifts' && renderStringList(shifts, setShifts, 'Nhập giờ thi (VD: 8H30)...')}

            {activeTab === 'areas' && (
              <div className="flex flex-col h-full">
                {/* Add Area Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                  <input
                    className="px-2 py-1.5 border rounded text-sm"
                    placeholder="Mã (VD: KV3)"
                    value={newAreaId}
                    onChange={(e) => setNewAreaId(e.target.value)}
                  />
                  <input
                    className="px-2 py-1.5 border rounded text-sm"
                    placeholder="Tên (VD: Khu vực 3)"
                    value={newAreaLabel}
                    onChange={(e) => setNewAreaLabel(e.target.value)}
                  />
                  <div className="flex gap-2">
                     <input
                        className="flex-1 px-2 py-1.5 border rounded text-sm"
                        placeholder="Mô tả (VD: Giảng đường A)"
                        value={newAreaDesc}
                        onChange={(e) => setNewAreaDesc(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddArea()}
                      />
                      <button onClick={handleAddArea} className="px-3 bg-blue-600 text-white rounded text-sm">
                        +
                      </button>
                  </div>
                </div>

                {/* List Areas */}
                <div className="flex-1 overflow-auto space-y-2">
                   {areas.map((area, index) => (
                      <div key={index} className="bg-white p-3 rounded shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="col-span-2">
                           <input 
                              className="w-full font-bold text-gray-700 bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-sm"
                              value={area.id}
                              onChange={(e) => handleUpdateArea(index, 'id', e.target.value)}
                           />
                        </div>
                        <div className="col-span-4">
                           <input 
                              className="w-full text-gray-800 bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-sm"
                              value={area.label}
                              onChange={(e) => handleUpdateArea(index, 'label', e.target.value)}
                           />
                        </div>
                        <div className="col-span-5">
                           <input 
                              className="w-full text-gray-500 bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-sm italic"
                              value={area.description}
                              onChange={(e) => handleUpdateArea(index, 'description', e.target.value)}
                           />
                        </div>
                        <div className="col-span-1 text-right">
                           <button onClick={() => handleDeleteArea(index)} className="text-red-400 hover:text-red-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </div>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="flex flex-col h-full">
                {/* Excel Upload for Staff */}
                <div className="mb-4 bg-green-50 p-3 rounded border border-green-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                   <div className="flex items-center gap-2">
                      <input 
                         type="file" 
                         ref={staffFileInputRef}
                         onChange={handleStaffFileUpload}
                         accept=".xlsx, .xls, .csv"
                         className="hidden"
                      />
                      <button 
                         onClick={() => staffFileInputRef.current?.click()}
                         className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center shadow-sm"
                      >
                         <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                         Nhập Excel
                      </button>

                      {/* Cloud Sync Button (Uses SCHEDULE SOURCE URL) */}
                      <button 
                         onClick={handleCloudImport}
                         disabled={isSyncingCloud}
                         className={`px-3 py-1.5 text-white rounded text-sm flex items-center shadow-sm transition-colors ${isSyncingCloud ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'}`}
                         title="Tải danh sách cán bộ từ Nguồn Dữ Liệu"
                      >
                         {isSyncingCloud ? (
                             <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         ) : (
                             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                         )}
                         Đồng bộ từ Google Sheet
                      </button>
                   </div>
                   
                   <div className="text-right">
                      <div className="text-xs text-gray-500">
                         Tổng: {staffList.length}
                      </div>
                      <span className="text-xs text-gray-600 italic block mt-1">
                         {staffUploadStatus || "Cần cột: 'Tên' và 'Mã'"}
                      </span>
                   </div>
                </div>

                {/* Add Manual Staff */}
                <div className="flex gap-2 mb-4">
                  <input
                    className="w-1/3 px-2 py-1.5 border rounded text-sm"
                    placeholder="Mã (VD: NV01)"
                    value={newStaffCode}
                    onChange={(e) => setNewStaffCode(e.target.value)}
                  />
                  <input
                    className="flex-1 px-2 py-1.5 border rounded text-sm"
                    placeholder="Họ và Tên"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStaff()}
                  />
                  <button onClick={handleAddStaff} className="px-4 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Thêm
                  </button>
                </div>

                {/* List Staff */}
                <div className="flex-1 overflow-auto space-y-2 border rounded-md bg-gray-50 p-2">
                   {staffList.map((s, index) => (
                      <div key={index} className="flex gap-2 items-center bg-white p-2 rounded shadow-sm border border-gray-200">
                        <div className="w-1/4">
                           <input 
                              className="w-full text-xs font-mono text-gray-600 bg-transparent outline-none"
                              value={s.code}
                              onChange={(e) => handleUpdateStaff(index, 'code', e.target.value)}
                              placeholder="Mã..."
                           />
                        </div>
                        <div className="flex-1">
                           <input 
                              className="w-full text-sm font-medium text-gray-800 bg-transparent outline-none"
                              value={s.name}
                              onChange={(e) => handleUpdateStaff(index, 'name', e.target.value)}
                              placeholder="Tên..."
                           />
                        </div>
                        <button
                          onClick={() => handleDeleteStaff(index)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                   ))}
                   {staffList.length === 0 && <div className="text-center text-gray-400 py-4">Chưa có dữ liệu cán bộ. Hãy nhập Excel hoặc Đồng bộ Cloud.</div>}
                </div>
              </div>
            )}

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
          >
            Đóng & Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
