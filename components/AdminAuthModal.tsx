import React, { useState, useEffect, useRef } from 'react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPassword?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  currentPassword 
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check against the current configured password (passed from App state)
    // Fallback to "123@123@123@" if prop is missing (safe default logic)
    const validPassword = currentPassword || '123@123@123@';

    if (password === validPassword) {
      onSuccess();
      onClose();
    } else {
      setError('Mật khẩu không đúng. Vui lòng thử lại.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Yêu cầu quyền Admin
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Tính năng này chỉ dành cho Quản trị viên hệ thống. Vui lòng nhập mật khẩu để tiếp tục.
          </p>
          
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <input
              ref={inputRef}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-800 hover:bg-blue-900 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};