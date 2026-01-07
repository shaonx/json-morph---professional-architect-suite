
import React, { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, Type, Hash, ToggleLeft, Box, List, LayoutGrid, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, translations } from '../utils/i18n';

type BuilderType = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface BuilderNode {
  id: string;
  key: string;
  type: BuilderType;
  value: any;
  children: BuilderNode[];
}

interface JsonBuilderProps {
  data: any;
  onChange: (newData: any) => void;
  language: Language;
  isDarkMode?: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const convertToBuilderNode = (val: any, key: string = 'root'): BuilderNode => {
  const id = generateId();
  if (val === null || typeof val !== 'object') {
    return {
      id,
      key,
      type: typeof val as BuilderType,
      value: val,
      children: []
    };
  }
  if (Array.isArray(val)) {
    return {
      id,
      key,
      type: 'array',
      value: null,
      children: val.map((item, i) => convertToBuilderNode(item, i.toString()))
    };
  }
  return {
    id,
    key,
    type: 'object',
    value: null,
    children: Object.entries(val).map(([k, v]) => convertToBuilderNode(v, k))
  };
};

const convertToRawJson = (node: BuilderNode): any => {
  if (node.type === 'object') {
    const obj: any = {};
    node.children.forEach(child => {
      obj[child.key] = convertToRawJson(child);
    });
    return obj;
  }
  if (node.type === 'array') {
    return node.children.map(child => convertToRawJson(child));
  }
  return node.value;
};

export const JsonBuilder: React.FC<JsonBuilderProps> = ({ data, onChange, language, isDarkMode = true }) => {
  const [root, setRoot] = useState<BuilderNode>(() => convertToBuilderNode(data));
  const t = translations[language];

  const updateNode = (node: BuilderNode, id: string, updater: (n: BuilderNode) => Partial<BuilderNode>): BuilderNode => {
    if (node.id === id) {
      const updated = { ...node, ...updater(node) };
      if (updated.type === 'object' || updated.type === 'array') updated.value = null;
      if (node.type !== updated.type && (updated.type === 'string' || updated.type === 'number' || updated.type === 'boolean')) {
         updated.children = [];
         if (updated.type === 'string') updated.value = "";
         if (updated.type === 'number') updated.value = 0;
         if (updated.type === 'boolean') updated.value = false;
      }
      return updated;
    }
    return {
      ...node,
      children: node.children.map(child => updateNode(child, id, updater))
    };
  };

  const addNode = (node: BuilderNode, parentId: string) => {
    if (node.id === parentId) {
      const newKey = node.type === 'array' ? node.children.length.toString() : `key_${node.children.length}`;
      const newNode: BuilderNode = {
        id: generateId(),
        key: newKey,
        type: 'string',
        value: 'new value',
        children: []
      };
      return { ...node, children: [...node.children, newNode] };
    }
    return {
      ...node,
      children: node.children.map(child => addNode(child, parentId))
    };
  };

  const removeNode = (node: BuilderNode, id: string): BuilderNode => {
    return {
      ...node,
      children: node.children
        .filter(child => child.id !== id)
        .map(child => removeNode(child, id))
    };
  };

  const handleCommit = (newRoot: BuilderNode) => {
    setRoot(newRoot);
    onChange(convertToRawJson(newRoot));
  };

  const inputBg = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-slate-50';
  const nodeBg = isDarkMode ? 'bg-[#111] hover:bg-[#151515]' : 'bg-white hover:bg-slate-50 shadow-sm';
  const borderColor = isDarkMode ? 'border-gray-800' : 'border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-800';
  const textMuted = isDarkMode ? 'text-gray-500' : 'text-slate-400';

  const renderBuilderNode = (node: BuilderNode, depth: number = 0) => {
    const isContainer = node.type === 'object' || node.type === 'array';
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-2"
      >
        <div className={`flex items-center gap-2 group ${nodeBg} p-2 rounded-lg border ${borderColor} transition-colors`}>
          <div className="flex items-center gap-2 min-w-[120px]">
            {node.key !== 'root' && (
              <input 
                value={node.key}
                onChange={(e) => handleCommit(updateNode(root, node.id, () => ({ key: e.target.value })))}
                className={`bg-transparent border-none focus:ring-0 text-blue-500 font-mono text-xs w-full outline-none font-bold`}
              />
            )}
            {node.key === 'root' && <span className={`${textMuted} font-mono text-xs uppercase font-bold tracking-widest`}>Root Object</span>}
          </div>

          <div className={`h-4 w-px ${borderColor} mx-1`} />

          <select 
            value={node.type}
            onChange={(e) => handleCommit(updateNode(root, node.id, () => ({ type: e.target.value as BuilderType })))}
            className={`${inputBg} border ${borderColor} rounded px-1 py-0.5 text-[10px] font-bold ${textMuted} focus:outline-none focus:border-blue-500/50 cursor-pointer`}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>

          {!isContainer && (
            <div className="flex-1 ml-2">
              {node.type === 'string' && (
                <input 
                  value={node.value}
                  onChange={(e) => handleCommit(updateNode(root, node.id, () => ({ value: e.target.value })))}
                  className={`w-full bg-transparent border-b ${borderColor} focus:border-emerald-500/50 outline-none ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} font-mono text-xs py-0.5`}
                />
              )}
              {node.type === 'number' && (
                <input 
                  type="number"
                  value={node.value}
                  onChange={(e) => handleCommit(updateNode(root, node.id, () => ({ value: parseFloat(e.target.value) || 0 })))}
                  className={`w-full bg-transparent border-b ${borderColor} focus:border-orange-500/50 outline-none ${isDarkMode ? 'text-orange-400' : 'text-orange-600'} font-mono text-xs py-0.5`}
                />
              )}
              {node.type === 'boolean' && (
                <button 
                  onClick={() => handleCommit(updateNode(root, node.id, () => ({ value: !node.value })))}
                  className={`px-3 py-0.5 rounded text-[10px] font-bold transition-all ${node.value ? 'bg-purple-600/20 text-purple-500 border border-purple-500/30' : (isDarkMode ? 'bg-gray-800 text-gray-500 border border-gray-700' : 'bg-slate-100 text-slate-400 border border-slate-200')}`}
                >
                  {node.value ? 'TRUE' : 'FALSE'}
                </button>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isContainer && (
              <button 
                onClick={() => handleCommit(addNode(root, node.id))}
                className="p-1 hover:bg-blue-500/10 rounded text-blue-500 transition-colors"
                title="Add Field"
              >
                <Plus size={14} />
              </button>
            )}
            {node.key !== 'root' && (
              <button 
                onClick={() => handleCommit(removeNode(root, node.id))}
                className="p-1 hover:bg-red-500/10 rounded text-red-500 transition-colors"
                title="Delete Field"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {isContainer && node.children.length > 0 && (
          <div className={`ml-6 mt-2 border-l ${borderColor} pl-4 relative`}>
            {node.children.map(child => (
              <React.Fragment key={child.id}>
                {renderBuilderNode(child, depth + 1)}
              </React.Fragment>
            ))}
          </div>
        )}
        
        {isContainer && node.children.length === 0 && (
          <div className="ml-8 py-2">
            <button 
              onClick={() => handleCommit(addNode(root, node.id))}
              className={`text-[10px] font-bold ${textMuted} hover:text-blue-500 flex items-center gap-1 transition-colors uppercase tracking-widest`}
            >
              <Plus size={10} /> {t.addFirst} {node.type === 'array' ? t.item : t.field}
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#080808]' : 'bg-[#f1f5f9]'} p-6 transition-colors duration-300`}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <LayoutGrid size={20} />
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.builderTitle}</h2>
          </div>
          <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-relaxed max-w-4xl`}>
            {t.builderDesc}
          </p>
        </div>
        <div className={`hidden lg:flex items-center gap-4 text-[10px] font-bold ${textMuted}`}>
          <div className="flex items-center gap-1"><Type size={12} className="text-emerald-500"/> STRING</div>
          <div className="flex items-center gap-1"><Hash size={12} className="text-orange-500"/> NUMBER</div>
          <div className="flex items-center gap-1"><ToggleLeft size={12} className="text-purple-500"/> BOOLEAN</div>
          <div className="flex items-center gap-1"><Box size={12} className="text-blue-500"/> OBJECT</div>
          <div className="flex items-center gap-1"><List size={12} className="text-cyan-500"/> ARRAY</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-4">
        {renderBuilderNode(root)}
      </div>

      <div className={`mt-6 p-4 ${isDarkMode ? 'bg-blue-600/5' : 'bg-blue-50'} border ${isDarkMode ? 'border-blue-500/10' : 'border-blue-100'} rounded-xl flex items-center gap-4 shadow-sm`}>
        <div className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'} flex items-center justify-center text-blue-500`}>
          <Cpu size={20} />
        </div>
        <div>
          <h4 className={`text-xs font-bold ${isDarkMode ? 'text-blue-100' : 'text-blue-700'} uppercase tracking-widest`}>{t.realtimeSync}</h4>
          <p className={`text-[10px] ${isDarkMode ? 'text-blue-100/40' : 'text-blue-600/70'} leading-relaxed max-w-md mt-0.5`}>
            {t.realtimeSyncDesc}
          </p>
        </div>
      </div>
    </div>
  );
};
