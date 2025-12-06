import React, { useState, useMemo } from 'react';
import { FormField } from './FormField';
import { ScheduleItem, Staff } from '../types';
import { Combobox } from './Combobox';
import { AREA_KEYWORDS } from '../constants';

interface IncidentWithSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  hasIncident: boolean;
  scheduleData: ScheduleItem[]; // Full data objects
  defaultProctors: string[];    // Fallback list (Used for Substitute/Supervisor suggestions)
  defaultRooms?: string[];      // Fallback list for Rooms
  staffList?: Staff[];          // New: Full staff list with ID
  isSubstitute?: boolean;       // True = "Assignee asks Substitute" mode
  selectedArea?: string;        // New: Area ID to filter rooms
}

export const IncidentWithSelector: React.FC<IncidentWithSelectorProps> = ({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder,
  hasIncident,
  scheduleData,
  defaultProctors,
  defaultRooms = [],
  staffList = [],
  isSubstitute = false,
  selectedArea,
}) => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedProctor, setSelectedProctor] = useState(''); // This is the ASSIGNED proctor (Người nhờ)
  const [substituteName, setSubstituteName] = useState('');   // This is the NEW proctor (Người coi thay)

  // 1. Get List of Unique Rooms (Smart Filtering)
  const availableRooms = useMemo(() => {
    // Rooms coming from the schedule (already filtered by Date/Shift/Subject in App.tsx)
    const roomsFromSchedule = Array.from(new Set(scheduleData.map(i => i.room).filter(Boolean))) as string[];
    
    // Filter default rooms based on Selected Area
    let filteredDefaultRooms = defaultRooms;
    if (selectedArea && AREA_KEYWORDS[selectedArea]) {
      const keywords = AREA_KEYWORDS[selectedArea];
      filteredDefaultRooms = defaultRooms.filter(room => {
        const roomUpper = room.toUpperCase();
        return keywords.some(kw => roomUpper.includes(kw));
      });
    }

    // STRICT FILTERING LOGIC:
    // If we have specific rooms from the imported schedule (meaning we found exams for the selected Subject),
    // we show ONLY those rooms to be precise.
    // We do NOT merge with the generic default list, because that defeats the purpose of filtering by Subject.
    if (roomsFromSchedule.length > 0) {
       return roomsFromSchedule.sort();
    }

    // Fallback: If no specific schedule rooms found (e.g. manual entry or no match), show generic area rooms
    return filteredDefaultRooms.sort();
  }, [scheduleData, defaultRooms, selectedArea]);

  // 2. Filter ASSIGNED Proctors (Cán bộ trong lịch) based on Selected Room
  // STRICT RULE: Only take from SCHEDULE DATA. Do not merge with Staff List.
  // UPDATE: Enhanced splitting logic for multiple names in one cell
  const availableAssignedProctors = useMemo(() => {
    // Helper to extract names splitting by common delimiters:
    // , (comma)
    // ; (semicolon)
    // \n (newline - Alt+Enter)
    // - (hyphen surrounded by spaces)
    // + (plus surrounded by spaces)
    // & (ampersand surrounded by spaces)
    const extractNames = (items: ScheduleItem[]) => items.flatMap(i => 
      (i.proctor || '')
        .split(/[,;\n\r]+|\s[-+&]\s/) // Regex to split by delimiters
        .map(s => s.trim())            // Trim whitespace
    ).filter(s => s && s.length > 1);  // Filter empty or single char noise

    if (selectedRoom) {
      const relevantItems = scheduleData.filter(i => i.room === selectedRoom);
      // Logic mới: Lấy raw string từ cột proctor và tách ra
      const rawProctors = relevantItems.map(i => i.proctor || '');
      // Tách chuỗi phức tạp: Nguyễn Văn A, Nguyễn Văn B, hoặc Nguyễn Văn A - Nguyễn Văn B
      const splitProctors = rawProctors.flatMap(p => 
        p.split(/[,;\n\r]+| - | \+ /).map(s => s.trim()).filter(s => s.length > 1)
      );
      
      return Array.from(new Set(splitProctors)).sort();
    } else {
      const allScheduleProctors = extractNames(scheduleData);
      return Array.from(new Set(allScheduleProctors)).sort();
    }
  }, [selectedRoom, scheduleData]);

  // 3. Substitute Suggestion List (Người thay)
  // STRICT RULE: Take from STAFF LIST (or defaultProctors as fallback for Supervisors)
  const substituteOptions = useMemo(() => {
     // Prioritize Staff List with Code - Format: Name (Code)
     if (staffList.length > 0) {
        return staffList.map(s => `${s.name}${s.code ? ` (${s.code})` : ''}`);
     }
     // Fallback to simple Supervisor list if no full staff list imported
     return defaultProctors;
  }, [staffList, defaultProctors]);

  const handleQuickAdd = () => {
    if (!selectedRoom && !selectedProctor && !substituteName) return;

    let newItem = '';

    if (isSubstitute) {
      if (!substituteName) return; 
      // Clean up the name for the report (optional: remove code if preferred, but keeping it is usually safer)
      const substituteDisplay = substituteName; 

      const roomPart = selectedRoom ? `(tại Phòng ${selectedRoom})` : '';
      const originalPart = selectedProctor ? `CB ${selectedProctor}` : 'Một cán bộ';
      // Format: "Phòng X: Cán bộ B coi thay cán bộ A" for better AI processing
      newItem = `${selectedRoom ? `Phòng ${selectedRoom}: ` : ''}CB ${substituteDisplay} coi thay CB ${selectedProctor || 'vắng mặt'}`.trim();
    } else {
      const proctorPart = selectedProctor || 'Chưa rõ tên';
      const roomPart = selectedRoom ? `(Phòng ${selectedRoom})` : '';
      newItem = `${proctorPart} ${roomPart}`.trim();
    }
    
    if (!newItem) return;

    const newValue = value ? `${value}\n- ${newItem}` : `- ${newItem}`;
    
    const event = {
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(event);
    
    // Reset selection
    setSelectedProctor('');
    setSubstituteName('');
    // Keep Room
  };

  const selectClass = "w-full text-sm"; 

  return (
    <div className={`transition-all duration-300 ${hasIncident ? 'bg-red-50 p-3 rounded-lg border border-red-200' : 'bg-white'}`}>
      <FormField label={label} htmlFor={id} icon={
        hasIncident ? (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )
      }>
        {/* Quick Add Bar */}
        <div className="flex flex-col md:flex-row flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded border border-gray-200 items-end md:items-center">
           
           {/* 1. ROOM SELECT (COMBOBOX) */}
           <div className="w-full md:w-[130px]">
             <Combobox
                value={selectedRoom}
                onChange={(val) => {
                   setSelectedRoom(val);
                }}
                options={availableRooms}
                placeholder="Phòng..."
                className={selectClass}
             />
           </div>

           {/* 2. ASSIGNED PROCTOR SELECT (COMBOBOX) */}
           {/* Source: SCHEDULE DATA ONLY */}
           <div className="flex-1 min-w-[150px] w-full">
             <Combobox
                value={selectedProctor}
                onChange={(val) => setSelectedProctor(val)}
                options={availableAssignedProctors}
                placeholder={selectedRoom 
                  ? (isSubstitute ? `Người được phân công tại ${selectedRoom}...` : `CB phân công tại ${selectedRoom}...`) 
                  : "Chọn CB trong Lịch thi..."}
                className={selectClass}
             />
           </div>

           {/* 3. SUBSTITUTE NAME SELECT (COMBOBOX) */}
           {/* Source: STAFF LIST (Config/Excel) */}
           {isSubstitute && (
              <>
                 <div className="hidden md:block text-gray-400">→</div>
                 <div className="flex-1 min-w-[150px] w-full relative">
                    <Combobox
                       value={substituteName}
                       onChange={(val) => setSubstituteName(val)}
                       options={substituteOptions}
                       placeholder="Nhập Tên hoặc Mã (MSCB)..."
                       className={selectClass}
                    />
                 </div>
              </>
           )}

           <button 
             onClick={handleQuickAdd}
             className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors shadow-sm font-medium h-[40px]" 
             type="button"
           >
             Thêm
           </button>
        </div>

        <textarea
          id={id}
          value={value}
          onChange={onChange}
          rows={hasIncident ? 3 : 2}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            hasIncident ? 'border-red-300 bg-white' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
      </FormField>
    </div>
  );
};