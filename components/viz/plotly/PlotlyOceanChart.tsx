'use client'

import React, { useEffect, useRef, useState } from 'react'
import { VizSpec } from '../../../types/actions'
import { loadPlotly, getPlotly, isPlotlyLoaded } from '../../../lib/plotly-loader'

interface PlotlyOceanChartProps {
  vizSpec: VizSpec
  mode?: 'explorer' | 'power'
  className?: string
  onHover?: (data: any) => void
  onClick?: (data: any) => void
  onComplete?: () => void
}

interface OceanProfile {
  id: string
  lat: number
  lon: number
  depth: number
  temperature?: number
  salinity?: number
  pressure?: number
  date: string
}

export function PlotlyOceanChart({ 
  vizSpec, 
  mode = 'explorer',
  className = '',
  onHover,
  onClick,
  onComplete
}: PlotlyOceanChartProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [Plotly, setPlotly] = useState<any>(null)

  // Fast Plotly loading using global loader
  useEffect(() => {
    let mounted = true

    const initializePlotly = async () => {
      try {
        // Check if already loaded
        if (isPlotlyLoaded()) {
          setPlotly(getPlotly())
          return
        }

        // Load Plotly using global loader
        const plotlyInstance = await loadPlotly()
        if (mounted) {
          setPlotly(plotlyInstance)
        }
      } catch (err) {
        console.error('Failed to load Plotly:', err)
        if (mounted) {
          setError('Failed to load Plotly visualization library')
        }
      }
    }

    initializePlotly()

    return () => {
      mounted = false
    }
  }, [])

  // Create chart when Plotly loads and data is available
  useEffect(() => {
    if (!Plotly || !plotRef.current || !vizSpec?.data) return

    createChart()

    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current)
      }
    }
  }, [Plotly, vizSpec])

  const createChart = async () => {
    if (!Plotly || !plotRef.current || !vizSpec?.data) return

    try {
      setIsLoading(true)
      setError(null)

      const profiles: OceanProfile[] = vizSpec.data
      
      if (!profiles.length) {
        setError('No data available for visualization')
        return
      }

      let plotData: any[] = []
      let layout: any = {
        title: {
          text: getChartTitle(),
          font: { color: '#ffffff', size: mode === 'power' ? 18 : 16 }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0.1)',
        font: { color: '#ffffff' },
        margin: { l: 60, r: 40, t: 60, b: 60 },
        showlegend: true,
        legend: {
          font: { color: '#ffffff' },
          bgcolor: 'rgba(0,0,0,0.3)',
          bordercolor: '#ffffff',
          borderwidth: 1
        }
      }

      // Generate appropriate chart based on type and data
      switch (vizSpec.type) {
        case 'map':
          plotData = createMapData(profiles)
          layout = {
            ...layout,
            geo: {
              projection: { type: 'natural earth' },
              showland: true,
              landcolor: 'rgb(217, 217, 217)',
              coastlinecolor: 'rgb(204, 204, 204)',
              showocean: true,
              oceancolor: 'rgb(0, 105, 148)',
              bgcolor: 'rgba(0,0,0,0)'
            }
          }
          break

        case 'plot3d':
          plotData = create3DScatterData(profiles)
          layout = {
            ...layout,
            scene: {
              xaxis: { 
                title: 'Longitude',
                titlefont: { color: '#ffffff' },
                tickfont: { color: '#ffffff' },
                gridcolor: 'rgba(255,255,255,0.2)',
                backgroundcolor: 'rgba(0,0,0,0.1)'
              },
              yaxis: { 
                title: 'Latitude',
                titlefont: { color: '#ffffff' },
                tickfont: { color: '#ffffff' },
                gridcolor: 'rgba(255,255,255,0.2)',
                backgroundcolor: 'rgba(0,0,0,0.1)'
              },
              zaxis: { 
                title: 'Depth (m)',
                titlefont: { color: '#ffffff' },
                tickfont: { color: '#ffffff' },
                gridcolor: 'rgba(255,255,255,0.2)',
                backgroundcolor: 'rgba(0,0,0,0.1)'
              },
              bgcolor: 'rgba(0,0,0,0)',
              camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
              }
            }
          }
          break

        case 'heatmap':
          plotData = createHeatmapData(profiles)
          layout = {
            ...layout,
            xaxis: { 
              title: 'Longitude',
              titlefont: { color: '#ffffff' },
              tickfont: { color: '#ffffff' },
              gridcolor: 'rgba(255,255,255,0.2)'
            },
            yaxis: { 
              title: 'Latitude',
              titlefont: { color: '#ffffff' },
              tickfont: { color: '#ffffff' },
              gridcolor: 'rgba(255,255,255,0.2)'
            }
          }
          break

        default: // 'chart' - scatter plot
          plotData = createScatterData(profiles)
          layout = {
            ...layout,
            xaxis: { 
              title: getXAxisLabel(),
              titlefont: { color: '#ffffff' },
              tickfont: { color: '#ffffff' },
              gridcolor: 'rgba(255,255,255,0.2)'
            },
            yaxis: { 
              title: getYAxisLabel(),
              titlefont: { color: '#ffffff' },
              tickfont: { color: '#ffffff' },
              gridcolor: 'rgba(255,255,255,0.2)'
            }
          }
      }

      const config = {
        responsive: true,
        displayModeBar: mode === 'power',
        modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
        toImageButtonOptions: {
          format: 'png',
          filename: 'ocean_data_chart',
          height: 600,
          width: 800,
          scale: 1
        }
      }

      await Plotly.newPlot(plotRef.current, plotData, layout, config)

      // Add event listeners using Plotly's event system
      if (onHover && plotRef.current) {
        (plotRef.current as any).on('plotly_hover', (data: any) => {
          const point = data.points[0]
          onHover({
            x: point.x,
            y: point.y,
            z: point.z,
            text: point.text,
            index: point.pointIndex
          })
        })
      }

      if (onClick && plotRef.current) {
        (plotRef.current as any).on('plotly_click', (data: any) => {
          const point = data.points[0]
          onClick({
            x: point.x,
            y: point.y,
            z: point.z,
            text: point.text,
            index: point.pointIndex
          })
        })
      }

      setIsLoading(false)
      console.log(`✅ Created ${vizSpec.type} chart with ${profiles.length} data points`)
      
      // Notify parent that visualization is complete
      if (onComplete) {
        onComplete()
      }

    } catch (err) {
      console.error('Failed to create Plotly chart:', err)
      setError('Failed to create chart visualization')
      setIsLoading(false)
    }
  }

  const createMapData = (profiles: OceanProfile[]) => {
    const validProfiles = profiles.filter(p => p.lat && p.lon)
    
    return [{
      type: 'scattergeo',
      mode: 'markers',
      lat: validProfiles.map(p => p.lat),
      lon: validProfiles.map(p => p.lon),
      text: validProfiles.map(p => 
        `ID: ${p.id}<br/>` +
        `Lat: ${p.lat.toFixed(2)}°<br/>` +
        `Lon: ${p.lon.toFixed(2)}°<br/>` +
        `Depth: ${p.depth}m<br/>` +
        (p.temperature ? `Temp: ${p.temperature.toFixed(1)}°C<br/>` : '') +
        (p.salinity ? `Salinity: ${p.salinity.toFixed(1)} PSU` : '')
      ),
      marker: {
        size: validProfiles.map(p => Math.max(4, 12 - (p.depth || 0) * 0.002)),
        color: validProfiles.map(p => p.temperature || 15),
        colorscale: 'Viridis',
        cmin: Math.min(...validProfiles.map(p => p.temperature || 15)),
        cmax: Math.max(...validProfiles.map(p => p.temperature || 15)),
        colorbar: {
          title: 'Temperature (°C)',
          titlefont: { color: '#ffffff' },
          tickfont: { color: '#ffffff' }
        },
        opacity: 0.8,
        line: { color: 'white', width: 1 }
      },
      name: 'Ocean Profiles'
    }]
  }

  const create3DScatterData = (profiles: OceanProfile[]) => {
    return [{
      type: 'scatter3d',
      mode: 'markers',
      x: profiles.map(p => p.lon),
      y: profiles.map(p => p.lat),
      z: profiles.map(p => -(p.depth || 0)), // Negative for underwater
      text: profiles.map(p => 
        `ID: ${p.id}<br/>` +
        `Lat: ${p.lat.toFixed(2)}°<br/>` +
        `Lon: ${p.lon.toFixed(2)}°<br/>` +
        `Depth: ${p.depth}m<br/>` +
        (p.temperature ? `Temp: ${p.temperature.toFixed(1)}°C<br/>` : '') +
        (p.salinity ? `Salinity: ${p.salinity.toFixed(1)} PSU` : '')
      ),
      marker: {
        size: profiles.map(p => Math.max(2, 6 - (p.depth || 0) * 0.001)),
        color: profiles.map(p => p.temperature || 15),
        colorscale: 'Viridis',
        colorbar: {
          title: 'Temperature (°C)',
          titlefont: { color: '#ffffff' },
          tickfont: { color: '#ffffff' }
        },
        opacity: 0.8
      },
      name: '3D Ocean Data'
    }]
  }

  const createScatterData = (profiles: OceanProfile[]) => {
    const tempProfiles = profiles.filter(p => p.temperature !== undefined && p.salinity !== undefined)
    
    return [{
      type: 'scatter',
      mode: 'markers',
      x: tempProfiles.map(p => p.temperature),
      y: tempProfiles.map(p => p.salinity),
      text: tempProfiles.map(p => 
        `ID: ${p.id}<br/>` +
        `Temp: ${p.temperature?.toFixed(1)}°C<br/>` +
        `Salinity: ${p.salinity?.toFixed(1)} PSU<br/>` +
        `Depth: ${p.depth}m`
      ),
      marker: {
        size: tempProfiles.map(p => Math.max(4, 12 - (p.depth || 0) * 0.002)),
        color: tempProfiles.map(p => p.depth || 0),
        colorscale: 'Blues',
        colorbar: {
          title: 'Depth (m)',
          titlefont: { color: '#ffffff' },
          tickfont: { color: '#ffffff' }
        },
        opacity: 0.7,
        line: { color: 'white', width: 1 }
      },
      name: 'T-S Diagram'
    }]
  }

  const createHeatmapData = (profiles: OceanProfile[]) => {
    // Create a simple heatmap by binning lat/lon data
    const latBins = 20
    const lonBins = 20
    
    const latMin = Math.min(...profiles.map(p => p.lat))
    const latMax = Math.max(...profiles.map(p => p.lat))
    const lonMin = Math.min(...profiles.map(p => p.lon))
    const lonMax = Math.max(...profiles.map(p => p.lon))
    
    const latStep = (latMax - latMin) / latBins
    const lonStep = (lonMax - lonMin) / lonBins
    
    const heatmapData = Array(latBins).fill(null).map(() => Array(lonBins).fill(0))
    const counts = Array(latBins).fill(null).map(() => Array(lonBins).fill(0))
    
    profiles.forEach(profile => {
      if (profile.temperature === undefined) return
      
      const latBin = Math.min(latBins - 1, Math.floor((profile.lat - latMin) / latStep))
      const lonBin = Math.min(lonBins - 1, Math.floor((profile.lon - lonMin) / lonStep))
      
      heatmapData[latBin][lonBin] += profile.temperature
      counts[latBin][lonBin]++
    })
    
    // Average the temperatures
    for (let i = 0; i < latBins; i++) {
      for (let j = 0; j < lonBins; j++) {
        if (counts[i][j] > 0) {
          heatmapData[i][j] /= counts[i][j]
        }
      }
    }
    
    return [{
      type: 'heatmap',
      z: heatmapData,
      x: Array(lonBins).fill(0).map((_, i) => lonMin + (i + 0.5) * lonStep),
      y: Array(latBins).fill(0).map((_, i) => latMin + (i + 0.5) * latStep),
      colorscale: 'Viridis',
      colorbar: {
        title: 'Average Temperature (°C)',
        titlefont: { color: '#ffffff' },
        tickfont: { color: '#ffffff' }
      }
    }]
  }

  const getChartTitle = () => {
    const profileCount = Array.isArray(vizSpec.data) ? vizSpec.data.length : 0
    const baseTitle = vizSpec.config?.title || 'Ocean Data Analysis'
    return `${baseTitle} (${profileCount.toLocaleString()} profiles)`
  }

  const getXAxisLabel = () => {
    switch (vizSpec.type) {
      case 'plot3d': return 'Longitude'
      case 'heatmap': return 'Longitude'
      default: return 'Temperature (°C)'
    }
  }

  const getYAxisLabel = () => {
    switch (vizSpec.type) {
      case 'plot3d': return 'Latitude'
      case 'heatmap': return 'Latitude'
      default: return 'Salinity (PSU)'
    }
  }

  if (error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-red-900/20 ${className}`}>
        <div className="text-center p-6">
          <div className="text-red-400 text-lg mb-2">Chart Error</div>
          <div className="text-red-300 text-sm">{error}</div>
          <div className="text-gray-400 text-xs mt-2">
            {vizSpec?.fallbackText || 'Unable to render chart'}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !Plotly) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-900/20 ${className}`}>
        <div className="text-center p-6">
          <div className="animate-spin h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading Chart</div>
          <div className="text-gray-300 text-sm">Initializing Plotly visualization...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={plotRef} className="w-full h-full" />
      
      {/* Fallback text for accessibility */}
      {vizSpec?.fallbackText && (
        <div className="sr-only">{vizSpec.fallbackText}</div>
      )}
    </div>
  )
}
