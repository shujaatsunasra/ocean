'use client';

import React, { useState, useEffect } from 'react';
import { VizSpec } from '../types/actions';
import { VisualizationOrchestrator } from './viz/VisualizationOrchestrator';
import { PlotlyOceanChart } from './viz/plotly/PlotlyOceanChart';

interface VizRendererProps {
  vizSpec: VizSpec;
  onProgress?: (progress: number) => void;
  onHover?: (data: any) => void;
  onClick?: (data: any) => void;
  onResearchSummary?: (summary: any) => void;
  lowPower?: boolean;
  className?: string;
  mode?: 'explorer' | 'power';
}

/**
 * Production Visualization Renderer
 * Routes visualization requests to appropriate components (Three.js or Plotly)
 * Based on MCP orchestrator visualization specifications
 */
export function VizRenderer({ 
  vizSpec, 
  onProgress, 
  onHover, 
  onClick, 
  onResearchSummary,
  lowPower = false, 
  className = '', 
  mode = 'explorer' 
}: VizRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // Fast loading with immediate fallback
  useEffect(() => {
    if (onProgress) {
      const progressInterval = setInterval(() => {
        onProgress(Math.min(100, Date.now() % 1000 / 10));
      }, 30);

      // Much faster timeout - let the components handle their own loading
      setTimeout(() => {
        clearInterval(progressInterval);
        onProgress(100);
        setIsLoading(false);
      }, 400); // Reduced to 400ms

      return () => clearInterval(progressInterval);
    } else {
      setTimeout(() => setIsLoading(false), 300); // Reduced to 300ms
    }
  }, [onProgress, vizSpec]);

  // Reset loading state when vizSpec changes
  useEffect(() => {
    setIsLoading(true);
      setError(null);
  }, [vizSpec]);

  // Handle visualization completion
  const handleVisualizationComplete = () => {
    setIsLoading(false);
    if (onProgress) {
      onProgress(100);
    }
  };

  // Debug vizSpec
  console.log('🎨 VizRenderer received vizSpec:', vizSpec);
  console.log('🎨 VizSpec data:', vizSpec?.data);
  console.log('🎨 VizSpec data length:', Array.isArray(vizSpec?.data) ? vizSpec.data.length : 'not array');
  console.log('🎨 VizSpec library:', vizSpec?.library);

  // Validate vizSpec
  if (!vizSpec) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-black/20 ${className}`}>
        <div className="text-center p-6">
          <div className="text-white/60 text-lg">No Visualization Specification</div>
          <div className="text-gray-500 text-sm">Waiting for data...</div>
        </div>
      </div>
    );
  }

  // Handle empty data - let the VisualizationOrchestrator handle fallbacks
  if (!vizSpec.data || (Array.isArray(vizSpec.data) && vizSpec.data.length === 0)) {
    // For Three.js visualizations, let the orchestrator handle empty data
    if (vizSpec.library === 'three' || !vizSpec.library) {
      return (
        <VisualizationOrchestrator
          vizSpec={vizSpec}
          mode={mode}
          className={className}
          onHover={onHover}
          onClick={onClick}
          onComplete={handleVisualizationComplete}
          onResearchSummary={onResearchSummary}
        />
      );
    }
    
    // For other libraries, show the fallback
    return (
      <div className={`w-full h-full flex items-center justify-center bg-black/20 ${className}`}>
        <div className="text-center p-6">
          <div className="text-white/60 text-lg">No Data Available</div>
          <div className="text-gray-500 text-sm">
            {vizSpec.fallbackText || 'No ocean data to visualize'}
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-black/20 ${className}`}>
        <div className="text-center p-6">
          <div className="animate-spin h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading Visualization</div>
          <div className="text-gray-300 text-sm">
            Preparing {vizSpec.type} with {vizSpec.library}...
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate visualization component based on library
  try {
    switch (vizSpec.library) {
      case 'three':
        return (
          <VisualizationOrchestrator
            vizSpec={vizSpec}
            mode={mode}
            className={className}
            onHover={onHover}
            onClick={onClick}
            onComplete={handleVisualizationComplete}
            onResearchSummary={onResearchSummary}
          />
        );

      case 'plotly':
        return (
          <PlotlyOceanChart
            vizSpec={vizSpec}
            mode={mode}
            className={className}
            onHover={onHover}
            onClick={onClick}
            onComplete={handleVisualizationComplete}
            onResearchSummary={onResearchSummary}
          />
        );

      case 'leaflet':
        // Future: Implement Leaflet map component
        return (
          <div className={`w-full h-full flex items-center justify-center bg-green-900/20 ${className}`}>
            <div className="text-center p-6">
              <div className="text-green-400 text-lg">Leaflet Map</div>
              <div className="text-green-300 text-sm">Coming Soon</div>
              <div className="text-white/60 text-xs mt-2">
                {vizSpec.fallbackText || `Interactive map with ${Array.isArray(vizSpec.data) ? vizSpec.data.length : 0} points`}
              </div>
            </div>
          </div>
        );
        
      default:
        // Default to Three.js for unknown libraries (our new orchestrator handles all types)
        console.warn(`Unknown visualization library: ${vizSpec.library}, defaulting to Three.js`);
        return (
          <VisualizationOrchestrator
            vizSpec={vizSpec}
            mode={mode}
            className={className}
            onHover={onHover}
            onClick={onClick}
            onComplete={handleVisualizationComplete}
            onResearchSummary={onResearchSummary}
          />
        );
    }
  } catch (err) {
    console.error('Visualization rendering error:', err);
  return (
      <div className={`w-full h-full flex items-center justify-center bg-red-900/20 ${className}`}>
        <div className="text-center p-6">
          <div className="text-red-400 text-lg">Visualization Error</div>
          <div className="text-red-300 text-sm">
            Failed to render {vizSpec.type} visualization
        </div>
          <div className="text-white/60 text-xs mt-2">
            {vizSpec.fallbackText || 'Please try a different visualization type'}
          </div>
        </div>
    </div>
  );
}
}
