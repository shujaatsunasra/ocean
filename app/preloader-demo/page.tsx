'use client'

import { useState } from 'react'
import { Preloader } from '@/components/ui/Preloader'
import { motion } from 'framer-motion'

export default function PreloaderDemo() {
  const [showPreloader, setShowPreloader] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const triggerPreloader = () => {
    setIsLoading(true)
    setShowPreloader(true)
  }

  const handlePreloaderComplete = () => {
    setShowPreloader(false)
    setTimeout(() => {
      setIsLoading(false)
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-flynzo-900 via-ocean-900 to-flynzo-800 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4 font-raleway">
            Premium Preloader Demo
          </h1>
          <p className="text-flynzo-300 text-lg">
            Experience the smooth, elegant preloader with Hello/Bonjour greetings
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-flynzo-800/50 backdrop-blur-sm p-6 shadow-sharp-lg"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">Features</h2>
            <ul className="space-y-3 text-flynzo-300">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Smooth Hello/Bonjour crossfade every 1.2s
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Animated gradient background with shimmer
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Pulsing glow effect on logo
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Smooth exit transition (0.6s)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Floating particle effects
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Theme-driven colors (no hardcoded values)
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-flynzo-800/50 backdrop-blur-sm p-6 shadow-sharp-lg"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">Technical Specs</h2>
            <ul className="space-y-3 text-flynzo-300">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Next.js 15 + React 18 compatible
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Framer Motion animations
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                TailwindCSS styling
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Performance optimized (60fps)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                TypeScript support
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-ocean-400 rounded-full mr-3"></span>
                Responsive design
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <button
            onClick={triggerPreloader}
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-semibold rounded-none shadow-sharp-glow hover:shadow-sharp-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Trigger Preloader'}
          </button>
        </motion.div>

        {/* Preloader Component */}
        {showPreloader && (
          <Preloader
            onComplete={handlePreloaderComplete}
            duration={4000}
          />
        )}
      </div>
    </div>
  )
}
