'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap } from 'lucide-react';
import { useApp } from '@/app/providers';

export function Navbar() {
  const { mode, setMode } = useApp();

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      {/* Top Navigation Toggle */}
      <div className="relative flex bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden rounded-lg">
        {/* Modern animated background slider */}
        <motion.div
          className="absolute top-0 bottom-0 w-1/2 bg-white/10"
          animate={{
            x: mode === 'explorer' ? 0 : '100%',
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
        />
        
        {/* Subtle gradient accent line */}
        <motion.div
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-white/5 to-white/15"
          animate={{
            x: mode === 'explorer' ? 0 : '100%',
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
        />
        
        {/* Explorer Button */}
        <motion.button
          onClick={() => setMode('explorer')}
          className={`relative z-10 flex items-center px-6 py-3 text-sm font-krub font-medium transition-all duration-300 ${
            mode === 'explorer'
              ? 'text-white'
              : 'text-white/60 hover:text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Eye size={16} className="mr-2" />
          Explorer
        </motion.button>
        
        {/* Power Button */}
        <motion.button
          onClick={() => setMode('power')}
          className={`relative z-10 flex items-center px-6 py-3 text-sm font-krub font-medium transition-all duration-300 ${
            mode === 'power'
              ? 'text-white'
              : 'text-white/60 hover:text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap size={16} className="mr-2" />
          Power
        </motion.button>
      </div>
    </nav>
  );
}