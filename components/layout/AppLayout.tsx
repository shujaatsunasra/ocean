'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/app/providers';
import { Navbar } from './Navbar';
import { ExplorerMode } from '@/components/modes/ExplorerMode';
import { PowerModeEnhanced } from '@/components/modes/PowerModeEnhanced';
import { loadPlotly } from '@/lib/plotly-loader';
import { loadThree } from '@/lib/three-loader';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

export function AppLayout() {
    const { mode } = useApp();
    const [isDesktop, setIsDesktop] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Check if device is desktop (screen width >= 1024px)
    useEffect(() => {
        const checkIsDesktop = () => {
            const width = window.innerWidth;
            setIsDesktop(width >= 1024);
            setIsClient(true);
        };

        checkIsDesktop();
        window.addEventListener('resize', checkIsDesktop);
        
        return () => window.removeEventListener('resize', checkIsDesktop);
    }, []);

    // Pre-load visualization libraries when the app starts (only on desktop)
    useEffect(() => {
        if (isDesktop) {
            // Load both libraries in parallel
            Promise.all([
                loadPlotly().catch(err => console.warn('Failed to pre-load Plotly:', err)),
                loadThree().catch(err => console.warn('Failed to pre-load Three.js:', err))
            ]).then(() => {
                console.log('✅ All visualization libraries pre-loaded');
            });
        }
    }, [isDesktop]);

    // Show loading state during client-side hydration
    if (!isClient) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    // Show desktop-only message on mobile/tablet
    if (!isDesktop) {
        return (
            <div className="min-h-screen bg-black gradient-hero flex items-center justify-center px-4">
                <div className="text-center max-w-md mx-auto">
                    {/* Desktop Icon */}
                    <div className="mb-8 flex justify-center">
                        <div className="relative">
                            <Monitor size={80} className="text-white/20" />
                            <div className="absolute -top-2 -right-2">
                                <Smartphone size={24} className="text-white/10" />
                            </div>
                            <div className="absolute -bottom-1 -left-2">
                                <Tablet size={28} className="text-white/10" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4 font-raleway">
                        Desktop Only
                    </h1>

                    {/* Description */}
                    <p className="text-white/70 text-lg leading-relaxed mb-8">
                        This application is optimized for desktop computers and requires a screen width of at least 1024px for the best experience.
                    </p>

                    {/* Features List */}
                    <div className="text-left space-y-3 mb-8">
                        <div className="flex items-center text-white/60">
                            <div className="w-2 h-2 bg-gradient-to-r from-white/40 to-white/20 rounded-full mr-3"></div>
                            <span>Advanced data visualization</span>
                        </div>
                        <div className="flex items-center text-white/60">
                            <div className="w-2 h-2 bg-gradient-to-r from-white/40 to-white/20 rounded-full mr-3"></div>
                            <span>Interactive ocean data analysis</span>
                        </div>
                        <div className="flex items-center text-white/60">
                            <div className="w-2 h-2 bg-gradient-to-r from-white/40 to-white/20 rounded-full mr-3"></div>
                            <span>Real-time data processing</span>
                        </div>
                        <div className="flex items-center text-white/60">
                            <div className="w-2 h-2 bg-gradient-to-r from-white/40 to-white/20 rounded-full mr-3"></div>
                            <span>AI-powered insights</span>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <p className="text-white/80 text-sm">
                            Please access this application from a desktop computer or laptop with a screen width of 1024px or larger.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop view - show the full application
    return (
        <div className="min-h-screen bg-black gradient-hero">
            {/* Navbar with Toggle */}
            <Navbar />

            {/* Main Content - account for top navigation */}
            <main className="pt-20">
                {mode === 'explorer' ? (
                    <div className="h-[calc(100vh-6rem)] flex items-center justify-center px-4">
                        <div className="w-full max-w-4xl h-full flex flex-col justify-center">
                            <ExplorerMode />
                        </div>
                    </div>
                ) : (
                    <PowerModeEnhanced />
                )}
            </main>
        </div>
    );
}