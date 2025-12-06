
import React, { useState, useEffect } from 'react';
import { SavedReport, AreaOption } from '../types';

interface ReportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: SavedReport[];
  areasList: AreaOption[];
  onClearHistory: () => void;
  onDeleteReport: (id: string) => void;
  reportWebhookUrl?: string; // Renamed from googleSheetUrl for clarity
  onMarkAsSynced: (ids: string[]) => void;
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({
  isOpen,
  onClose,
  reports,
  areasList,
  onClearHistory,
  onDeleteReport,
  reportWebhookUrl,
  onMarkAsSynced
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Reset state khi mở/đóng modal
  useEffect(() => {
    if (!isOpen) {
      setSyncStatus('');
      setIsSyncing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getAreaLabel = (areaId: string) => {
    const area = areasList.find(a => a.id === areaId);
    return area ? area.label : areaId;
  };

  const handleClearAllClick = () => {
    if (reports.length === 0) return;
    
    setTimeout(() => {
      if (window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử báo cáo không?\n\nHành động này không thể hoàn tác.")) {
        onClearHistory();
      }
    }, 50);
  };

  const handleSyncClick = async () => {
    // Chặn click đúp
    if (isSyncing) return;

    // 1. Kiểm tra URL
    if (!reportWebhookUrl || reportWebhookUrl.trim() === '') {
      alert("⚠️ LỖI: Chưa có đường dẫn Webhook Báo Cáo!\n\nVui lòng vào Cài đặt (Bánh răng) -> Bảo mật -> Dán đường dẫn Web App vào ô 'GỬI BÁO CÁO'.");
      return;
    }

    let targetUrl = reportWebhookUrl.trim();
    
    // Tự động sửa lỗi URL phổ biến
    if (targetUrl.includes('/edit')) {
       alert("⚠️ LINK SAI: Đây là link chỉnh sửa file, không phải Webhook.\n\nVui lòng xem hướng dẫn trong phần Cài đặt để lấy link 'exec'.");
       return;
    }
    
    const match = targetUrl.match(/https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec/);
    if (match) {
        targetUrl = match[0];
    } else if (!targetUrl.endsWith('/exec')) {
        if(!window.confirm("⚠️ CẢNH BÁO: Link có vẻ không đúng định dạng (thiếu /exec).\n\nBạn có muốn tiếp tục thử không?")) {
            return;
        }
    }

    // Lọc ra các mục CHƯA đồng bộ
    const reportsToSync = reports.filter(r => !r.isSynced);

    if (reportsToSync.length === 0) {
      alert("Tất cả dữ liệu đã được đồng bộ trước đó. Không có gì mới để gửi.");
      return;
    }

    // 2. Bắt đầu Sync
    setIsSyncing(true);
    setSyncStatus(`Đang gửi ${reportsToSync.length} dòng...`);

    try {
      const payload = JSON.stringify(reportsToSync);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch(targetUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: payload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const textResponse = await response.text();
      let jsonResponse;
      
      try {
        jsonResponse = JSON.parse(textResponse);
      } catch (e) {
        console.error("Response is not JSON:", textResponse);
        throw new Error("Phản hồi từ Google không đúng định dạng JSON. Có thể do lỗi quyền truy cập (Access Denied). Hãy kiểm tra lại chế độ 'Anyone' khi Deploy.");
      }

      if (jsonResponse.result === 'success') {
        const count = jsonResponse.count || reportsToSync.length;
        alert(`✅ THÀNH CÔNG!\n\nĐã đồng bộ thêm ${count} dòng dữ liệu mới.`);
        setSyncStatus('Thành công!');
        
        // Cập nhật trạng thái đã Sync cho các mục vừa gửi
        const syncedIds = reportsToSync.map(r => r.id);
        onMarkAsSynced(syncedIds);
      } else {
        throw new Error(jsonResponse.error || 'Lỗi không xác định từ Google Script.');
      }

    } catch (error: any) {
      console.error("Sync Failed:", error);
      let errorMsg = "Không thể kết nối đến Google Sheet.";
      
      if (error.name === 'AbortError') {
        errorMsg = "Hết thời gian chờ (Timeout). Mạng quá chậm hoặc Google không phản hồi.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMsg = "Lỗi mạng hoặc bị chặn (CORS). Hãy đảm bảo bạn đã chọn 'Anyone' (Bất kỳ ai) trong phần 'Who has access' khi Deploy script.";
      } else {
        errorMsg = error.message;
      }
      
      alert(`❌ THẤT BẠI:\n${errorMsg}`);
      setSyncStatus('Lỗi kết nối');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportExcel = () => {
    if (!window.XLSX) {
      alert('Thư viện Excel chưa tải xong. Vui lòng đợi và thử lại.');
      return;
    }

    const exportData = reports.map((r, index) => ({
      'STT': index + 1,
      'TRẠNG THÁI': r.isSynced ? "Đã gửi" : "Chưa gửi",
      'THỜI GIAN GỬI': new Date(r.timestamp).toLocaleString('vi-VN'),
      'CÁN BỘ GIÁM SÁT': r.supervisorName,
      'NGÀY THI': r.examDate,
      'CA THI': r.shift,
      'KHU VỰC GIÁM SÁT': getAreaLabel(r.area),
      'MÔN THI': r.subject,
      'CÁN BỘ COI THI TRỄ': r.lateProctors,
      'CÁN BỘ VẮNG THI': r.absentProctors,
      'CÁN BỘ COI THI THẾ': r.substituteProctors, // Cột riêng
      'CÁN BỘ COI THI THAY': r.changedProctors,   // Cột riêng
      'SAI SÓT ĐỀ THI': r.examPaperErrors,
      'SV/HV VI PHẠM': r.studentViolations,
      'GHI CHÚ': r.notes
    }));

    const worksheet = window.XLSX.utils.json_to_sheet(exportData);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoGiamSat");
    window.XLSX.writeFile(workbook, `BaoCaoGiamSat_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Tính số lượng chưa đồng bộ
  const unsyncedCount = reports.filter(r => !r.isSynced).length;

  // Helper class for table headers
  const thClass = "px-3 py-3 text-left font-bold text-gray-700 border border-gray-300 whitespace-nowrap bg-gray-100";
  const tdClass = "px-3 py-2 border border-gray-300 whitespace-pre-wrap min-w-[150px]";

  return (
    // Z-Index 100 để đảm bảo nằm trên cùng. Bỏ animation để tránh lỗi click.
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 p-2 md:p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-[98vw] h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-4 py-3 bg-green-700 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Lịch Sử Báo Cáo
            </h2>
            <p className="text-green-100 text-xs md:text-sm">Tổng: {reports.length} bản ghi | Chưa đồng bộ: {unsyncedCount}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-green-600 rounded-full p-2 transition-colors focus:outline-none"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-center shrink-0">
          <div className="text-sm font-medium w-full md:w-auto text-center md:text-left">
             {syncStatus ? (
               <span className={`flex items-center justify-center md:justify-start ${syncStatus.includes('Lỗi') ? 'text-red-600' : 'text-blue-600'}`}>
                 {isSyncing && <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                 {syncStatus}
               </span>
             ) : (
               <span className="text-gray-500">
                  {unsyncedCount > 0 
                    ? `Có ${unsyncedCount} báo cáo mới cần đồng bộ.` 
                    : "Tất cả dữ liệu đã được đồng bộ."}
               </span>
             )}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleClearAllClick}
              disabled={isSyncing || reports.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Xóa hết
            </button>
            
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing || unsyncedCount === 0}
              className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 text-white rounded-md transition-colors text-sm font-bold shadow-sm min-w-[150px] ${isSyncing || unsyncedCount === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
               {isSyncing ? 'Đang gửi...' : `Đồng bộ (${unsyncedCount})`}
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isSyncing || reports.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden md:inline">Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-2 md:p-4">
          {reports.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <svg className="w-20 h-20 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <p>Chưa có báo cáo nào được lưu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
              <table className="min-w-full divide-y divide-gray-200 border-collapse text-xs md:text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-2 py-3 text-center font-bold text-gray-700 border border-gray-300 w-10">STT</th>
                    <th className="px-2 py-3 text-center font-bold text-gray-700 border border-gray-300 w-12" title="Trạng thái đồng bộ">Sync</th>
                    <th className={thClass}>THỜI GIAN GỬI</th>
                    <th className={thClass}>CÁN BỘ GIÁM SÁT</th>
                    <th className={thClass}>NGÀY THI</th>
                    <th className={thClass}>CA THI</th>
                    <th className={thClass}>KHU VỰC GIÁM SÁT</th>
                    <th className={thClass}>MÔN THI</th>
                    <th className={`${thClass} text-red-700 bg-red-50`}>CÁN BỘ COI THI TRỄ</th>
                    <th className={`${thClass} text-red-700 bg-red-50`}>CÁN BỘ VẮNG THI</th>
                    
                    {/* CỘT THẾ VÀ THAY RIÊNG BIỆT */}
                    <th className={`${thClass} text-blue-800 bg-blue-100 border-blue-200`}>CÁN BỘ COI THI THẾ</th>
                    <th className={`${thClass} text-purple-800 bg-purple-100 border-purple-200`}>CÁN BỘ COI THI THAY</th>
                    
                    <th className={`${thClass} text-orange-700 bg-orange-50`}>SAI SÓT ĐỀ THI</th>
                    <th className={`${thClass} text-red-700 bg-red-50`}>SV/HV VI PHẠM</th>
                    <th className={thClass}>GHI CHÚ</th>
                    <th className="px-2 py-3 text-center font-bold text-gray-700 border border-gray-300 sticky right-0 bg-gray-100 shadow-l">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report, index) => (
                    <tr key={report.id} className="hover:bg-yellow-50 transition-colors">
                      <td className="px-2 py-2 text-center border border-gray-300 bg-gray-50 font-semibold">{index + 1}</td>
                      <td className="px-2 py-2 text-center border border-gray-300">
                        {report.isSynced ? (
                          <div className="flex justify-center" title="Đã đồng bộ Google Sheet">
                             <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        ) : (
                          <div className="flex justify-center" title="Chưa đồng bộ">
                             <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                          </div>
                        )}
                      </td>
                      <td className={tdClass}>{new Date(report.timestamp).toLocaleString('vi-VN')}</td>
                      <td className={`${tdClass} font-semibold`}>{report.supervisorName}</td>
                      <td className={tdClass}>{report.examDate}</td>
                      <td className={tdClass}>{report.shift}</td>
                      <td className={tdClass}>{getAreaLabel(report.area)}</td>
                      <td className={tdClass}>{report.subject}</td>
                      
                      {/* Cột Chi tiết Sự cố */}
                      <td className={`${tdClass} ${report.lateProctors ? 'bg-red-50 text-red-700 font-medium' : ''}`}>
                         {report.lateProctors}
                      </td>
                      <td className={`${tdClass} ${report.absentProctors ? 'bg-red-50 text-red-700 font-medium' : ''}`}>
                         {report.absentProctors}
                      </td>
                      
                      {/* DỮ LIỆU CỘT THẾ */}
                      <td className={`${tdClass} ${report.substituteProctors ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}>
                         {report.substituteProctors}
                      </td>
                      
                      {/* DỮ LIỆU CỘT THAY */}
                      <td className={`${tdClass} ${report.changedProctors ? 'bg-purple-50 text-purple-700 font-medium' : ''}`}>
                         {report.changedProctors}
                      </td>
                      
                      <td className={`${tdClass} ${report.examPaperErrors ? 'bg-orange-50 text-orange-700 font-medium' : ''}`}>
                         {report.examPaperErrors}
                      </td>
                      <td className={`${tdClass} ${report.studentViolations ? 'bg-red-50 text-red-700 font-medium' : ''}`}>
                         {report.studentViolations}
                      </td>

                      <td className={tdClass}>{report.notes}</td>
                      <td className="px-2 py-2 text-center border border-gray-300 sticky right-0 bg-white group-hover:bg-yellow-50 shadow-l">
                        <button 
                          onClick={() => {
                             if(window.confirm("Xóa dòng báo cáo này?")) {
                               onDeleteReport(report.id);
                             }
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-2"
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
      </div>
    </div>
  );
};
