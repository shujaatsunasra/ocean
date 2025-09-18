'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Settings,
  Filter,
  BarChart3,
  Calendar,
  RotateCcw,
  Download,
  Share2,
  Globe,
  MessageCircle,
  Zap,
  ChevronDown,
  X,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/app/providers';

// Import our new components
import { ChatAssistant } from '../ChatAssistant';
import { VizRenderer } from '../VizRendererProduction';
import { useActionExecutor } from '../../hooks/useActionExecutor';
import { ActionObject, VizSpec } from '../../types/actions';




export function PowerModeEnhanced() {
  // Design System Constants - 8px spacing grid
  const spacing = {
    xs: '4px',   // 0.5 * 8px
    sm: '8px',   // 1 * 8px
    md: '16px',  // 2 * 8px
    lg: '24px',  // 3 * 8px
    xl: '32px',  // 4 * 8px
    '2xl': '48px' // 6 * 8px
  };

  const typography = {
    h1: 'text-xl font-raleway font-medium',     // 20px/500 - Raleway for headers
    h2: 'text-lg font-raleway font-medium', // 18px/500 - Raleway for headers
    h3: 'text-base font-raleway font-medium', // 16px/500 - Raleway for headers
    label: 'text-sm font-krub font-normal',    // 14px/400 - Krub for labels
    body: 'text-sm font-krub',                 // 14px/400 - Krub for body
    caption: 'text-xs font-krub'               // 12px/400 - Krub for captions
  };
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState({ start: '2020-01-01', end: '2024-12-31' });
  const [depthRange, setDepthRange] = useState({ min: 0, max: 2000 });
  const [modelType, setModelType] = useState('raw');
  const [currentVizSpec, setCurrentVizSpec] = useState<VizSpec | null>(null);
  const [isVisualizationLoading, setIsVisualizationLoading] = useState(false);
  const [visualizationTimeout, setVisualizationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [researchSummary, setResearchSummary] = useState<any>(null);

  // New UI state
  const [expandedSections, setExpandedSections] = useState({
    physical: true,
    chemical: false,
    biological: false,
    filters: false
  });
  const [isVisualizationCollapsed, setIsVisualizationCollapsed] = useState(false);
  const [variableSearch, setVariableSearch] = useState('');
  const [autoApply, setAutoApply] = useState(true);
  const [isQuickActionsVisible, setIsQuickActionsVisible] = useState(() => {
    // Check if user has seen quick actions before (localStorage)
    if (typeof window !== 'undefined') {
      const hasSeenQuickActions = localStorage.getItem('hasSeenQuickActions');
      return !hasSeenQuickActions; // Show only if user hasn't seen them before
    }
    return true; // Default to showing on first visit
  });
  const { mode, setMode } = useApp();

  // FloatChat Ocean MCP - No Fallback Data (Data Discipline)
  const generateFallbackData = useCallback(() => {
    console.error('FloatChat Error: No real Argovis MCP data available. Data discipline enforced - no placeholders allowed.');
    return []; // Return empty array - no fallback data
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (visualizationTimeout) {
        clearTimeout(visualizationTimeout);
      }
    };
  }, [visualizationTimeout]);

  // FloatChat Ocean MCP - No Default Visualization (Data Discipline)
  useEffect(() => {
    if (!currentVizSpec) {
      console.log('🔬 FloatChat: Waiting for real Argovis MCP data - no default visualization');
      // No default visualization - wait for real data
    }
  }, [currentVizSpec]);


  // Use our action execution system
  const {
    analysisState,
    executeActions,
    getReproducibleScript,
    activeJobs,
    completedJobs,
    failedJobs
  } = useActionExecutor();

  // Memoize static data to prevent re-creation on every render
  const regions = useMemo(() => ['North Atlantic', 'South Pacific', 'Arctic Ocean', 'Mediterranean', 'Indian Ocean', 'Southern Ocean'], []);

  const variableGroups = useMemo(() => ({
    physical: ['Temperature', 'Salinity', 'Pressure', 'Current Speed', 'Wave Height'],
    chemical: ['Oxygen', 'pH', 'Nitrate', 'Phosphate', 'Silicate'],
    biological: ['Chlorophyll', 'Primary Production', 'Plankton Density']
  }), []);

  // Handle actions from ChatAssistant and Quick Actions
  const handleActionsGenerated = useCallback(async (actions: ActionObject[], realData?: any) => {
    console.log('🎬 PowerModeEnhanced - Executing actions:', actions);
    console.log('📊 PowerModeEnhanced - Real data received:', realData);
    await executeActions(actions);

    // Check if we need to create a visualization
    const vizAction = actions.find(action =>
      action.type === 'run_analysis' ||
      (action.type === 'create_view' && action.params.type === 'visualization')
    );

    console.log('🔍 PowerModeEnhanced - Visualization action found:', vizAction);

    if (vizAction) {
      // Use real data if available, otherwise fall back to minimal data
      const dataToUse = realData?.profiles || []; // FloatChat: No fallback data
      const vizSpecs = realData?.visualization_specs;
      
      console.log('🔍 PowerModeEnhanced - Real data received:', realData);
      console.log('📊 Data to use for visualization:', dataToUse.length, 'profiles');
      console.log('🎯 Visualization specs:', vizSpecs);
      console.log('📊 DataToUse sample:', dataToUse.slice(0, 2));
      
      // Debug data structure
      if (dataToUse.length > 0) {
        const sample = dataToUse[0];
        console.log('🔍 Data structure analysis:', {
          keys: Object.keys(sample),
          sample: sample,
          hasLat: 'lat' in sample,
          hasLon: 'lon' in sample,
          hasDepth: 'depth' in sample,
          hasTemperature: 'temperature' in sample,
          hasSalinity: 'salinity' in sample
        });
      }
      
      // Batch state updates to reduce re-renders
      const newVizSpec: VizSpec = dataToUse.length === 0 ? {
        type: 'scatter3d' as const,
        data: [],
        library: 'three' as const,
        meta: {
          title: 'No Data Available',
          variables: ['temperature'],
          depth_domain: [0, 2000],
          time_range: ['2020-01-01', '2024-12-31'],
          qc_policy: { allowed: [1], reject: [4, 9] },
          climatology_reference: 'WOA-2018',
          provenance: {
            dataset: 'no-data',
            version: '2025-01-01',
            source: 'empty'
          }
        },
        renderHints: {
          lod: 'auto',
          picking: 'gpu'
        }
      } : {
        type: (vizSpecs?.type || vizAction.params.pipeline || 'scatter3d') as any,
        data: dataToUse,
        library: (vizSpecs?.library || (vizAction.params.pipeline === 'scatter3d' ? 'three' : 'plotly')) as any,
        config: vizSpecs?.config,
        meta: {
          title: generateVisualizationTitle(),
          variables: analysisState.filters.variables || ['temperature'],
          depth_domain: analysisState.filters.depth || [0, 2000],
          time_range: analysisState.filters.timeRange || ['2020-01-01', '2024-12-31'],
          qc_policy: { allowed: [1], reject: [4, 9] },
          climatology_reference: 'WOA-2018',
          provenance: {
            dataset: 'argo-v3',
            version: '2025-01-01',
            source: 'ncei'
          }
        },
        renderHints: {
          lod: 'auto',
          picking: 'gpu'
        }
      };

      // Batch all state updates together
      setIsVisualizationLoading(true);
      setCurrentVizSpec(newVizSpec);
      
      if (dataToUse.length === 0) {
        console.log('⚠️ PowerModeEnhanced: No real data available for visualization')
        setIsVisualizationLoading(false)
        return
      }
      
      // Debug: Check data structure and validation requirements
      if (dataToUse.length > 0) {
        const sample = dataToUse[0];
        console.log('🔍 Sample data point structure:', sample);
        console.log('🔍 Data validation check:', {
          hasLat: typeof sample.lat === 'number' && !isNaN(sample.lat),
          hasLon: typeof sample.lon === 'number' && !isNaN(sample.lon),
          hasDepth: typeof sample.depth === 'number' && !isNaN(sample.depth),
          hasTemp: typeof sample.temperature === 'number' && !isNaN(sample.temperature),
          hasSalinity: typeof sample.salinity === 'number' && !isNaN(sample.salinity),
          hasPressure: typeof sample.pressure === 'number' && !isNaN(sample.pressure),
          latRange: sample.lat >= -90 && sample.lat <= 90,
          lonRange: sample.lon >= -180 && sample.lon <= 180,
          depthRange: sample.depth >= 0
        });
        
        // Count valid points
        const validPoints = dataToUse.filter((point: any) => {
          const hasValidLat = typeof point.lat === 'number' && !isNaN(point.lat) && point.lat >= -90 && point.lat <= 90;
          const hasValidLon = typeof point.lon === 'number' && !isNaN(point.lon) && point.lon >= -180 && point.lon <= 180;
          const hasValidDepth = typeof point.depth === 'number' && !isNaN(point.depth) && point.depth >= 0;
          return hasValidLat && hasValidLon && hasValidDepth;
        });
        console.log('🔍 Valid points count:', validPoints.length, 'out of', dataToUse.length);
      }
      
      // Clear any existing timeout
      if (visualizationTimeout) {
        clearTimeout(visualizationTimeout);
      }
      
      // Set a maximum loading time of 1.5 seconds
      const timeout = setTimeout(() => {
        setIsVisualizationLoading(false);
        setVisualizationTimeout(null);
      }, 1500);
      
      setVisualizationTimeout(timeout);
    }
  }, [executeActions, analysisState, visualizationTimeout]);



  const generateVisualizationTitle = useCallback(() => {
    const parts = [];

    if (selectedVariables.length > 0) {
      parts.push(selectedVariables.join(', '));
    }

    if (selectedRegions.length > 0) {
      parts.push(selectedRegions.join(', '));
    }

    parts.push(`${timeRange.start} to ${timeRange.end}`);

    return parts.join(' - ') || 'Ocean Data Analysis';
  }, [selectedVariables, selectedRegions, timeRange]);

  const handleRegionToggle = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const handleVariableToggle = (variable: string) => {
    setSelectedVariables(prev =>
      prev.includes(variable)
        ? prev.filter(v => v !== variable)
        : [...prev, variable]
    );
  };

  const handleExportScript = () => {
    const script = getReproducibleScript();
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocean-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseQuickActions = () => {
    setIsQuickActionsVisible(false);
    // Mark that user has seen quick actions
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenQuickActions', 'true');
    }
  };

  const handleShowQuickActions = () => {
    setIsQuickActionsVisible(true);
  };

  // Helper functions for expanded sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSelectedCount = (group: string) => {
    return variableGroups[group as keyof typeof variableGroups].filter(v => selectedVariables.includes(v)).length;
  };

  const getTotalCount = (group: string) => {
    return variableGroups[group as keyof typeof variableGroups].length;
  };

  const filteredVariables = (variables: string[]) => {
    return variables.filter(v => v.toLowerCase().includes(variableSearch.toLowerCase()));
  };

  const getActiveFilterChips = () => {
    const chips = [];
    if (selectedVariables.length > 0) {
      chips.push(`${selectedVariables.length} variables`);
    }
    if (selectedRegions.length > 0) {
      chips.push(selectedRegions.join(' · '));
    }
    if (timeRange.start !== '2020-01-01' || timeRange.end !== '2024-12-31') {
      chips.push(`${timeRange.start} – ${timeRange.end}`);
    }
    return chips;
  };

  return (
    <>
      {/* Sharp-Corner Design System Styles */}
      <style jsx global>{`
        /* Sharp-corner micro-interactions */
        .btn-sharp { 
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1); 
          transform-origin: center;
          border-radius: 0 !important;
        }
        .btn-sharp:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 12px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .btn-sharp:active { 
          transform: translateY(-1px); 
          transition-duration: 75ms;
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }
        
        /* Sharp glass morphism with enhanced depth */
        .glass-panel-sharp { 
          backdrop-filter: blur(24px); 
          -webkit-backdrop-filter: blur(24px);
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 16px 48px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          border-radius: 0 !important;
        }
        
        /* Sharp scrollbars */
        .custom-scroll-sharp::-webkit-scrollbar { width: 4px; }
        .custom-scroll-sharp::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll-sharp::-webkit-scrollbar-thumb { 
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1)); 
          border-radius: 0;
        }
        .custom-scroll-sharp::-webkit-scrollbar-thumb:hover { 
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2)); 
        }
        
        /* Sharp status indicators with glow */
        .status-dot-sharp { 
          animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          border-radius: 0;
          box-shadow: 0 0 8px currentColor;
        }
        
        /* Precision floating animations */
        .float-precise { 
          animation: float-sharp 4s ease-in-out infinite; 
        }
        
        @keyframes float-sharp {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.02); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 1; 
            box-shadow: 0 0 8px currentColor;
          }
          50% { 
            opacity: 0.7; 
            box-shadow: 0 0 16px currentColor;
          }
        }
        
        /* Sharp card hover with layered shadows */
        .card-sharp {
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 0 !important;
        }
        .card-sharp:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 24px 48px rgba(0,0,0,0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        
        /* Sharp gradient buttons */
        .btn-gradient-sharp {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 4px 16px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-gradient-sharp:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
          box-shadow: 
            0 8px 24px rgba(255, 255, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }
        
        /* Sharp input fields */
        .input-sharp {
          border-radius: 0 !important;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.6);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-sharp:focus {
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(0, 0, 0, 0.8);
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.1),
            0 0 0 2px rgba(255, 255, 255, 0.2);
        }
        
        /* Gradient Animations */
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        @keyframes gradient-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient-x {
          animation: gradient-x 4s ease infinite;
          background-size: 200% 200%;
        }
        
        .focus\\:shadow-gradient-glow:focus {
          box-shadow: 
            0 0 0 2px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(255, 255, 255, 0.2),
            0 0 40px rgba(255, 255, 255, 0.1);
          border-image: linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3)) 1;
          animation: gradient-border 3s ease infinite;
        }
        
        .gradient-border {
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
          background-size: 400% 400%;
          animation: gradient-border 4s ease infinite;
        }
        
        .gradient-border-content {
          background: rgba(0, 0, 0, 0.95);
          margin: 2px;
        }
      `}</style>

      <div className="h-[calc(100vh-6rem)] flex flex-col">
        {/* Unified Main Interface */}
        <div className="flex-1 overflow-hidden p-2">
          <div className="h-full grid grid-cols-12 gap-2 min-h-0">

            {/* Left Panel - AI Assistant & Quick Actions */}
            <div className="col-span-5 glass-panel-sharp flex flex-col h-full overflow-hidden">

              {/* AI Header - Compact */}
              <div className="p-2 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center float-precise shadow-sharp">
                        <MessageCircle size={18} className="text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white status-dot-sharp"></div>
                    </div>
                    <div>
                      <h3 className="font-raleway font-medium text-white text-base">Ocean AI Assistant</h3>
                      <div className="text-xs text-white">
                        Ready for analysis
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/10 transition-all duration-200 text-white hover:text-white btn-sharp">
                    <Settings size={16} />
                  </button>
                </div>
              </div>

              {/* Quick Actions - Ultra Compact */}
              {isQuickActionsVisible && (
                <div className="p-2 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-krub font-medium text-white flex items-center">
                      <Zap size={12} className="mr-2" />
                      QUICK ACTIONS
                    </span>
                    <button
                      onClick={handleCloseQuickActions}
                      className="p-1 hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white btn-sharp"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    <button
                      onClick={() => handleActionsGenerated([{
                        id: `action-${Date.now()}-analyze`,
                        type: 'run_analysis',
                        params: { pipeline: 'heatmap', mode: 'region_analysis', resolution: '25km', aggregation: 'monthly' },
                        meta: { createdBy: 'quick-action', confidence: 0.95, timestamp: new Date().toISOString() }
                      }])}
                       className="group flex items-center px-2 py-1.5 text-white text-xs font-medium btn-gradient-sharp"
                    >
                      <Sparkles size={12} className="mr-2" />
                      Analyze Ocean Region
                    </button>
                    <button
                      onClick={() => handleActionsGenerated([{
                        id: `action-${Date.now()}-compare`,
                        type: 'run_analysis',
                        params: { pipeline: 'comparison', mode: 'dataset_compare', variables: ['temperature', 'salinity'], aggregation: 'regional' },
                        meta: { createdBy: 'quick-action', confidence: 0.90, timestamp: new Date().toISOString() }
                      }])}
                       className="group flex items-center px-2 py-1.5 bg-gradient-to-r from-white/30 to-white/20 hover:from-white/40 hover:to-white/30 text-white text-xs font-medium btn-sharp border border-white/20"
                    >
                      <BarChart3 size={12} className="mr-2" />
                      Compare Datasets
                    </button>
                    <button
                      onClick={() => handleActionsGenerated([{
                        id: `action-${Date.now()}-trend`,
                        type: 'run_analysis',
                        params: { pipeline: 'timeseries', mode: 'trend_analysis', aggregation: 'monthly', method: 'linear_regression' },
                        meta: { createdBy: 'quick-action', confidence: 0.88, timestamp: new Date().toISOString() }
                      }])}
                       className="group flex items-center px-2 py-1.5 bg-gradient-to-r from-white/30 to-white/20 hover:from-white/40 hover:to-white/30 text-white text-xs font-medium btn-sharp border border-white/20"
                    >
                      <Calendar size={12} className="mr-2" />
                      Trend Analysis
                    </button>
                  </div>
                </div>
              )}

              {/* Show Quick Actions Button */}
              {!isQuickActionsVisible && (
                <div className="px-2 py-1 border-b border-white/10">
                  <button
                    onClick={handleShowQuickActions}
                    className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 btn-sharp"
                  >
                    <Zap size={12} className="mr-2" />
                    Show Quick Actions
                  </button>
                </div>
              )}

              {/* Chat Area - Optimized for full space usage */}
              <div className="flex-1 min-h-0 flex flex-col">
                <ChatAssistant
                  onActionsGenerated={handleActionsGenerated}
                  analysisState={analysisState}
                  className="flex-1 custom-scroll-sharp"
                  mode="power"
                  researchSummary={researchSummary}
                />
              </div>

              {/* Status Footer - Ultra Compact */}
              <div className="p-2 border-t border-white/10 bg-black/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-xs font-medium text-white">
                      <div className="w-2 h-2 bg-white mr-2 status-dot-sharp" />
                      AI Ready
                    </div>
                    {activeJobs.length > 0 && (
                      <div className="text-xs text-white bg-white/10 px-2 py-1 border border-white/20">
                        {activeJobs.length} processing
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="text-xs font-medium text-white/60 hover:text-white px-2 py-1 hover:bg-white/5 btn-sharp">
                      Export
                    </button>
                    <button className="text-xs font-medium text-white/60 hover:text-white px-2 py-1 hover:bg-white/5 btn-sharp">
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Visualization & Analysis */}
            <div className="col-span-7 glass-panel-sharp flex flex-col h-full overflow-hidden min-h-0">

              {/* Visualization Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center float-precise shadow-sharp">
                      <Globe size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-raleway font-medium text-white text-base">
                        {currentVizSpec?.meta.title || 'Ocean Analysis'}
                      </h3>
                      <p className="text-xs text-white">Interactive visualization & data exploration</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, filters: !prev.filters }))}
                      className="flex items-center px-3 py-2 text-white hover:text-white hover:bg-white/5 transition-all duration-200 text-xs font-medium btn-sharp"
                    >
                      <Filter size={14} className="mr-2" />
                      Filters
                      <ChevronDown size={12} className={`ml-2 transition-transform duration-200 ${expandedSections.filters ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="w-px h-6 bg-white/20"></div>
                    <button className="p-2 text-white hover:text-white hover:bg-white/5 transition-all duration-200 btn-sharp">
                      <RotateCcw size={16} />
                    </button>
                    <button className="p-2 text-white hover:text-white hover:bg-white/5 transition-all duration-200 btn-sharp">
                      <Download size={16} />
                    </button>
                    <button className="p-2 text-white hover:text-white hover:bg-white/5 transition-all duration-200 btn-sharp">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact Filters Panel */}
              {expandedSections.filters && (
                <div className="bg-black/95 backdrop-blur-xl border-b border-white/20">
                  <div className="p-4 space-y-4">

                    {/* Filter Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                      {/* Region Card */}
                      <div className="bg-black/80 p-4 border border-white/30 hover:border-white/40 transition-all duration-300">
                        <h4 className="text-sm font-krub font-medium text-white mb-3 tracking-wide">REGION</h4>
                        <select
                          value={selectedRegions[0] || ''}
                          onChange={(e) => setSelectedRegions(e.target.value ? [e.target.value] : [])}
                          className="w-full px-3 py-2 text-sm text-white bg-black/90 border border-white/30 hover:border-white/60 focus:border-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200"
                        >
                          <option value="" className="bg-black/80 text-white">All Regions</option>
                          {regions.map(region => (
                            <option key={region} value={region} className="bg-black/80 text-white">{region}</option>
                          ))}
                        </select>
                      </div>

                      {/* Variables Card */}
                      <div className="bg-black/80 p-4 border border-white/30 hover:border-white/40 transition-all duration-300">
                        <h4 className="text-sm font-krub font-medium text-white mb-3 tracking-wide">VARIABLES</h4>
                        <div className="space-y-2 max-h-24 overflow-y-auto custom-scroll-sharp">
                          {Object.entries(variableGroups).map(([group, variables]) => (
                            <div key={group} className="space-y-1">
                              <div className="text-xs font-medium text-white mb-1 uppercase tracking-wider">
                                {group}
                              </div>
                              {variables.map(variable => (
                                <label key={variable} className="flex items-center text-xs text-white/80 hover:text-white cursor-pointer py-0.5 px-1 hover:bg-white/10 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={selectedVariables.includes(variable)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedVariables(prev => [...prev, variable]);
                                      } else {
                                        setSelectedVariables(prev => prev.filter(v => v !== variable));
                                      }
                                    }}
                                    className="mr-2 w-3 h-3 text-white bg-black/50 border-white/30 focus:ring-white/50 focus:ring-1"
                                  />
                                  {variable}
                                </label>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Time Range Card */}
                      <div className="bg-black/80 p-4 border border-white/30 hover:border-white/40 transition-all duration-300">
                        <h4 className="text-sm font-krub font-medium text-white mb-3 tracking-wide">TIME RANGE</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-white block mb-1">From</label>
                            <input
                              type="date"
                              value={timeRange.start}
                              onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                              className="w-full px-3 py-2 text-xs text-white bg-black/90 border border-white/30 hover:border-white/60 focus:border-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-white block mb-1">To</label>
                            <input
                              type="date"
                              value={timeRange.end}
                              onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                              className="w-full px-3 py-2 text-xs text-white bg-black/90 border border-white/30 hover:border-white/60 focus:border-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Depth Range Card */}
                      <div className="bg-black/80 p-4 border border-white/30 hover:border-white/40 transition-all duration-300">
                        <h4 className="text-sm font-krub font-medium text-white mb-3 tracking-wide">DEPTH (M)</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-white block mb-1">Min</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={depthRange.min}
                              onChange={(e) => setDepthRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                              className="w-full px-3 py-2 text-xs text-white bg-black/90 border border-white/30 hover:border-white/60 focus:border-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-white block mb-1">Max</label>
                            <input
                              type="number"
                              placeholder="2000"
                              value={depthRange.max}
                              onChange={(e) => setDepthRange(prev => ({ ...prev, max: parseInt(e.target.value) || 2000 }))}
                              className="w-full px-3 py-2 text-xs text-white bg-black/90 border border-white/30 hover:border-white/60 focus:border-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Filters Summary */}
                    {getActiveFilterChips().length > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-white/20">
                        <div className="flex flex-wrap gap-2">
                          {getActiveFilterChips().map((chip, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-white/10 text-white text-xs font-medium border border-white/20 hover:bg-white/20 transition-all duration-200"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                        <button className="text-xs font-medium text-white/60 hover:text-white px-3 py-1 hover:bg-white/10 transition-all duration-200 border border-white/20 hover:border-white/30/60">
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visualization Area */}
              <div className="flex-1 min-h-0 p-4">
                {isVisualizationLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-white/20 border-t-white animate-spin mx-auto mb-4"></div>
                      <p className="text-white text-sm">Loading visualization...</p>
                    </div>
                  </div>
                ) : currentVizSpec ? (
                  <div className="h-full bg-black/50 border border-white/10 flex items-center justify-center shadow-sharp-inner">
                    <VizRenderer
                      vizSpec={currentVizSpec}
                      onProgress={() => { }}
                      onHover={() => { }}
                      onClick={() => { }}
                      onResearchSummary={setResearchSummary}
                      className="w-full h-full"
                      mode="power"
                    />
                  </div>
                ) : (
                  <div className="h-full bg-black/50 border border-white/10 flex items-center justify-center shadow-sharp-inner">
                    <div className="text-center">
                      <Globe size={48} className="text-white/40 mx-auto mb-4 float-precise" />
                      <h4 className="font-raleway font-medium text-white mb-2">Ready for Analysis</h4>
                      <p className="text-white/60 text-sm">Use the AI assistant or quick actions to start exploring ocean data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 