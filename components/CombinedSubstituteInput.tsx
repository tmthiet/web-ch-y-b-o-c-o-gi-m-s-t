
import React, { useState, useMemo } from 'react';
import { ScheduleItem, Staff } from '../types';
import { Combobox } from './Combobox';
import { AREA_KEYWORDS } from '../constants';

interface CombinedSubstituteInputProps {
  substituteValue: string;
  changedValue: string;
  onSubstituteChange: (val: string) => void;
  onChangedChange: (val: string) => void;
  scheduleData: ScheduleItem[];
  defaultProctors: string[];
  defaultRooms?: string[];
  staffList?: Staff[];
  selectedArea?: string;
}

export const CombinedSubstituteInput: React.FC<CombinedSubstituteInputProps> = ({
  substituteValue,
  changedValue,
  onSubstituteChange,
  onChangedChange,
  scheduleData,
  defaultProctors,
  defaultRooms = [],
  staffList = [],
  selectedArea,
}) => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedOldProctor, setSelectedOldProctor] = useState(''); // Người trong lịch
  const [selectedNewProctor, setSelectedNewProctor] = useState(''); // Người trong danh sách (Mới)

  // 1. Get List of Unique Rooms
  const availableRooms = useMemo(() => {
    const roomsFromSchedule = Array.from(new Set(scheduleData.map(i => i.room).filter(Boolean))) as string[];
    
    let filteredDefaultRooms = defaultRooms;
    if (selectedArea && AREA_KEYWORDS[selectedArea]) {
      const keywords = AREA_KEYWORDS[selectedArea];
      filteredDefaultRooms = defaultRooms.filter(room => {
        const roomUpper = room.toUpperCase();
        return keywords.some(kw => roomUpper.includes(kw));
      });
    }

    if (roomsFromSchedule.length > 0) {
       return roomsFromSchedule.sort();
    }
    return filteredDefaultRooms.sort();
  }, [scheduleData, defaultRooms, selectedArea]);

  // 2. Filter Old Proctors (From Schedule) based on Room
  const availableOldProctors = useMemo(() => {
    const extractNames = (items: ScheduleItem[]) => items.flatMap(i => 
      (i.proctor || '').split(/[,;\n\r]+| - | \+ /).map(s => s.trim())
    ).filter(s => s && s.length > 1);

    if (selectedRoom) {
      const relevantItems = scheduleData.filter(i => i.room === selectedRoom);
      const rawProctors = relevantItems.map(i => i.proctor || '');
      const splitProctors = rawProctors.flatMap(p => 
        p.split(/[,;\n\r]+| - | \+ /).map(s => s.trim()).filter(s => s.length > 1)
      );
      return Array.from(new Set(splitProctors)).sort();
    } else {
      const allScheduleProctors = extractNames(scheduleData);
      return Array.from(new Set(allScheduleProctors)).sort();
    }
  }, [selectedRoom, scheduleData]);

  // 3. New Proctors (From Staff List)
  const availableNewProctors = useMemo(() => {
     if (staffList.length > 0) {
        return staffList.map(s => `${s.name}${s.code ? ` (${s.code})` : ''}`);
     }
     return defaultProctors;
  }, [staffList, defaultProctors]);

  const handleQuickAdd = () => {
    if (!selectedOldProctor && !selectedNewProctor) return; 

    const roomSuffix = selectedRoom ? ` (P.${selectedRoom})` : '';

    // LOGIC 1: Dropdown 2 (Trong Lịch) -> Vào ô THẾ
    if (selectedOldProctor) {
        const itemThế = `${selectedOldProctor}${roomSuffix}`;
        const newValThế = substituteValue ? `${substituteValue}\n- ${itemThế}` : `- ${itemThế}`;
        onSubstituteChange(newValThế);
    }

    // LOGIC 2: Dropdown 3 (Danh Sách) -> Vào ô THAY
    if (selectedNewProctor) {
        const itemThay = `${selectedNewProctor}${roomSuffix}`;
        const newValThay = changedValue ? `${changedValue}\n- ${itemThay}` : `- ${itemThay}`;
        onChangedChange(newValThay);
    }

    // Reset fields for next entry (Keep Room for convenience)
    setSelectedOldProctor('');
    setSelectedNewProctor('');
  };

  const hasIncident = !!substituteValue || !!changedValue;

  return (
    <div className={`transition-all duration-300 ${hasIncident ? 'bg-blue-50 p-3 rounded-lg border border-blue-200' : 'bg-white'}`}>
      <div className="mb-2">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
           <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
           Cán bộ coi thi THAY / THẾ
        </label>
        
        {/* Controls */}
        <div className="bg-white p-3 rounded border border-blue-100 shadow-sm">
            
            {/* 3-Step Selectors */}
            <div className="flex flex-col md:flex-row gap-2 items-end">
                <div className="w-full md:w-[130px]">
                    <Combobox
                        value={selectedRoom}
                        onChange={setSelectedRoom}
                        options={availableRooms}
                        placeholder="1. Phòng thi"
                        className="text-sm"
                    />
                </div>
                
                <div className="w-full md:flex-1">
                    <Combobox
                        value={selectedOldProctor}
                        onChange={setSelectedOldProctor}
                        options={availableOldProctors}
                        placeholder={selectedRoom ? `2. CB Lịch (Tại ${selectedRoom})` : "2. CB Trong Lịch..."}
                        className="text-sm"
                    />
                </div>

                <div className="hidden md:block text-gray-400 pb-2">➔</div>

                <div className="w-full md:flex-1">
                    <Combobox
                        value={selectedNewProctor}
                        onChange={setSelectedNewProctor}
                        options={availableNewProctors}
                        placeholder="3. CB Danh sách (Mới)..."
                        className="text-sm"
                    />
                </div>

                <button 
                    onClick={handleQuickAdd}
                    className="w-full md:w-auto px-4 py-2 text-white text-sm rounded transition-colors shadow-sm font-medium h-[40px] whitespace-nowrap bg-blue-600 hover:bg-blue-700"
                >
                    + Thêm
                </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic">
               * Hướng dẫn: Chọn [2. CB Trong Lịch] sẽ tự động vào ô "THẾ". Chọn [3. CB Danh sách] sẽ tự động vào ô "THAY".
            </p>
        </div>
      </div>

      {/* Result Textareas (Side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">
                  Danh sách THẾ (Cán bộ trong lịch/Vắng)
              </label>
              <textarea 
                  value={substituteValue}
                  onChange={(e) => onSubstituteChange(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Danh sách cán bộ trong lịch..."
              />
          </div>
          <div>
              <label className="block text-xs font-semibold text-purple-700 mb-1">
                  Danh sách THAY (Cán bộ danh sách/Mới)
              </label>
              <textarea 
                  value={changedValue}
                  onChange={(e) => onChangedChange(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-purple-200 bg-purple-50 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                  placeholder="Danh sách cán bộ mới..."
              />
          </div>
      </div>
    </div>
  );
};
