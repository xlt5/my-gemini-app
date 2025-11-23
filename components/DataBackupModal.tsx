import React, { useRef } from 'react';
import { Transaction } from '../types';
import { X, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImport: (data: Transaction[]) => void;
  onClear: () => void;
}

export const DataBackupModal: React.FC<Props> = ({ isOpen, onClose, transactions, onImport, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `autoledger_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
            // Basic validation
            if (window.confirm(`发现 ${json.length} 条数据。确定要覆盖当前数据吗？`)) {
                onImport(json);
                onClose();
            }
        } else {
            alert("文件格式不正确");
        }
      } catch (err) {
        alert("无法解析文件");
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
      if (window.confirm("确定要清空所有数据吗？此操作无法撤销！建议先导出备份。")) {
          onClear();
          onClose();
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">数据管理</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
            <button onClick={handleExport} className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center gap-3 font-bold transition-colors">
                <Download size={20} />
                导出数据备份
            </button>
            
            <div className="relative">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    accept=".json" 
                    className="hidden" 
                />
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-3 font-bold transition-colors">
                    <Upload size={20} />
                    导入数据恢复
                </button>
            </div>

            <hr className="border-gray-100 my-2" />

            <button onClick={handleClear} className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center gap-3 font-bold transition-colors">
                <Trash2 size={20} />
                清空所有数据
            </button>
            
            <div className="bg-orange-50 p-3 rounded-lg flex gap-3 items-start">
                <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                <p className="text-xs text-orange-700 leading-relaxed">
                    您的数据仅存储在手机本地浏览器中。如果清理浏览器缓存，数据可能会丢失。建议定期导出备份。
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};