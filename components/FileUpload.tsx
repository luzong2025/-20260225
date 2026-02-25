import React, { useState } from 'react';
import { Upload, CheckCircle, Trash2, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description: string;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accentColor: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, description, onFileSelect, selectedFile, accentColor }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    // 重置 input，防止同一个文件无法再次选择
    const input = document.getElementById(`file-input-${label}`) as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <div className="flex flex-col gap-3 w-full group">
      <div className="flex justify-between items-center px-1">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          {label}
        </label>
        {selectedFile && (
          <button 
            onClick={handleRemove}
            className="text-[10px] font-black text-red-500 hover:text-red-700 flex items-center gap-1 transition-all"
          >
            <Trash2 size={12} /> 移除文件
          </button>
        )}
      </div>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative h-44 border-2 border-dashed rounded-[2rem] transition-all duration-300 flex flex-col items-center justify-center p-6 cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-200 hover:border-slate-300 bg-white'}
          ${selectedFile ? 'border-green-500 bg-green-50/50 shadow-inner' : ''}
        `}
      >
        <input
          id={`file-input-${label}`}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {selectedFile ? (
          <div className="flex flex-col items-center text-center relative z-20 pointer-events-none">
            <div className="bg-green-500 text-white p-3 rounded-2xl mb-3 shadow-lg shadow-green-100">
              <FileSpreadsheet size={24} />
            </div>
            <p className="text-sm font-black text-slate-800 truncate max-w-[200px]">
              {selectedFile.name}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-green-600 bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle size={10} />
              <span className="text-[10px] font-black uppercase tracking-tighter">已选中</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center pointer-events-none">
            <div className={`p-4 rounded-2xl mb-3 text-white shadow-lg ${accentColor} transition-transform group-hover:scale-110`}>
              <Upload size={24} />
            </div>
            <p className="text-sm font-black text-slate-700">点击或拖拽上传</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
