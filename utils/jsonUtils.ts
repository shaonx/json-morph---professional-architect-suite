
import { JsonStats, TableCandidate } from '../types';
import jsYaml from 'js-yaml';

/**
 * Fine-grained type detection for JSON values
 */
export const detectType = (val: any): string => {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  const basicType = typeof val;
  
  if (basicType === 'number') {
    // Unix Time Seconds: 10 digits (approx 2000 - 2050)
    if (val > 946684800 && val < 2524608000 && Number.isInteger(val)) return 'unixtime (s)';
    // Unix Time Milliseconds: 13 digits
    if (val > 946684800000 && val < 2524608000000 && Number.isInteger(val)) return 'unixtime (ms)';
    return 'number';
  }
  
  if (basicType === 'string') {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) return 'uuid';
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) return 'color';
    if (/^https?:\/\//.test(val)) return 'url';
    if (/\S+@\S+\.\S+/.test(val)) return 'email';
    // ISO Date detection
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) return 'date (iso)';
    return 'string';
  }
  
  return basicType;
};

/**
 * 优化后的 JSON 分析逻辑
 */
export const analyzeJson = (obj: any): JsonStats => {
  let keyCount = 0;
  let maxDepth = 0;
  let totalChars = 0;
  try {
    totalChars = JSON.stringify(obj).length;
  } catch(e) {
    totalChars = 0;
  }
  
  let longestValue = { key: '', length: 0, value: '' };
  const keyFrequency: Record<string, number> = {};
  const valueAggregation: Record<string, string[]> = {};
  const typeDistribution: Record<string, number> = {};

  const traverse = (current: any, depth: number, path: string) => {
    if (depth > maxDepth) maxDepth = depth;

    // Type analysis for every value
    const type = detectType(current);
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;

    if (current === null || typeof current !== 'object') {
      const valStr = String(current);
      if (valStr.length > longestValue.length) {
        longestValue = { key: path, length: valStr.length, value: valStr };
      }
      
      if (!valueAggregation[valStr]) {
        valueAggregation[valStr] = [];
      }
      if (valueAggregation[valStr].length < 100) {
        valueAggregation[valStr].push(path);
      }
      return;
    }

    const isArr = Array.isArray(current);
    const keys = Object.keys(current);
    keyCount += keys.length;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      keyFrequency[key] = (keyFrequency[key] || 0) + 1;
      const currentPath = path ? `${path}${isArr ? `[${key}]` : `.${key}`}` : key;
      traverse(current[key], depth + 1, currentPath);
    }
  };

  traverse(obj, 0, '');

  return {
    keyCount,
    maxDepth,
    totalChars,
    longestValue,
    keyFrequency,
    valueAggregation,
    typeDistribution
  };
};

export const findTableCandidates = (obj: any): TableCandidate[] => {
  const candidates: TableCandidate[] = [];
  const traverse = (current: any, path: string) => {
    if (current === null || typeof current !== 'object') return;
    if (Array.isArray(current) && current.length > 0) {
      const firstItem = current[0];
      if (firstItem !== null && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
        const headerSet = new Set<string>();
        current.forEach(item => {
          if (item && typeof item === 'object') {
            Object.keys(item).forEach(k => headerSet.add(k));
          }
        });
        if (headerSet.size > 0) {
          candidates.push({
            path: path || 'root',
            rows: current,
            headers: Array.from(headerSet)
          });
        }
      }
    }
    if (!Array.isArray(current)) {
      Object.entries(current).forEach(([k, v]) => {
        traverse(v, path ? `${path}.${k}` : k);
      });
    } else {
      current.forEach((item, index) => {
        traverse(item, `${path}[${index}]`);
      });
    }
  };
  traverse(obj, '');
  return candidates;
};

export const toXml = (obj: any, rootName = 'root'): string => {
  const toXmlRecursive = (val: any, name: string): string => {
    if (val === null) return `<${name} />`;
    if (typeof val !== 'object') return `<${name}>${val}</${name}>`;
    if (Array.isArray(val)) {
      return val.map(item => toXmlRecursive(item, name.endsWith('s') ? name.slice(0, -1) : 'item')).join('');
    }
    const children = Object.entries(val)
      .map(([k, v]) => toXmlRecursive(v, k))
      .join('');
    return `<${name}>${children}</${name}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n${toXmlRecursive(obj, rootName)}`;
};

export const toToml = (obj: any): string => {
  const lines: string[] = [];
  const traverse = (current: any, prefix = '') => {
    if (current === null || typeof current !== 'object') return;
    Object.entries(current).forEach(([k, v]) => {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        lines.push(`\n[${prefix ? `${prefix}.${k}` : k}]`);
        traverse(v, prefix ? `${prefix}.${k}` : k);
      } else if (Array.isArray(v)) {
        lines.push(`${k} = ${JSON.stringify(v)}`);
      } else {
        lines.push(`${k} = ${typeof v === 'string' ? `"${v}"` : v}`);
      }
    });
  };
  traverse(obj);
  return lines.join('\n');
};

