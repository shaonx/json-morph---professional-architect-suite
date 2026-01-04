
import React, { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import { 
  Code2, 
  Search, 
  Layers, 
  Type as TypeIcon, 
  Trash2, 
  Download, 
  FileJson, 
  Repeat, 
  Star,
  Zap,
  LayoutGrid,
  Hash,
  X,
  History,
  Copy,
  Maximize2,
  Minimize2,
  Upload,
  Loader2,
  AlertCircle,
  Table as TableIcon,
  FileSpreadsheet,
  Share2,
  Image as ImageIcon,
  FileCode,
  FileText,
  Terminal,
  FileSignature,
  Activity,
  Box,
  Cpu,
  ArrowLeft,
  Check,
  GripVertical,
  Wand2,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JsonNode } from './components/JsonNode';
import { StatsCard } from './components/StatsCard';
import { JsonBuilder } from './components/JsonBuilder';
import { ShareModal } from './components/ShareModal';
import { 
  analyzeJson, 
  toYaml, 
  formatJson, 
  calculateSearchResult, 
  findTableCandidates, 
  downloadAsFile,
  renderJsonToImage,
  toXml,
  toToml,
  toTsv,
  toMarkdownTable
} from './utils/jsonUtils';
import { JsonStats, FavoriteKey, ViewMode, TableCandidate, ExportOption } from './types';
import { Language, translations } from './utils/i18n';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('json-morph-theme') as 'dark' | 'light') || 'dark';
  });

  const isDarkMode = theme === 'dark';

  const [language, setLanguage] = useState<Language>(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh-cn')) return 'zh';
    if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hk')) return 'zh_TW';
    if (browserLang.startsWith('ko')) return 'ko';
    if (browserLang.startsWith('ja')) return 'ja';
    return 'en';
  });
  
  const t = translations[language];

  const [rawInput, setRawInput] = useState<string>('{\n  "project": "JSON Morph",\n  "version": "2.2.0",\n  "users": [\n    { "id": 1, "name": "Alice", "role": "Admin", "active": true, "joined": 1267388893 },\n    { "id": 2, "name": "Bob", "role": "User", "active": false, "joined": 1267388893 },\n    { "id": 3, "name": "Charlie", "role": "Manager", "active": true, "joined": 1267388893 }\n  ],\n  "settings": {\n    "theme": "dark",\n    "notifications": true,\n    "api_key": "550e8400-e29b-41d4-a716-446655440000"\n  }\n}');
  const [parsedData, setParsedData] = useState<any>(null);
  const [stats, setStats] = useState<JsonStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformStep, setTransformStep] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [favorites, setFavorites] = useState<FavoriteKey[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTableIdx, setSelectedTableIdx] = useState(0);
  
  const [leftWidth, setLeftWidth] = useState(400);
  const [rightWidth, setRightWidth] = useState(240);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const [previewData, setPreviewData] = useState<{ 
    content: string, 
    title: string, 
    extension: string, 
    mimeType: string,
    id: string
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandAllTrigger, setExpandAllTrigger] = useState(0);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(0);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('json-morph-theme', newTheme);
  };

  const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
  const startResizingRight = useCallback(() => setIsResizingRight(true), []);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(250, Math.min(e.clientX - 56, window.innerWidth / 2));
        setLeftWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(180, Math.min(window.innerWidth - e.clientX, 400));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (!rawInput.trim()) {
      setParsedData(null);
      setStats(null);
      setError(null);
      return;
    }
    setIsProcessing(true);
    const timeoutId = setTimeout(() => {
      try {
        const parsed = JSON.parse(rawInput);
        setParsedData(parsed);
        setError(null);
        if (rawInput.length < 1000000) {
          setStats(analyzeJson(parsed));
        } else {
          setStats(null);
        }
      } catch (e: any) {
        setError(e.message);
        setParsedData(null);
        setStats(null);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [rawInput]);

  const searchResult = useMemo(() => {
    return calculateSearchResult(parsedData, deferredSearchQuery);
  }, [parsedData, deferredSearchQuery]);

  const tableCandidates = useMemo(() => {
    if (!parsedData) return [];
    return findTableCandidates(parsedData);
  }, [parsedData]);

  const handleFavorite = (path: string, value: any) => {
    const newFavorite: FavoriteKey = {
      id: Math.random().toString(36).substr(2, 9),
      path,
      value,
      timestamp: Date.now()
    };
    setFavorites(prev => {
      if (prev.find(f => f.path === path)) return prev;
      showToast(language === 'zh' ? '已钉在库中' : language === 'zh_TW' ? '已釘在庫中' : 'Node pinned to library');
      return [newFavorite, ...prev].slice(0, 20);
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawInput(e.target?.result as string);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const copyToClipboard = (text: string, silent = false) => {
    navigator.clipboard.writeText(text);
    if (!silent) {
      setCopied(true);
      showToast(t.copied);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportOptions: ExportOption[] = [
    { id: 'json', title: 'JSON', description: t.jsonDesc, icon: 'FileJson', extension: 'json', color: 'text-blue-500' },
    { id: 'yaml', title: 'YAML', description: t.yamlDesc, icon: 'FileCode', extension: 'yaml', color: 'text-orange-500' },
    { id: 'csv', title: 'CSV', description: t.csvDesc, icon: 'FileSpreadsheet', extension: 'csv', color: 'text-emerald-500' },
    { id: 'tsv', title: 'TSV', description: t.tsvDesc, icon: 'FileText', extension: 'tsv', color: 'text-cyan-500' },
    { id: 'xml', title: 'XML', description: t.xmlDesc, icon: 'FileCode', extension: 'xml', color: 'text-purple-500' },
    { id: 'image', title: 'Image (PNG)', description: t.imageDesc, icon: 'ImageIcon', extension: 'png', color: 'text-pink-500' },
    { id: 'md', title: 'Markdown', description: t.mdDesc, icon: 'FileText', extension: 'md', color: 'text-sky-500' },
    { id: 'toml', title: 'TOML', description: t.tomlDesc, icon: 'Terminal', extension: 'toml', color: 'text-amber-500' },
    { id: 'js', title: 'JS Object', description: t.jsDesc, icon: 'FileSignature', extension: 'js', color: 'text-yellow-500' },
  ];

  const generateCsvContent = (table: TableCandidate) => {
    return [
      table.headers.join(','),
      ...table.rows.map(r => table.headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  };

  const handleDirectExportCsv = () => {
    if (tableCandidates.length > 0) {
      const table = tableCandidates[selectedTableIdx];
      const content = generateCsvContent(table);
      downloadAsFile(content, `export_${table.path.replace(/\[|\]|\./g, '_')}.csv`, 'text/csv');
      showToast('CSV export started');
    }
  };

  const handleExport = async (option: ExportOption) => {
    if (!parsedData) return;
    
    setIsTransforming(true);
    const steps = ["Initial Mapping", "Schema Extraction", "Transformation Pipeline", "Binary Generation"];
    for (const step of steps) {
      setTransformStep(step);
      await new Promise(r => setTimeout(r, 400));
    }

    let content = '';
    let mimeType = 'text/plain';

    try {
      switch (option.id) {
        case 'json':
          content = formatJson(parsedData);
          mimeType = 'application/json';
          break;
        case 'yaml':
          content = toYaml(parsedData);
          mimeType = 'text/yaml';
          break;
        case 'xml':
          content = toXml(parsedData);
          mimeType = 'application/xml';
          break;
        case 'toml':
          content = toToml(parsedData);
          mimeType = 'text/toml';
          break;
        case 'csv':
        case 'tsv':
        case 'md':
          if (tableCandidates.length > 0) {
            const table = tableCandidates[selectedTableIdx];
            if (option.id === 'csv') {
              content = generateCsvContent(table);
              mimeType = 'text/csv';
            } else if (option.id === 'tsv') {
              content = toTsv(table);
              mimeType = 'text/tab-separated-values';
            } else {
              content = toMarkdownTable(table);
              mimeType = 'text/markdown';
            }
          } else {
            alert(language === 'zh' ? "未检测到表格数据" : "No tabular data detected");
            setIsTransforming(false);
            return;
          }
          break;
        case 'image':
          await renderJsonToImage(formatJson(parsedData));
          showToast('Image export generated');
          setIsTransforming(false);
          return;
        case 'js':
          content = `const data = ${JSON.stringify(parsedData, null, 2)};`;
          mimeType = 'text/javascript';
          break;
        default:
          alert("Coming soon!");
          setIsTransforming(false);
          return;
      }

      setPreviewData({
        content,
        title: option.title,
        extension: option.extension,
        mimeType,
        id: option.id
      });

    } finally {
      setIsTransforming(false);
      setTransformStep('');
    }
  };

  const totalTypesCount = useMemo(() => {
    if (!stats) return 0;
    return (Object.values(stats.typeDistribution) as number[]).reduce((a, b) => a + b, 0);
  }, [stats]);

  const appBg = isDarkMode ? 'bg-[#080808]' : 'bg-[#f1f5f9]';
  const panelBg = isDarkMode ? 'bg-[#0c0c0c]' : 'bg-white';
  const secondaryBg = isDarkMode ? 'bg-[#111]' : 'bg-slate-50';
  const borderColor = isDarkMode ? 'border-gray-900' : 'border-slate-200';
  const textPrimary = isDarkMode ? 'text-gray-300' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-gray-500' : 'text-slate-400';

  return (
    <div className={`flex h-screen ${appBg} ${textPrimary} overflow-hidden font-sans transition-colors duration-300`}>
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />

      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-blue-400/30"
          >
            <Check size={18} />
            <span className="text-xs font-bold tracking-widest uppercase">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTransforming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="text-center">
              <div className="relative mb-8 flex justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 border-2 border-blue-500/20 border-t-blue-500 rounded-full"
                />
                <motion.div 
                   animate={{ rotate: -360 }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-2 border-2 border-purple-500/20 border-b-purple-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="text-blue-400 animate-pulse" size={32} />
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <h3 className="text-xl font-bold tracking-[0.2em] text-white uppercase">{transformStep}...</h3>
                <div className="flex justify-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1 h-1 bg-blue-500 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <div className={`w-14 border-r ${borderColor} flex flex-col items-center py-6 gap-6 ${panelBg} z-20 transition-colors duration-300`}>
        <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg">
          <Code2 size={20} className="text-white" />
        </div>
        <div className="flex flex-col gap-4 mt-2">
          {(['tree', 'builder', 'table', 'analysis', 'export'] as const).map(mode => (
            <button 
              key={mode}
              onClick={() => { setViewMode(mode); setPreviewData(null); }}
              title={t[mode]}
              className={`p-2 rounded-lg transition-all ${viewMode === mode && !previewData ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-500/5'}`}
            >
              {mode === 'tree' && <LayoutGrid size={18} />}
              {mode === 'builder' && <Wand2 size={18} />}
              {mode === 'table' && <TableIcon size={18} />}
              {mode === 'analysis' && <Zap size={18} />}
              {mode === 'export' && <Share2 size={18} />}
            </button>
          ))}
        </div>
        
        <div className="mt-auto flex flex-col gap-4 pb-2">
           <button 
             onClick={toggleTheme}
             className={`p-2 rounded-lg transition-all text-gray-500 hover:bg-blue-500/5 hover:text-blue-500`}
           >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-14 border-b ${borderColor} flex items-center px-6 justify-between ${panelBg} shrink-0 transition-colors duration-300`}>
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-blue-500 shrink-0">MORPH_JSON_ARCH</h1>
            <AnimatePresence>
              {selectedPath && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`flex items-center text-[10px] font-mono gap-2 ${secondaryBg} px-3 py-1 rounded-full border ${borderColor} shadow-inner min-w-0`}
                >
                  <span className={`${textMuted} font-bold uppercase tracking-tighter shrink-0`}>{t.path}</span>
                  <span className="text-blue-500 font-medium truncate max-w-[400px]">{selectedPath}</span>
                  <button onClick={() => copyToClipboard(selectedPath)} className={`p-1 hover:text-blue-400 transition-colors shrink-0 ${textMuted}`} title="Copy Path"><Copy size={10} /></button>
                </motion.div>
              )}
            </AnimatePresence>
            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-500 text-[10px] animate-pulse shrink-0 font-bold">
                <Loader2 size={12} className="animate-spin" />
                {t.syncing}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={() => setIsShareOpen(true)}
              className={`p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors`}
              title={t.shareApp}
            >
              <Share2 size={18} />
            </button>
            <div className={`flex items-center gap-2 ${secondaryBg} px-2 py-1 rounded-lg border ${borderColor}`}>
              <Globe size={14} className={textMuted} />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className={`bg-transparent text-[10px] font-bold ${textPrimary} focus:outline-none appearance-none cursor-pointer border-none p-0`}
              >
                <option value="en">English</option>
                <option value="zh">简体中文</option>
                <option value="zh_TW">繁體中文</option>
                <option value="ko">한국어</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div className={`h-4 w-px ${borderColor}`} />
            <button onClick={() => { setRawInput(''); setSelectedPath(''); }} className={`p-2 hover:text-red-500 transition-colors ${textMuted}`} title={t.clearAll}><Trash2 size={16} /></button>
            <button onClick={() => parsedData && copyToClipboard(formatJson(parsedData))} className={`px-3 py-1 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-slate-100 hover:bg-slate-200'} rounded text-[10px] font-bold flex items-center gap-1 transition-colors`}>
              <FileJson size={12} /> {t.copyPretty}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Source Panel */}
          <div 
            style={{ width: `${leftWidth}px` }} 
            className={`border-r ${borderColor} flex flex-col ${panelBg} shrink-0 relative transition-colors duration-300`}
          >
            <div className={`px-4 py-2 border-b ${borderColor} flex justify-between items-center text-[9px] font-bold ${textMuted} tracking-widest uppercase`}>
              <span>{t.rawSource}</span>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 hover:text-blue-500"><Upload size={10} /> {t.loadFile}</button>
            </div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className={`flex-1 bg-transparent p-4 font-mono text-xs resize-none focus:outline-none ${isDarkMode ? 'text-blue-100/70' : 'text-slate-600'}`}
              placeholder="Paste JSON source here..."
            />
            {error && (
              <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-red-500 text-[10px] flex gap-2 items-start">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span className="break-all">{error}</span>
              </div>
            )}
            
            <div 
              onMouseDown={startResizingLeft}
              className={`absolute top-0 right-0 w-1 h-full cursor-col-resize transition-all z-30 hover:bg-blue-500/50 ${isResizingLeft ? 'bg-blue-500' : 'bg-transparent'}`}
            >
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-200'} p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity`}>
                <GripVertical size={10} />
              </div>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className={`flex-1 ${appBg} flex flex-col overflow-hidden relative transition-colors duration-300`}>
            <AnimatePresence mode="wait">
              {previewData ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 h-full flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <button 
                      onClick={() => setPreviewData(null)}
                      className={`flex items-center gap-2 ${textMuted} hover:text-blue-500 transition-colors group`}
                    >
                      <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                      <span className="text-sm font-bold uppercase tracking-widest">{t.backToFormats}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => copyToClipboard(previewData.content)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${copied ? 'bg-emerald-600 text-white' : (isDarkMode ? 'bg-[#111] hover:bg-gray-800' : 'bg-white shadow-sm border border-slate-200 hover:bg-slate-50')}`}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? t.copied : t.copy}
                      </button>
                      <button 
                        onClick={() => downloadAsFile(previewData.content, `export.${previewData.extension}`, previewData.mimeType)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                        <Download size={14} />
                        {t.download}
                      </button>
                    </div>
                  </div>

                  <div className={`flex-1 ${panelBg} border ${borderColor} rounded-2xl flex flex-col overflow-hidden shadow-2xl`}>
                    <div className={`px-6 py-3 border-b ${borderColor} flex items-center justify-between ${secondaryBg}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        <span className={`ml-4 text-[10px] font-mono ${textMuted} font-bold uppercase tracking-widest`}>
                          {previewData.title}_{t.outputPreview}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-500/50 font-bold">
                        {previewData.content.length} bytes
                      </span>
                    </div>
                    <pre className={`flex-1 p-6 font-mono text-xs ${isDarkMode ? 'text-blue-100/60' : 'text-slate-700'} overflow-auto custom-scrollbar leading-relaxed`}>
                      {previewData.content}
                    </pre>
                  </div>
                </motion.div>
              ) : viewMode === 'tree' ? (
                <div className="flex flex-col h-full p-4 gap-3">
                  {stats && (
                    <div className="grid grid-cols-4 gap-2 mb-1">
                      <StatsCard isDarkMode={isDarkMode} label={t.keys} value={stats.keyCount} icon={<Hash size={14} />} color="bg-blue-500" />
                      <StatsCard isDarkMode={isDarkMode} label={t.depth} value={stats.maxDepth} icon={<Layers size={14} />} color="bg-purple-500" />
                      <StatsCard isDarkMode={isDarkMode} label={t.size} value={`${(stats.totalChars / 1024).toFixed(1)} KB`} icon={<TypeIcon size={14} />} color="bg-emerald-500" />
                      <StatsCard isDarkMode={isDarkMode} label={t.peakVal} value={stats.longestValue.length} icon={<Maximize2 size={14} />} color="bg-orange-500" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} size={14} />
                      <input 
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${secondaryBg} border ${borderColor} rounded-lg py-2 pl-9 pr-24 text-xs focus:ring-1 focus:ring-blue-500/50 outline-none transition-all`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {searchQuery && <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{searchResult.count} {t.matches}</span>}
                        {searchQuery !== deferredSearchQuery && <Loader2 size={12} className="animate-spin text-blue-500" />}
                      </div>
                    </div>
                    <div className={`flex border ${borderColor} rounded-lg overflow-hidden ${secondaryBg}`}>
                      <button onClick={() => setExpandAllTrigger(t => t + 1)} className={`p-2 hover:bg-blue-500/5 ${textMuted} hover:text-blue-500 transition-colors`} title={t.expandAll}><Maximize2 size={14} /></button>
                      <button onClick={() => setCollapseAllTrigger(t => t + 1)} className={`p-2 hover:bg-red-500/5 ${textMuted} hover:text-red-500 border-l ${borderColor} transition-colors`} title={t.collapseAll}><Minimize2 size={14} /></button>
                    </div>
                  </div>
                  <div className={`flex-1 ${panelBg} border ${borderColor} rounded-xl overflow-auto custom-scrollbar p-2 transition-colors duration-300`}>
                    {parsedData ? (
                      <JsonNode 
                        isDarkMode={isDarkMode}
                        name="root" value={parsedData} depth={0} path="" 
                        onSelect={setSelectedPath} onFavorite={handleFavorite} onCopy={(text) => copyToClipboard(text)}
                        selectedPath={selectedPath} searchQuery={deferredSearchQuery}
                        searchResult={searchResult} expandAllTrigger={expandAllTrigger}
                        collapseAllTrigger={collapseAllTrigger}
                      />
                    ) : (
                      <div className={`h-full flex flex-col items-center justify-center opacity-20 ${textPrimary}`}><Code2 size={48} className="mb-4" /><span className="text-xs uppercase tracking-widest">Waiting for source...</span></div>
                    )}
                  </div>
                </div>
              ) : viewMode === 'builder' ? (
                <JsonBuilder isDarkMode={isDarkMode} language={language} data={parsedData || {}} onChange={(newData) => setRawInput(JSON.stringify(newData, null, 2))} />
              ) : viewMode === 'table' ? (
                <div className="flex flex-col h-full p-4 overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2"><TableIcon className="text-blue-500" size={16} /><h2 className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>{t.tabularEngine}</h2></div>
                      {tableCandidates.length > 0 && (
                        <button 
                          onClick={handleDirectExportCsv} 
                          className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                        >
                          <FileSpreadsheet size={12} /> EXPORT_CSV
                        </button>
                      )}
                    </div>
                    {tableCandidates.length > 0 && (
                      <div className="flex items-center gap-2"><span className={`text-[10px] ${textMuted} font-bold`}>{t.activeSet}:</span><select value={selectedTableIdx} onChange={(e) => setSelectedTableIdx(parseInt(e.target.value))} className={`${secondaryBg} border ${borderColor} rounded text-[10px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500`}>{tableCandidates.map((tc, idx) => (<option key={idx} value={idx}>{tc.path} ({tc.rows.length} rows)</option>))}</select></div>
                    )}
                  </div>
                  <div className={`flex-1 ${panelBg} border ${borderColor} rounded-xl overflow-auto custom-scrollbar relative transition-colors duration-300`}>
                    {tableCandidates.length > 0 ? (
                      <table className={`w-full text-left text-[11px] border-collapse ${textPrimary}`}>
                        <thead className={`sticky top-0 ${secondaryBg} z-10`}>
                          <tr><th className={`p-3 border-b ${borderColor} ${textMuted} font-bold uppercase tracking-tighter w-12 text-center`}>#</th>{tableCandidates[selectedTableIdx].headers.map(header => (<th key={header} className={`p-3 border-b ${borderColor} text-blue-500 font-bold uppercase tracking-tight`}>{header}</th>))}</tr>
                        </thead>
                        <tbody>
                          {tableCandidates[selectedTableIdx].rows.map((row, idx) => (
                            <tr key={idx} className={`hover:bg-blue-500/5 transition-colors group border-b ${isDarkMode ? 'border-gray-900/50' : 'border-slate-100'} last:border-0`}><td className={`p-3 ${textMuted} text-center font-mono`}>{idx + 1}</td>{tableCandidates[selectedTableIdx].headers.map(header => { const val = row[header]; return (<td key={header} className="p-3 truncate max-w-[200px] font-mono group-hover:text-blue-500 transition-colors">{typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}</td>); })}</tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20"><AlertCircle size={48} className="mb-4" /><span className="text-xs uppercase tracking-widest">{t.noTable}</span></div>
                    )}
                  </div>
                </div>
              ) : viewMode === 'analysis' ? (
                <div className="p-6 overflow-auto h-full space-y-6">
                  {stats ? (
                    <>
                      <div className="grid grid-cols-4 gap-3">
                        <StatsCard isDarkMode={isDarkMode} label={t.keys} value={stats.keyCount} icon={<Hash size={16} />} color="bg-blue-500" />
                        <StatsCard isDarkMode={isDarkMode} label={t.depth} value={stats.maxDepth} icon={<Layers size={16} />} color="bg-purple-500" />
                        <StatsCard isDarkMode={isDarkMode} label={t.size} value={`${(stats.totalChars / 1024).toFixed(1)} KB`} icon={<TypeIcon size={16} />} color="bg-emerald-500" />
                        <StatsCard isDarkMode={isDarkMode} label={t.peakVal} value={stats.longestValue.length} icon={<Maximize2 size={16} />} color="bg-orange-500" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6">
                         <div className={`${panelBg} border ${borderColor} rounded-xl p-4 flex flex-col transition-colors duration-300`}>
                           <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Repeat size={14} /> {t.aggregation}</h3>
                           <div className="space-y-2 flex-1 overflow-auto pr-2 custom-scrollbar">
                             {(Object.entries(stats.valueAggregation) as [string, string[]][]).filter(([_, p]) => p.length > 1).map(([value, paths], i) => (
                               <div key={i} className={`p-2 border ${borderColor} rounded hover:border-blue-500/30 transition-colors shadow-sm`}>
                                 <div className="flex justify-between items-center mb-1"><span className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} font-mono font-semibold truncate max-w-[70%]`}>{value}</span><span className={`text-[9px] ${secondaryBg} px-1.5 py-0.5 rounded font-bold`}>x{paths.length}</span></div>
                                 <div className="flex flex-wrap gap-1">{paths.slice(0, 5).map((p, pi) => (<span key={pi} className={`text-[8px] ${textMuted} font-mono`}>#{p}</span>))}{paths.length > 5 && <span className={`text-[8px] ${textMuted} italic`}>...</span>}</div>
                               </div>
                             ))}
                           </div>
                         </div>

                         <div className={`${panelBg} border ${borderColor} rounded-xl p-4 flex flex-col transition-colors duration-300`}>
                           <h3 className={`text-[10px] font-bold ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'} uppercase tracking-widest mb-4 flex items-center gap-2`}><Box size={14} /> {t.distribution}</h3>
                           <div className="space-y-1 flex-1 overflow-auto pr-2 custom-scrollbar">
                             {(Object.entries(stats.typeDistribution) as [string, number][]).sort((a,b) => b[1]-a[1]).map(([type, count]) => (
                               <div key={type} className={`flex items-center justify-between py-1.5 border-b ${borderColor} last:border-0 group`}>
                                 <div className="flex flex-col">
                                   <span className={`text-xs font-mono ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'} transition-colors group-hover:text-blue-500`}>{type}</span>
                                   <div className={`w-24 h-1 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-full mt-1 overflow-hidden`}>
                                      <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${totalTypesCount > 0 ? (count / totalTypesCount) * 100 : 0}%` }}
                                        className="h-full bg-emerald-500"
                                      />
                                   </div>
                                 </div>
                                 <span className={`text-[10px] font-bold ${textMuted}`}>{count} {t.items}</span>
                               </div>
                             ))}
                           </div>
                         </div>

                         <div className={`${panelBg} border ${borderColor} rounded-xl p-4 flex flex-col transition-colors duration-300`}>
                           <h3 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2"><LayoutGrid size={14} /> {t.frequency}</h3>
                           <div className="space-y-1 flex-1 overflow-auto pr-2 custom-scrollbar">
                              {(Object.entries(stats.keyFrequency) as [string, number][]).sort((a,b) => b[1]-a[1]).slice(0, 30).map(([k, v]) => (
                                <div key={k} className={`flex items-center justify-between py-1 border-b ${borderColor} last:border-0 group`}><span className={`text-xs font-mono ${textMuted} group-hover:text-blue-500 transition-colors`}>{k}</span><span className={`text-[10px] font-bold ${textMuted}`}>{v} {t.hits}</span></div>
                              ))}
                           </div>
                         </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20"><Zap size={48} className="mb-4" /><span className="text-xs uppercase tracking-widest">{t.runAnalysis}</span></div>
                  )}
                </div>
              ) : (
                <div className="p-8 h-full overflow-auto relative">
                  <div className="mb-8">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2 flex items-center gap-3`}>
                      <FileOutput className="text-blue-500" />
                      {t.exportTitle}
                    </h2>
                    <p className={`${textMuted} text-sm max-w-2xl`}>
                      {t.exportDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {exportOptions.map((option) => (
                      <motion.div
                        key={option.id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`p-6 ${panelBg} border ${borderColor} rounded-2xl cursor-pointer group transition-all relative overflow-hidden shadow-sm hover:shadow-xl`}
                        onClick={() => handleExport(option)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'} ${option.color}`}>
                            {option.id === 'json' && <FileJson size={24} />}
                            {option.id === 'yaml' && <FileCode size={24} />}
                            {option.id === 'csv' && <FileSpreadsheet size={24} />}
                            {option.id === 'image' && <ImageIcon size={24} />}
                            {option.id === 'md' && <FileText size={24} />}
                            {option.id === 'toml' && <Terminal size={24} />}
                            {option.id === 'js' && <FileSignature size={24} />}
                            {option.id === 'xml' && <Box size={24} />}
                            {option.id === 'tsv' && <Layers size={24} />}
                          </div>
                          <Share2 size={14} className={`${textMuted} group-hover:text-blue-500 transition-colors`} />
                        </div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-1 group-hover:text-blue-500 transition-colors`}>{option.title}</h3>
                        <p className={`${textMuted} text-xs leading-relaxed`}>{option.description}</p>
                        
                        <div className="absolute bottom-0 left-0 h-1 bg-blue-500/0 group-hover:bg-blue-500/50 w-full transition-all duration-300" />
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className={`${isDarkMode ? 'bg-[#111]' : 'bg-white shadow-lg'} p-6 rounded-2xl border ${borderColor} flex flex-col md:flex-row items-center gap-6`}>
                    <div className="bg-blue-500/10 p-4 rounded-full">
                      <Cpu className="text-blue-500" size={32} />
                    </div>
                    <div>
                      <h4 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-bold mb-1 uppercase tracking-widest text-xs`}>{t.engineV3}</h4>
                      <p className={`${textMuted} text-xs leading-relaxed max-w-lg`}>
                        {t.engineDesc}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-2">
                       <Box className={textMuted} size={24} />
                       <Layers className={textMuted} size={24} />
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel: Pinned Nodes */}
          <div 
            style={{ width: `${rightWidth}px` }} 
            className={`border-l ${borderColor} ${panelBg} flex flex-col shrink-0 relative transition-colors duration-300`}
          >
             <div 
               onMouseDown={startResizingRight}
               className={`absolute top-0 left-0 w-1 h-full cursor-col-resize transition-all z-30 hover:bg-blue-500/50 ${isResizingRight ? 'bg-blue-500' : 'bg-transparent'}`}
             >
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-200'} p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity`}>
                 <GripVertical size={10} />
               </div>
             </div>

             <div className={`p-4 border-b ${borderColor} flex items-center gap-2`}>
               <Star size={14} className="text-yellow-500" />
               <span className={`text-[10px] font-bold uppercase ${textMuted} tracking-wider`}>{t.pinnedNodes}</span>
             </div>
             <div className="flex-1 overflow-auto p-3 space-y-2 custom-scrollbar">
               {favorites.map(fav => (
                 <div key={fav.id} onClick={() => { setViewMode('tree'); setSelectedPath(fav.path); setPreviewData(null); }} className={`p-2.5 ${secondaryBg} border rounded-lg cursor-pointer hover:border-blue-500/50 transition-all group relative ${selectedPath === fav.path ? 'border-blue-500 shadow-blue-500/10 shadow-lg' : borderColor}`}>
                   <div className="flex justify-between items-start mb-1 gap-2">
                     <div className={`font-bold ${isDarkMode ? 'text-blue-100' : 'text-slate-900'} truncate pr-6 text-[11px] leading-tight`}>
                        {typeof fav.value === 'object' && fav.value !== null ? (Array.isArray(fav.value) ? `Array[${fav.value.length}]` : `Object{${Object.keys(fav.value).length}}`) : String(fav.value)}
                     </div>
                     <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={(e) => { e.stopPropagation(); copyToClipboard(JSON.stringify(fav.value)); }} 
                         className={`p-1 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-200'} rounded text-gray-400 hover:text-blue-500`} 
                         title="Copy Value"
                       >
                         <Copy size={11} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id); }} 
                         className={`p-1 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-red-500/10'} rounded text-gray-500 hover:text-red-500`} 
                         title="Unpin"
                       >
                         <X size={11} />
                       </button>
                     </div>
                   </div>
                   <div className={`${textMuted} truncate font-mono italic text-[9px] hover:text-blue-500 transition-colors`} title={fav.path}>
                     {fav.path}
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); copyToClipboard(fav.path); }} 
                     className={`absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 p-1 ${textMuted} hover:text-blue-500`}
                     title="Copy Path"
                   >
                     <Hash size={9} />
                   </button>
                 </div>
               ))}
               {favorites.length === 0 && <div className={`h-full flex flex-col items-center justify-center opacity-10 py-12 text-center text-[10px] uppercase font-bold tracking-widest ${textPrimary}`}>{t.noFavorites}</div>}
             </div>
          </div>
        </div>
      </div>
      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        language={language} 
      />
    </div>
  );
};

export default App;
