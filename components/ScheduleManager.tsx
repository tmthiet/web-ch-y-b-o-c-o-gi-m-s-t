import React, { useState } from 'react';
import { ScheduleItem } from '../types';

interface ScheduleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ScheduleItem[];
  onUpdateItem: (id: string, field: keyof ScheduleItem, value: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateItem,
  onDeleteItem,
  onClearAll
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-blue-800 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold">Quản lý Dữ liệu Lịch thi</h2>
            <p className="text-blue-200 text-sm">Tổng số: {items.length} dòng dữ liệu</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div className="text-sm text-gray-600 italic">
            * Bấm vào ô dữ liệu để chỉnh sửa trực tiếp. Dữ liệu này dùng để gợi ý tự động.
          </div>
          <button
            onClick={() => {
              if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ danh sách lịch thi đã nhập?")) {
                onClearAll();
              }
            }}
            className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Xóa tất cả
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p>Chưa có dữ liệu lịch thi nào.</p>
              <p className="text-sm">Vui lòng nhập file Excel từ màn hình chính.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Ngày thi</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Giờ/Ca</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Môn / Học phần</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Phòng</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-48">Cán bộ coi thi</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-16">Xóa</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50 transition-colors group">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input 
                          type="date" 
                          className="w-full text-sm border-none bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1"
                          value={item.date}
                          onChange={(e) => onUpdateItem(item.id, 'date', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input 
                          type="text" 
                          className="w-full text-sm border-none bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1"
                          value={item.timeStr}
                          onChange={(e) => onUpdateItem(item.id, 'timeStr', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          className="w-full text-sm border-none bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1"
                          value={item.subject}
                          onChange={(e) => onUpdateItem(item.id, 'subject', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                         <input 
                          type="text" 
                          className="w-full text-sm border-none bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1"
                          value={item.room || ''}
                          placeholder="---"
                          onChange={(e) => onUpdateItem(item.id, 'room', e.target.value)}
                        />
                      </td>
                       <td className="px-3 py-2">
                         <input 
                          type="text" 
                          className="w-full text-sm border-none bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1"
                          value={item.proctor || ''}
                          placeholder="---"
                          onChange={(e) => onUpdateItem(item.id, 'proctor', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <button 
                          onClick={() => onDeleteItem(item.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Xóa dòng này"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            Đóng & Sử dụng
          </button>
        </div>
      </div>
    </div>
  );
};
