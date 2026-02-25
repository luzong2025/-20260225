import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  AlertCircle, 
  Loader2, 
  Settings,
  ShieldCheck,
  CheckCircle2,
  Zap,
  XCircle,
  MessageSquare,
  Play,
  Lock,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import { parseExcelFile, compareData, generateResultExcel } from './services/excelService';
import { ProcessingState, ComparisonResult, AppConfig } from './types';

// 修改这个版本号和 STORAGE_KEY 是判断更新最简单的方法
const APP_VERSION = "v1.0.5-SYNC-LOCK";
const STORAGE_KEY_CONFIG = 'excel_audit_config_v1.0.5'; // 修改 Key 会强制重置旧配置

const PRESETS = [
  { id: 'sp_low', name: '实拍（50万内）', sheet: '实拍', col: 'L' },
  { id: 'sp_high', name: '实拍（50万上）', sheet: '实拍', col: 'O' },
  { id: 'ad2d', name: '2d 动画（不分档）', sheet: '2d 动画', col: 'L' },
  { id: 'ad3d_low', name: '3d 动画（50 万内）', sheet: '3d 动画', col: 'L' },
  { id: 'ad3d_high', name: '3d 动画（50 万上）', sheet: '3d 动画', col: 'O' },
  { id: 'bz_low', name: '后期包装（10 万内）', sheet: '后期包装', col: 'L' },
  { id: 'bz_high', name: '后期包装（10 万上）', sheet: '后期包装', col: 'O' },
  { id: 'nl', name: '内录（不分档）', sheet: '内录', col: 'L' },
];

