
import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isDarkMode?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, color, isDarkMode = true }) => {
  const bg = isDarkMode ? 'bg-[#151515]' : 'bg-white';
  const border = isDarkMode ? 'border-gray-800/50' : 'border-slate-200';
  const textVal = isDarkMode ? 'text-white' : 'text-slate-800';
  const shadow = isDarkMode ? '' : 'shadow-sm hover:shadow-md';

  return (
    <motion.div
      whileHover={{ y: -1, backgroundColor: isDarkMode ? '#1a1a1a' : '#fafafa' }}
      className={`${bg} p-2.5 rounded-lg border ${border} flex items-center gap-3 transition-all ${shadow}`}
    >
      <div className={`p-1.5 rounded-md ${color} bg-opacity-10 text-${color.split('-')[1]}-500 shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-[9px] uppercase tracking-tighter font-bold truncate leading-none mb-1">{label}</p>
        <p className={`text-sm font-bold ${textVal} truncate leading-none`}>{value}</p>
      </div>
    </motion.div>
  );
};
