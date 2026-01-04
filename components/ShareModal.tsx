import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Link as LinkIcon, Share2, Globe, MessageCircle } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];
  const url = 'https://json-morph.com';
  const text = 'Check out JSON Morph - The Professional Architect Suite for JSON analysis and transformation!';
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      id: 'twitter',
      name: t.shareOnX,
      icon: MessageCircle,
      color: 'bg-black text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    },
    {
      id: 'facebook',
      name: t.shareOnFB,
      icon: Globe,
      color: 'bg-[#1877F2] text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      id: 'linkedin',
      name: t.shareOnLI,
      icon: Share2,
      color: 'bg-[#0A66C2] text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    }
  ];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden m-4 z-10"
          >
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Share2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.shareTitle}</h2>
              <p className="text-sm text-gray-500 text-center">{t.shareDesc}</p>
            </div>

            <div className="space-y-3">
              {shareLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-4 p-4 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] ${link.color}`}
                >
                  <link.icon size={20} />
                  <span className="font-medium">{link.name}</span>
                </a>
              ))}

              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={`transition-all duration-300 ${copied ? 'text-emerald-500' : 'text-gray-500'}`}>
                  {copied ? <Check size={20} /> : <LinkIcon size={20} />}
                </div>
                <span className="font-medium">{copied ? t.copied : t.copyLink}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