const DEFAULT_CONFIG: AppConfig = {
  targetSheetKeyword: PRESETS[0].sheet,
  supplierColumn: 'G',
  supplierQuantityColumn: 'J',
  supplierTotalColumn: 'L',
  capColumn: PRESETS[0].col,
  dataStartRow: 3 
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].id);

  const [showSettings, setShowSettings] = useState(false);
  const [supplierFile, setSupplierFile] = useState<File | null>(null);
  const [priceCapFile, setPriceCapFile] = useState<File | null>(null);
  const [supplierData, setSupplierData] = useState<any[][] | null>(null);
  const [capData, setCapData] = useState<any[][] | null>(null);
  const [supplierWB, setSupplierWB] = useState<any>(null);
  
  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle', message: '' });
  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // 启动即打印，用于判断代码是否更新
  useEffect(() => {
    console.log("%c 🚀 视频对比程序引擎已更新至 " + APP_VERSION, "color: #fff; background: #ef4444; padding: 8px 16px; border-radius: 8px; font-weight: bold;");
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  const handleResetConfig = () => {
    if (window.confirm("确定要强制刷新并重置所有配置吗？")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    setConfig(prev => ({ ...prev, targetSheetKeyword: preset.sheet, capColumn: preset.col }));
    setResults(null);
    setResultBlob(null);
  };

  useEffect(() => {
    if (supplierFile) {
      parseExcelFile(supplierFile, config, true).then(res => {
        setSupplierData(res.fullData);
        setSupplierWB(res.workbook);
      }).catch(err => setProcessing({status: 'error', message: `解析失败: ${err.message}`}));
    }
  }, [supplierFile, config]);

  useEffect(() => {
    if (priceCapFile) {
      parseExcelFile(priceCapFile, config, false).then(res => {
        setCapData(res.fullData);
      }).catch(err => setProcessing({status: 'error', message: `解析失败: ${err.message}`}));
    }
  }, [priceCapFile, config.targetSheetKeyword]);

  const handleProcess = async () => {
    if (!supplierData || !capData) return;
    setProcessing({ status: 'processing', message: '🔍 正在比对...' });
    
    setTimeout(() => {
      try {
        const comparisonResults = compareData(supplierData, capData, config);
        setResults(comparisonResults);
        if (supplierWB) {
          const blob = generateResultExcel(supplierWB, comparisonResults, config);
          setResultBlob(blob);
        }
        setProcessing({ status: 'completed', message: '对比完成' });
      } catch (error: any) {
        setProcessing({ status: 'error', message: error.message });
      }
    }, 400);
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `比对报告_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-8 px-4 font-sans text-slate-900">
      {/* 顶部导航 - 视觉标志点 */}
      <div className="max-w-6xl w-full flex items-center justify-between mb-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-5">
          {/* 这里改为红色背景，如果不是红色，说明代码没更新 */}
          <div className="p-4 bg-red-600 rounded-[1.5rem] text-white shadow-xl shadow-red-100">
            <BarChart3 size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-800">视频价格对比程序</h1>
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">NEW</span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Local Secure Audit System</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all text-xs font-black border border-slate-200"
          >
            <Settings size={16} /> 参数配置
          </button>
        </div>
      </div>

      {/* 品类卡片 */}
      <div className="max-w-6xl w-full mb-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-2 mb-6 px-1">
            <Sparkles size={14} className="text-amber-500" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">请选择当前上限标准</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p)}
                className={`group flex flex-col items-center justify-center py-6 px-4 rounded-[2rem] border-2 transition-all duration-300 ${
                  activePreset === p.id 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.03]' 
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                <span className={`text-base font-black tracking-tight ${activePreset === p.id ? 'text-white' : 'text-slate-800'}`}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800">坐标锁定配置</h3>
              <button onClick={handleResetConfig} className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors" title="全量重置">
                <RefreshCcw size={18} />
              </button>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase px-1">左单价列(G)</label>
                  <input type="text" value={config.supplierColumn} onChange={(e) => setConfig({...config, supplierColumn: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-center" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase px-1">左数量列(J)</label>
                  <input type="text" value={config.supplierQuantityColumn} onChange={(e) => setConfig({...config, supplierQuantityColumn: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-center" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase px-1">左总额列(L)</label>
                  <input type="text" value={config.supplierTotalColumn} onChange={(e) => setConfig({...config, supplierTotalColumn: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-center" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase px-1">右基准列</label>
                  <input type="text" value={config.capColumn} onChange={(e) => setConfig({...config, capColumn: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-center" />
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:shadow-xl transition-all">保存配置</button>
          </div>
        </div>
      )}

      {/* 上传区 */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <FileUpload
          label="1. 报价单 (左表)"
          description="将根据 J 列读取报送数量"
          onFileSelect={setSupplierFile}
          selectedFile={supplierFile}
          accentColor="bg-slate-900"
        />
        <FileUpload
          label="2. 基准上限表 (右表)"
          description={`当前匹配关键字: ${config.targetSheetKeyword}`}
          onFileSelect={setPriceCapFile}
          selectedFile={priceCapFile}
          accentColor="bg-red-600"
        />
      </div>

      <button
        onClick={handleProcess}
        disabled={!supplierData || !capData || processing.status === 'processing'}
        className="px-20 py-5 rounded-full font-black text-xl bg-red-600 text-white hover:bg-red-700 shadow-2xl disabled:bg-slate-200 flex items-center gap-4 transition-all active:scale-95"
      >
        {processing.status === 'processing' ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} className="fill-current" />}
        立即开始比对
      </button>

      {/* 结果区 */}
      {processing.status === 'completed' && results && (
        <div className="max-w-6xl w-full mt-12">
          <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                {results.length > 0 ? <AlertCircle className="text-red-500" size={32} /> : <CheckCircle2 className="text-green-500" size={32} />}
                <h2 className="text-2xl font-black">{results.length > 0 ? `检测到 ${results.length} 项超标项目` : '对比完成，未发现异常项目'}</h2>
              </div>
              {results.length > 0 && (
                <button onClick={handleDownload} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs">
                  <Download size={20} /> 导出修正建议表
                </button>
              )}
            </div>

            {results.length > 0 && (
              <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
                    <tr>
                      <th className="px-8 py-5">项目描述</th>
                      <th className="px-8 py-5">单价 (G)</th>
                      <th className="px-8 py-5">标准上限</th>
                      <th className="px-8 py-5 text-center">报送数量 (J)</th>
                      <th className="px-8 py-5 text-right">总额 (L)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((res) => (
                      <tr key={res.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-black text-slate-800">{res.row['项目名称']}</div>
                          <span className="text-[10px] text-slate-400">Excel 行号: {res.row['行号']}</span>
                        </td>
                        <td className="px-8 py-6 font-mono font-black text-red-600">¥{res.originalPrice.toLocaleString()}</td>
                        <td className="px-8 py-6 font-mono text-slate-400 italic">¥{(res.capPrice || 0).toLocaleString()}</td>
                        <td className="px-8 py-6 font-mono text-center font-black bg-red-50/50 rounded-lg">{res.quantity}</td>
                        <td className="px-8 py-6 text-right font-mono font-black">¥{res.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 页脚 */}
      <div className="mt-20 flex flex-col items-center">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
          <Lock size={12} /> 本地硬件加密环境 • {APP_VERSION}
        </div>
      </div>
    </div>
  );
};

export default App;
