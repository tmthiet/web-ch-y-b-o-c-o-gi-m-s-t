

import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface ReferenceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleSourceUrl?: string; // Renamed from googleSheetUrl
  onOpenSettings: () => void;
}

// Interface for View Configuration
interface SheetViewConfig {
  hiddenCols: number[];
  colWidths: { [colIdx: number]: number };
}

interface ViewConfig {
  hiddenSheets: string[];
  sheets: { [sheetName: string]: SheetViewConfig };
}

export const ReferenceListModal: React.FC<ReferenceListModalProps> = ({
  isOpen,
  onClose,
  scheduleSourceUrl,
  onOpenSettings
}) => {
  const [data, setData] = useState<Record<string, any[][]>>({});
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Customization States
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewConfig, setViewConfig] = useState<ViewConfig>({ hiddenSheets: [], sheets: {} });

  // Load Config from LocalStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('reference_list_view_config');
      if (savedConfig) {
        setViewConfig(JSON.parse(savedConfig));
      }
    } catch (e) {
      console.error("Failed to load view config", e);
    }
  }, []);

  // Save Config to LocalStorage
  useEffect(() => {
    localStorage.setItem('reference_list_view_config', JSON.stringify(viewConfig));
  }, [viewConfig]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    // Trim URL to avoid whitespace issues
    const url = scheduleSourceUrl ? scheduleSourceUrl.trim() : '';

    if (!url) {
      setError("Chưa cấu hình 'Nguồn Dữ Liệu' (Google Sheet Lịch/Danh Sách).");
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Thêm timestamp để tránh cache
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;

      const response = await fetch(fetchUrl, {
        method: 'GET',
        redirect: 'follow'
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        throw new Error(`Lỗi kết nối (${response.status})`);
      }

      // Check if response is HTML
      if (contentType && contentType.indexOf("application/json") === -1) {
         throw new Error("Link không trả về JSON. Có thể bạn chưa cập nhật Code Script (thêm hàm doGet) hoặc chưa chọn 'New Deployment' (Triển khai mới).");
      }

      const result = await response.json();

      if (result.status === 'success') {
        const sheetsData = result.data;
        const names = Object.keys(sheetsData);
        
        if (names.length === 0) {
           setError("Kết nối thành công nhưng không tìm thấy dữ liệu nào.\n\nNguyên nhân: File Google Sheet của bạn có thể chỉ chứa mỗi sheet 'Baocao' (Hệ thống mặc định ẩn sheet này). Hãy tạo thêm các sheet khác (VD: Sheet1, DanhSach...) và nhập dữ liệu vào.");
        } else {
           setData(sheetsData);
           setSheetNames(names);
           
           // Determine active sheet based on visibility
           if (!activeSheet || !names.includes(activeSheet)) {
             // Find first visible sheet
             const firstVisible = names.find(n => !viewConfig.hiddenSheets.includes(n));
             setActiveSheet(firstVisible || names[0]);
           }
        }
      } else {
        throw new Error(result.message || "Lỗi không xác định từ Google Script.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi kết nối. Vui lòng kiểm tra lại đường dẫn Webhook.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Date Formatting Helper ---
  const formatCellData = useCallback((value: any): string => {
     if (value === null || value === undefined) return '';
     const str = String(value).trim();

     // 1. Check for ISO date (YYYY-MM-DD...)
     const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})/;
     const match = str.match(isoDateRegex);
     if (match) {
         const year = match[1];
         const month = match[2];
         const day = match[3];
         return `${day}/${month}/${year}`; 
     }
     
     // 2. Check for Google Sheet default format (YYYY-MM-DDTHH:mm:ss.sssZ)
     if (str.includes('T') && str.endsWith('Z') && !isNaN(Date.parse(str))) {
        try {
           const date = new Date(str);
           const day = String(date.getDate()).padStart(2, '0');
           const month = String(date.getMonth() + 1).padStart(2, '0');
           const year = date.getFullYear();
           return `${day}/${month}/${year}`;
        } catch(e) {
           return str;
        }
     }

     return str;
  }, []);

  // --- Search Normalization Helper ---
  const normalizeForSearch = useCallback((str: string): string => {
    if (!str) return '';
    // Basic normalization: lower case, trim
    let normalized = str.toLowerCase().trim();
    
    // Attempt to normalize Date formats to remove leading zeros for "fuzzy" matching
    // Example: "08/12/2025" -> "8/12/2025"
    
    // Pattern: dd/mm/yyyy or d/m/yyyy
    const dateSlashRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const slashMatch = normalized.match(dateSlashRegex);
    if (slashMatch) {
       return `${parseInt(slashMatch[1])}/${parseInt(slashMatch[2])}/${slashMatch[3]}`;
    }

    // Pattern: yyyy-mm-dd (ISO)
    const dateDashRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})/;
    const dashMatch = normalized.match(dateDashRegex);
    if (dashMatch) {
       // Convert to d/m/yyyy for consistency
       return `${parseInt(dashMatch[3])}/${parseInt(dashMatch[2])}/${dashMatch[1]}`;
    }

    return normalized;
  }, []);

  // --- Auto Calculate Widths ---
  const calculateAutoWidths = useCallback((sheetName: string, sheetData: any[][]) => {
     if (!sheetData || sheetData.length === 0) return {};
     
     const newWidths: { [key: number]: number } = {};
     const headerRow = sheetData[0];
     
     // Scan ALL rows if < 1000, else scan first 500 for performance
     const sampleRows = sheetData.length < 1000 ? sheetData.slice(1) : sheetData.slice(1, 501);

     headerRow.forEach((_, colIdx) => {
        let maxLen = 0;
        // Header length
        const headerText = String(sheetData[0][colIdx] || '');
        maxLen = Math.max(maxLen, headerText.length);

        // Row content length
        sampleRows.forEach(row => {
           const cellText = formatCellData(row[colIdx]);
           if (cellText) {
             const lines = cellText.split('\n');
             lines.forEach(line => {
                maxLen = Math.max(maxLen, line.length);
             });
           }
        });

        // Heuristic: Approx 9px per char + buffer
        // Increased buffer and min-width to be safer
        let estimatedWidth = (maxLen * 9) + 40;
        
        if (estimatedWidth < 100) estimatedWidth = 100;
        if (estimatedWidth > 600) estimatedWidth = 600;

        newWidths[colIdx] = Math.ceil(estimatedWidth);
     });

     return newWidths;
  }, [formatCellData]);

  // Effect to apply auto widths when active sheet changes or data loads
  // ONLY if widths are missing
  useEffect(() => {
     if (activeSheet && data[activeSheet]) {
        const currentConfig = viewConfig.sheets[activeSheet];
        
        // If no widths configured, calculate and save them
        if (!currentConfig || !currentConfig.colWidths || Object.keys(currentConfig.colWidths).length === 0) {
           const autoWidths = calculateAutoWidths(activeSheet, data[activeSheet]);
           
           setViewConfig(prev => ({
              ...prev,
              sheets: {
                 ...prev.sheets,
                 [activeSheet]: {
                    hiddenCols: currentConfig?.hiddenCols || [],
                    colWidths: autoWidths
                 }
              }
           }));
        }
     }
  }, [activeSheet, data, calculateAutoWidths]); 


  // --- View Configuration Handlers ---

  const toggleSheetVisibility = (sheetName: string) => {
    setViewConfig(prev => {
      const isHidden = prev.hiddenSheets.includes(sheetName);
      let newHiddenSheets;
      if (isHidden) {
        newHiddenSheets = prev.hiddenSheets.filter(s => s !== sheetName);
      } else {
        newHiddenSheets = [...prev.hiddenSheets, sheetName];
      }
      return { ...prev, hiddenSheets: newHiddenSheets };
    });
  };

  const toggleColumnVisibility = (colIndex: number) => {
    setViewConfig(prev => {
      const sheetConfig = prev.sheets[activeSheet] || { hiddenCols: [], colWidths: {} };
      const isHidden = sheetConfig.hiddenCols.includes(colIndex);
      
      let newHiddenCols;
      if (isHidden) {
        newHiddenCols = sheetConfig.hiddenCols.filter(c => c !== colIndex);
      } else {
        newHiddenCols = [...sheetConfig.hiddenCols, colIndex];
      }

      return {
        ...prev,
        sheets: {
          ...prev.sheets,
          [activeSheet]: { ...sheetConfig, hiddenCols: newHiddenCols }
        }
      };
    });
  };

  const updateColumnWidth = (colIndex: number, width: number) => {
    setViewConfig(prev => {
      const sheetConfig = prev.sheets[activeSheet] || { hiddenCols: [], colWidths: {} };
      return {
        ...prev,
        sheets: {
          ...prev.sheets,
          [activeSheet]: {
            ...sheetConfig,
            colWidths: { ...sheetConfig.colWidths, [colIndex]: width }
          }
        }
      };
    });
  };

  const resetViewConfig = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục giao diện mặc định (Hiện tất cả)?")) {
      setViewConfig({ hiddenSheets: [], sheets: {} });
    }
  };
  
  const handleAutoFit = () => {
     if (activeSheet && data[activeSheet]) {
        const autoWidths = calculateAutoWidths(activeSheet, data[activeSheet]);
        // Force update logic
        setViewConfig(prev => {
           const existingSheetConfig = prev.sheets[activeSheet] || { hiddenCols: [] };
           return {
              ...prev,
              sheets: {
                 ...prev.sheets,
                 [activeSheet]: {
                    ...existingSheetConfig,
                    colWidths: autoWidths
                 }
              }
           };
        });
     }
  };

  if (!isOpen) return null;

  // Data Preparation
  const currentData = activeSheet ? data[activeSheet] : [];
  const headerRow = currentData.length > 0 ? currentData[0] : [];
  const bodyRows = currentData.length > 1 ? currentData.slice(1) : [];

  // Config for current active sheet
  const currentSheetConfig = viewConfig.sheets[activeSheet] || { hiddenCols: [], colWidths: {} };

  // Filter Rows based on Search
  const filteredRows = bodyRows.filter(row => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const searchNormalized = normalizeForSearch(searchTerm);
    
    return row.some((cell, idx) => {
      // Allow searching in hidden columns? Better to match expectation: Search everywhere or search visible?
      // Let's search visible only to avoid confusion, unless in Edit mode.
      if (!isEditMode && currentSheetConfig.hiddenCols.includes(idx)) return false;
      
      const formattedCell = formatCellData(cell);
      
      // 1. Exact substring match
      if (formattedCell.toLowerCase().includes(searchLower)) return true;
      
      // 2. Normalized date match (e.g. 8/12/2025 matches 08/12/2025)
      const cellNormalized = normalizeForSearch(formattedCell);
      if (cellNormalized.includes(searchNormalized)) return true;
      
      return false;
    });
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-60 p-2 md:p-4 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className={`px-4 py-3 text-white flex justify-between items-center shrink-0 transition-colors ${isEditMode ? 'bg-orange-700' : 'bg-indigo-800'}`}>
          <div>
            <h2 className="text-lg md:text-xl font-bold flex items-center">
              {isEditMode ? (
                 <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              ) : (
                 <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              )}
              {isEditMode ? 'CHẾ ĐỘ CHỈNH SỬA GIAO DIỆN' : 'DANH SÁCH DỮ LIỆU (GOOGLE SHEET)'}
            </h2>
            <p className={`text-xs ${isEditMode ? 'text-orange-200' : 'text-indigo-200'}`}>
               {isEditMode ? 'Tích chọn để ẨN/HIỆN Sheet, bấm vào cột để ẨN cột.' : 'Xem trực tiếp dữ liệu từ các Sheet trên Google Drive'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
               onClick={() => setIsEditMode(!isEditMode)}
               className={`px-3 py-1.5 rounded-md text-sm font-bold shadow-sm transition-all flex items-center ${isEditMode ? 'bg-white text-orange-800' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
            >
               {isEditMode ? 'Xong (Lưu)' : '🛠️ Tùy chỉnh'}
            </button>
            <button 
              onClick={onClose} 
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
               <svg className="animate-spin h-10 w-10 mb-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <p>Đang tải dữ liệu từ Google Sheet...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
               <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               <h3 className="text-red-600 font-bold mb-2 text-lg whitespace-pre-line">{error}</h3>
               
               <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-w-lg mx-auto mb-6 text-left">
                  <h4 className="font-bold text-gray-800 mb-2">💡 Gợi ý khắc phục:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                     {error.includes("Chưa cấu hình") ? (
                        <li>Vào <b>Cài đặt &rarr; Bảo mật</b> và dán link Web App vào ô <b>Nguồn Dữ Liệu</b>.</li>
                     ) : (
                        <>
                           <li>Vào Google Script, kiểm tra file <code>Code.gs</code> đã có hàm <code>doGet</code> chưa.</li>
                           <li>Nhấn nút <b>Deploy (Triển khai)</b> &rarr; chọn <b>New deployment (Triển khai mới)</b>. <span className="text-red-500 font-bold">(Rất quan trọng!)</span></li>
                           <li>Mục "Who has access" (Ai có quyền truy cập) phải chọn là <b>Anyone (Bất kỳ ai)</b>.</li>
                           <li>Đảm bảo file Google Sheet của bạn có các sheet dữ liệu khác ngoài sheet 'Baocao'.</li>
                        </>
                     )}
                  </ul>
               </div>

               <div className="flex gap-3">
                 <button onClick={fetchData} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium transition-transform active:scale-95 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Thử lại
                 </button>
                 <button onClick={onOpenSettings} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 shadow-sm font-medium transition-transform active:scale-95 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.066 2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      ⚙️ Kiểm tra Cài đặt
                  </button>
               </div>
            </div>
          ) : (
             <>
                {/* Tabs & Search */}
                <div className={`border-b border-gray-200 p-2 md:p-3 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm z-10 ${isEditMode ? 'bg-orange-50' : 'bg-white'}`}>
                   
                   {/* Sheet Selection Area */}
                   <div className="flex flex-col gap-2 w-full md:w-auto flex-1">
                      {isEditMode ? (
                        /* EDIT MODE: GRID VIEW to easily Toggle Visibility */
                        <div>
                          <span className="text-xs font-bold text-orange-600 uppercase block mb-1">1. Quản lý Sheet (Màu xám = Ẩn, Màu cam = Hiện):</span>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {sheetNames.map(name => {
                                const isHidden = viewConfig.hiddenSheets.includes(name);
                                return (
                                  <button
                                    key={name}
                                    onClick={() => toggleSheetVisibility(name)}
                                    className={`px-3 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${
                                      isHidden 
                                        ? 'bg-gray-200 text-gray-500 border-gray-300' 
                                        : 'bg-orange-100 text-orange-800 border-orange-300 font-bold'
                                    }`}
                                  >
                                    {isHidden ? (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                    {name}
                                  </button>
                                );
                            })}
                            
                            <button 
                                onClick={handleAutoFit}
                                className="px-3 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 font-medium flex items-center"
                                title="Tính toán lại độ rộng cột dựa trên dữ liệu"
                             >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                Tự động căn chỉnh cột
                             </button>

                            <button 
                                onClick={resetViewConfig}
                                className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                             >
                                ↺ Khôi phục mặc định
                             </button>
                          </div>
                        </div>
                      ) : (
                        /* NORMAL MODE: DROPDOWN SELECT */
                        <div className="flex items-center gap-2">
                           <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
                              📂 Chọn Dữ liệu (Sheet):
                           </label>
                           <div className="relative flex-1 md:max-w-md">
                             <select
                                value={activeSheet}
                                onChange={(e) => setActiveSheet(e.target.value)}
                                className="w-full appearance-none pl-4 pr-10 py-2 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-blue-900 font-semibold cursor-pointer text-sm"
                             >
                                {sheetNames.map(name => {
                                   const isHidden = viewConfig.hiddenSheets.includes(name);
                                   if (isHidden) return null;
                                   return (
                                      <option key={name} value={name}>{name}</option>
                                   );
                                })}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                             </div>
                           </div>
                           
                           <button 
                              onClick={fetchData}
                              className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                              title="Tải lại dữ liệu"
                            >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        </div>
                      )}
                   </div>

                   {/* Search Box */}
                   {!isEditMode && (
                     <div className="relative w-full md:w-64">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input 
                           type="text"
                           className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                           placeholder="Tìm kiếm..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                   )}
                </div>
                
                {isEditMode && (
                   <div className="px-4 py-2 bg-orange-100 text-orange-800 text-xs text-center border-b border-orange-200">
                      2. Bấm vào tiêu đề cột để ẨN/HIỆN. Kéo thanh trượt để chỉnh ĐỘ RỘNG.
                   </div>
                )}

                {/* Table Data */}
                <div className="flex-1 overflow-auto p-2 md:p-4 bg-gray-100">
                   <div className={`bg-white rounded-lg border shadow inline-block min-w-full align-top ${isEditMode ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-200'}`}>
                      <table className="min-w-full divide-y divide-gray-200 text-sm table-fixed">
                         <thead className="bg-gray-50">
                            <tr>
                               {headerRow.map((cell, idx) => {
                                  const isHidden = currentSheetConfig.hiddenCols.includes(idx);
                                  // Normal Mode: Hide hidden columns
                                  if (!isEditMode && isHidden) return null;
                                  
                                  const width = currentSheetConfig.colWidths[idx] || 150;

                                  return (
                                    <th 
                                      key={idx} 
                                      className={`px-3 py-3 text-left font-bold uppercase tracking-wider border-b sticky top-0 shadow-sm relative group z-10 align-top
                                         ${isEditMode ? 'bg-orange-50 border-orange-200 cursor-default' : 'bg-gray-50 border-gray-200 text-gray-500'}
                                         ${isEditMode && isHidden ? 'opacity-50 bg-gray-100' : ''}
                                      `}
                                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                                    >
                                       <div className="flex flex-col gap-1 overflow-hidden">
                                          <div className="flex items-start justify-between gap-2">
                                             <span className={`truncate ${isEditMode && isHidden ? 'line-through' : ''}`} title={String(cell)}>
                                                {String(cell)}
                                             </span>
                                             
                                             {isEditMode && (
                                                <button
                                                   onClick={() => toggleColumnVisibility(idx)}
                                                   className={`p-1 rounded hover:bg-black/10 transition-colors ${isHidden ? 'text-gray-500' : 'text-blue-600'}`}
                                                   title={isHidden ? "Đang ẩn. Bấm để hiện." : "Đang hiện. Bấm để ẩn."}
                                                >
                                                   {isHidden ? (
                                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                   ) : (
                                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                   )}
                                                </button>
                                             )}
                                          </div>
                                          
                                          {isEditMode && !isHidden && (
                                             <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <input 
                                                   type="range" 
                                                   min="50" max="600" step="10"
                                                   value={width || 150}
                                                   onChange={(e) => updateColumnWidth(idx, Number(e.target.value))}
                                                   className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                   title="Kéo để chỉnh độ rộng"
                                                />
                                             </div>
                                          )}
                                       </div>
                                    </th>
                                  );
                               })}
                            </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRows.length > 0 ? (
                               filteredRows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-indigo-50 transition-colors">
                                     {row.map((cell, cIdx) => {
                                        const isHidden = currentSheetConfig.hiddenCols.includes(cIdx);
                                        if (!isEditMode && isHidden) return null;
                                        
                                        const width = currentSheetConfig.colWidths[cIdx] || 150;

                                        return (
                                          <td 
                                            key={cIdx} 
                                            className={`px-4 py-2 text-gray-700 border-r border-gray-100 last:border-r-0 whitespace-pre-wrap break-words align-top ${isEditMode && isHidden ? 'opacity-30 bg-gray-100' : ''}`}
                                            style={{ 
                                                width: `${width}px`,
                                                minWidth: `${width}px`
                                            }}
                                          >
                                             {formatCellData(cell)}
                                          </td>
                                        );
                                     })}
                                  </tr>
                               ))
                            ) : (
                               <tr>
                                  <td colSpan={headerRow.length || 1} className="px-4 py-8 text-center text-gray-500">
                                     {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Sheet này chưa có dữ liệu.'}
                                  </td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
                
                {/* Footer Info */}
                <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-500 text-right">
                   Hiển thị {filteredRows.length} dòng dữ liệu.
                </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
};
