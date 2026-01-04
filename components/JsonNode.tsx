
import React, { useState, useEffect, memo } from 'react';
import { ChevronRight, ChevronDown, Copy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectType } from '../utils/jsonUtils';

interface SearchResult {
  count: number;
  matchingPaths: Set<string>;
  ancestorPaths: Set<string>;
}

interface JsonNodeProps {
  name: string;
  value: any;
  depth: number;
  path: string;
  onSelect: (path: string) => void;
  onFavorite: (path: string, value: any) => void;
  onCopy: (text: string) => void;
  selectedPath: string;
  searchQuery?: string;
  searchResult?: SearchResult;
  expandAllTrigger?: number;
  collapseAllTrigger?: number;
  isDarkMode?: boolean;
}

export const JsonNode: React.FC<JsonNodeProps> = memo(({
  name,
  value,
  depth,
  path,
  onSelect,
  onFavorite,
  onCopy,
  selectedPath,
  searchQuery = '',
  searchResult,
  expandAllTrigger = 0,
  collapseAllTrigger = 0,
  isDarkMode = true
}) => {
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isSelected = selectedPath === path;
  const fieldType = detectType(value);

  const [isOpen, setIsOpen] = useState(depth < 2);

  const isSearchActive = searchQuery.trim().length > 0;
  const isMatch = searchResult?.matchingPaths.has(path);
  const isAncestorOfMatch = searchResult?.ancestorPaths.has(path);
  
  useEffect(() => {
    if (expandAllTrigger > 0 && isObject) setIsOpen(true);
  }, [expandAllTrigger, isObject]);

  useEffect(() => {
    if (collapseAllTrigger > 0 && isObject && depth > 0) setIsOpen(false);
  }, [collapseAllTrigger, isObject, depth]);

  useEffect(() => {
    if (isSearchActive) {
      if (isAncestorOfMatch) setIsOpen(true);
      else if (!isMatch) setIsOpen(false);
    }
  }, [isSearchActive, isAncestorOfMatch, isMatch]);

  useEffect(() => {
    if (selectedPath && isObject && selectedPath.startsWith(path + '.') && !isOpen) {
      setIsOpen(true);
    }
  }, [selectedPath, path, isObject]);
  
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const q = searchQuery.toLowerCase();
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === q ? (
            <span key={i} className={`${isDarkMode ? 'bg-blue-500/40' : 'bg-blue-500/20'} text-blue-500 font-bold rounded-sm px-0.5`}>{part}</span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const renderValue = () => {
    if (isObject) {
      const keys = Object.keys(value);
      if (keys.length === 0) return isArray ? '[]' : '{}';
      return <span className={`${isDarkMode ? 'text-gray-600' : 'text-slate-400'} text-[10px] ml-1`}>{isArray ? `Array[${keys.length}]` : `Object{${keys.length}}`}</span>;
    }

    const valStr = String(value);
    const highlightedVal = highlightText(valStr);

    if (typeof value === 'string') return <span className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}>"{highlightedVal}"</span>;
    if (typeof value === 'number') return <span className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>{highlightedVal}</span>;
    if (typeof value === 'boolean') return <span className={isDarkMode ? 'text-purple-400' : 'text-purple-600'}>{highlightedVal}</span>;
    if (value === null) return <span className="text-red-500">null</span>;
    return <span>{highlightedVal}</span>;
  };

  const keyColor = isSelected 
    ? (isDarkMode ? 'text-blue-200' : 'text-blue-600 font-bold') 
    : (isDarkMode ? 'text-gray-400' : 'text-slate-600');

  const nameMatches = isSearchActive && name.toLowerCase().includes(searchQuery.toLowerCase());
  const isDimmed = isSearchActive && !isMatch && !isAncestorOfMatch;

  const hoverBg = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  const selectedBg = isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50/50';

  return (
    <div 
      className={`pl-4 select-none border-l-2 transition-all ${isSelected ? `border-blue-500 ${selectedBg}` : 'border-transparent'} ${isMatch ? (isDarkMode ? 'bg-yellow-500/5' : 'bg-yellow-50') : ''} ${hoverBg}`}
      style={{ opacity: isDimmed ? 0.3 : 1 }}
    >
      <div 
        className="flex items-center group cursor-pointer py-1"
        onClick={() => {
          if (isObject) setIsOpen(!isOpen);
          onSelect(path);
        }}
      >
        <span className="w-4 flex items-center justify-center shrink-0">
          {isObject && (isOpen ? <ChevronDown size={12} className={isDarkMode ? 'text-gray-500' : 'text-slate-400'} /> : <ChevronRight size={12} className={isDarkMode ? 'text-gray-500' : 'text-slate-400'} />)}
        </span>
        
        <span className={`font-mono text-xs ${nameMatches ? 'text-blue-500 font-bold' : keyColor}`}>
          {highlightText(name)}:
        </span>

        <div className="ml-2 font-mono text-xs truncate max-w-[300px]">
          {renderValue()}
        </div>

        <span className={`ml-3 text-[9px] font-mono uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-gray-600' : 'text-slate-400'}`}>
          {fieldType}
        </span>

        <div className="hidden group-hover:flex items-center ml-auto gap-1 pr-2">
          <button onClick={(e) => { e.stopPropagation(); onFavorite(path, value); }} className="p-1 hover:bg-blue-500/10 rounded text-yellow-500"><Star size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onCopy(JSON.stringify(value)); }} className={`p-1 hover:bg-blue-500/10 rounded ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}><Copy size={10} /></button>
        </div>
      </div>

      {isObject && isOpen && (
        <div className={`border-l ${isDarkMode ? 'border-gray-800/50' : 'border-slate-200'} ml-2`}>
          {Object.entries(value).map(([k, v]) => (
            <JsonNode
              isDarkMode={isDarkMode}
              key={k}
              name={k}
              value={v}
              depth={depth + 1}
              path={path ? `${path}.${k}` : k}
              onSelect={onSelect}
              onFavorite={onFavorite}
              onCopy={onCopy}
              selectedPath={selectedPath}
              searchQuery={searchQuery}
              searchResult={searchResult}
              expandAllTrigger={expandAllTrigger}
              collapseAllTrigger={collapseAllTrigger}
            />
          ))}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.searchQuery === next.searchQuery &&
    prev.selectedPath === next.selectedPath &&
    prev.expandAllTrigger === next.expandAllTrigger &&
    prev.collapseAllTrigger === next.collapseAllTrigger &&
    prev.searchResult === next.searchResult &&
    prev.isDarkMode === next.isDarkMode
  );
});