export const toTsv = (table: TableCandidate): string => {
  const headers = table.headers.join('\t');
  const rows = table.rows.map(row => 
    table.headers.map(h => {
      const v = row[h];
      return typeof v === 'object' ? JSON.stringify(v) : String(v);
    }).join('\t')
  ).join('\n');
  return `${headers}\n${rows}`;
};

export const toMarkdownTable = (table: TableCandidate): string => {
  const header = `| ${table.headers.join(' | ')} |`;
  const divider = `| ${table.headers.map(() => '---').join(' | ')} |`;
  const rows = table.rows.map(r => `| ${table.headers.map(h => {
    const v = r[h];
    return (typeof v === 'object' ? JSON.stringify(v) : String(v)).replace(/\|/g, '\\|');
  }).join(' | ')} |`).join('\n');
  return `${header}\n${divider}\n${rows}`;
};

export const calculateSearchResult = (data: any, query: string) => {
  if (!query || !data) return { count: 0, matchingPaths: new Set<string>(), ancestorPaths: new Set<string>() };
  const q = query.toLowerCase();
  const matchingPaths = new Set<string>();
  const ancestorPaths = new Set<string>();
  const traverse = (obj: any, path: string) => {
    let isMatch = false;
    const lastPart = path.split(/[\.\[]/).pop()?.replace(']', '') || '';
    if (lastPart.toLowerCase().includes(q)) isMatch = true;
    if (obj !== null && typeof obj !== 'object') {
      if (String(obj).toLowerCase().includes(q)) isMatch = true;
    }
    if (isMatch) {
      matchingPaths.add(path);
      const parts = path.split('.');
      let current = '';
      for (let i = 0; i < parts.length - 1; i++) {
        current = current ? `${current}.${parts[i]}` : parts[i];
        ancestorPaths.add(current);
      }
      ancestorPaths.add(""); 
    }
    if (obj !== null && typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (matchingPaths.size > 2000) return; 
      for (const k of keys) {
        traverse(obj[k], path ? `${path}.${k}` : k);
      }
    }
  };
  traverse(data, '');
  return { count: matchingPaths.size, matchingPaths, ancestorPaths };
};

export const toYaml = (obj: any): string => {
  try {
    return jsYaml.dump(obj, { indent: 2, skipInvalid: true });
  } catch (e) {
    return 'Error converting to YAML';
  }
};

export const formatJson = (obj: any): string => {
  return JSON.stringify(obj, null, 2);
};

export const downloadAsFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 将 JSON 渲染为带背景的高级图片
 */
export const renderJsonToImage = (json: string): Promise<void> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve();

    const padding = 60;
    const innerPadding = 40;
    const lines = json.split('\n').slice(0, 100); // 限制行数以保证性能
    const lineHeight = 20;
    const fontSize = 14;

    ctx.font = `${fontSize}px "Fira Code", monospace`;
    let maxLineWidth = 0;
    lines.forEach(line => {
      const width = ctx.measureText(line).width;
      if (width > maxLineWidth) maxLineWidth = width;
    });

    canvas.width = Math.min(maxLineWidth + (padding + innerPadding) * 2, 1200);
    canvas.height = lines.length * lineHeight + (padding + innerPadding) * 2 + 20;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = '#020617';
    const rectX = padding;
    const rectY = padding;
    const rectW = canvas.width - padding * 2;
    const rectH = canvas.height - padding * 2;
    
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectW, rectH, 16);
    ctx.fill();
    ctx.shadowBlur = 0;

    const dotColors = ['#ff5f56', '#ffbd2e', '#27c93f'];
    dotColors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(rectX + 24 + i * 20, rectY + 24, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = `${fontSize}px "Fira Code", monospace`;
    ctx.textBaseline = 'top';
    
    lines.forEach((line, i) => {
      let xOffset = rectX + innerPadding;
      const yOffset = rectY + innerPadding + 24 + i * lineHeight;
      if (line.includes(':')) {
        const parts = line.split(/:(.*)/s);
        ctx.fillStyle = '#7dd3fc'; 
        ctx.fillText(parts[0] + ':', xOffset, yOffset);
        xOffset += ctx.measureText(parts[0] + ':').width;
        ctx.fillStyle = '#f0abfc'; 
        ctx.fillText(parts[1], xOffset, yOffset);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(line, xOffset, yOffset);
      }
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `json_morph_${Date.now()}.png`;
    link.click();
    resolve();
  });
};
