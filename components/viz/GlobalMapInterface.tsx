'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Navigation, Globe, Target } from 'lucide-react'

interface GlobalMapInterfaceProps {
  data: any[]
  onLocationSelect: (lat: number, lon: number, point: any) => void
  selectedLocation?: { lat: number, lon: number }
  className?: string
}

interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

interface MapView {
  center: { lat: number, lon: number }
  zoom: number
}

export function GlobalMapInterface({ 
  data, 
  onLocationSelect, 
  selectedLocation,
  className = '' 
}: GlobalMapInterfaceProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapView, setMapView] = useState<MapView>({ center: { lat: 0, lon: 0 }, zoom: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)

  // Calculate map bounds and initial view
  useEffect(() => {
    if (data && data.length > 0) {
      const lats = data.map(d => d.lat || d.latitude).filter(Boolean)
      const lons = data.map(d => d.lon || d.longitude).filter(Boolean)
      
      if (lats.length > 0 && lons.length > 0) {
        const bounds = {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lons),
          west: Math.min(...lons)
        }
        
        // Add more padding to prevent overflow
        const latPadding = Math.max((bounds.north - bounds.south) * 0.3, 1.0) // At least 1 degree padding
        const lonPadding = Math.max((bounds.east - bounds.west) * 0.3, 1.0) // At least 1 degree padding
        
        const paddedBounds = {
          north: Math.min(bounds.north + latPadding, 90),
          south: Math.max(bounds.south - latPadding, -90),
          east: Math.min(bounds.east + lonPadding, 180),
          west: Math.max(bounds.west - lonPadding, -180)
        }
        
        setMapBounds(paddedBounds)
        
        // Set initial view to center of data
        const centerLat = (bounds.north + bounds.south) / 2
        const centerLon = (bounds.east + bounds.west) / 2
        setMapView({ center: { lat: centerLat, lon: centerLon }, zoom: 2 })
      }
    }
  }, [data])

  // Convert lat/lon to pixel coordinates with proper bounds checking
  const latLonToPixel = useCallback((lat: number, lon: number) => {
    if (!mapRef.current || !mapBounds) return { x: 0, y: 0 }
    
    const rect = mapRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    // Calculate normalized coordinates (0-1) with proper bounds checking
    const normalizedX = Math.max(0, Math.min(1, (lon - mapBounds.west) / (mapBounds.east - mapBounds.west)))
    const normalizedY = Math.max(0, Math.min(1, (mapBounds.north - lat) / (mapBounds.north - mapBounds.south)))
    
    // Convert to pixel coordinates with larger padding to prevent overflow
    const padding = 30 // Increased padding to 30px from edges
    const availableWidth = width - (2 * padding)
    const availableHeight = height - (2 * padding)
    
    const x = padding + (normalizedX * availableWidth)
    const y = padding + (normalizedY * availableHeight)
    
    // Final bounds check to ensure points stay within container
    return { 
      x: Math.max(padding, Math.min(width - padding, x)), 
      y: Math.max(padding, Math.min(height - padding, y)) 
    }
  }, [mapBounds])

  // Handle map interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the map background, not on points
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('map-background')) {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !mapBounds || !mapRef.current) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    // Calculate movement sensitivity based on zoom level
    const sensitivity = 0.5 / mapView.zoom
    const lonDelta = (deltaX / mapRef.current.offsetWidth) * (mapBounds.east - mapBounds.west) * sensitivity
    const latDelta = (deltaY / mapRef.current.offsetHeight) * (mapBounds.north - mapBounds.south) * sensitivity
    
    setMapView(prev => ({
      center: {
        lat: Math.max(-90, Math.min(90, prev.center.lat - latDelta)),
        lon: Math.max(-180, Math.min(180, prev.center.lon + lonDelta))
      },
      zoom: prev.zoom
    }))
    
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoom = (direction: 'in' | 'out') => {
    setMapView(prev => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(5, prev.zoom + (direction === 'in' ? 0.5 : -0.5)))
    }))
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // More sensitive zoom with smaller increments
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1
    setMapView(prev => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(5, prev.zoom + zoomFactor))
    }))
  }

  const resetView = () => {
    if (mapBounds) {
      const centerLat = (mapBounds.north + mapBounds.south) / 2
      const centerLon = (mapBounds.east + mapBounds.west) / 2
      setMapView({ center: { lat: centerLat, lon: centerLon }, zoom: 2 })
    }
  }

  const handlePointClick = (point: any) => {
    onLocationSelect(point.lat, point.lon, point)
  }

  // Generate map points
  const mapPoints = data?.map((point, index) => ({
    id: point.id || index,
    lat: point.lat || point.latitude,
    lon: point.lon || point.longitude,
    temperature: point.temperature,
    salinity: point.salinity,
    depth: point.depth,
    date: point.date,
    ...point
  })).filter(point => point.lat && point.lon) || []

  if (!mapPoints.length) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Globe size={48} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm">No geographic data</div>
          <div className="text-white/40 text-xs mt-1">Map will appear when data contains coordinates</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-gray-900/95 ${className}`}>
      {/* Modern Map Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Globe size={16} className="text-white/80" />
            <span className="text-sm font-medium text-white">Global Data Map</span>
          </div>
          <div className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
            {mapPoints.length} locations
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleZoom('out')}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} className="text-white/60" />
          </button>
          <button
            onClick={() => handleZoom('in')}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} className="text-white/60" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Reset View"
          >
            <RotateCcw size={14} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Temperature Scale Legend - Above Map */}
      <div className="px-4 py-2 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div className="text-xs text-white font-medium mb-2">Temperature Scale</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-white/80">Cold (&lt; 0°C)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-cyan-500 rounded-full" />
            <span className="text-white/80">Cool (0-5°C)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-white/80">Warm (5-15°C)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-white/80">Hot (15-25°C)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-white/80">Very Hot (&gt; 25°C)</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={mapRef}
          className={`w-full h-full relative overflow-hidden transition-all duration-200 ${
            isDragging 
              ? 'cursor-grabbing select-none' 
              : 'cursor-grab hover:bg-gray-900/5'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
              linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
            `,
            backgroundSize: '100% 100%, 100% 100%, 100% 100%'
          }}
        >
          {/* Map Background for Drag Detection */}
          <div className="absolute inset-0 map-background" />
          
          {/* World Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Latitude lines */}
              {Array.from({ length: 9 }, (_, i) => {
                const lat = -80 + (i * 20)
                const y = ((90 - lat) / 180) * 100
                return (
                  <line
                    key={`lat-${i}`}
                    x1="0"
                    y1={`${y}%`}
                    x2="100%"
                    y2={`${y}%`}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />
                )
              })}
              {/* Longitude lines */}
              {Array.from({ length: 13 }, (_, i) => {
                const lon = -180 + (i * 30)
                const x = ((lon + 180) / 360) * 100
                return (
                  <line
                    key={`lon-${i}`}
                    x1={`${x}%`}
                    y1="0"
                    x2={`${x}%`}
                    y2="100%"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />
                )
              })}
            </svg>
          </div>

          {/* Data Points Container */}
          <div className="absolute inset-0 overflow-hidden">
            {mapPoints.map((point, index) => {
            const pixel = latLonToPixel(point.lat, point.lon)
            const isSelected = selectedLocation && 
              Math.abs(selectedLocation.lat - point.lat) < 0.1 && 
              Math.abs(selectedLocation.lon - point.lon) < 0.1

            // Temperature-based color
            const temp = point.temperature
            let pointColor = '#60a5fa'
            if (temp !== undefined) {
              if (temp < 0) pointColor = '#3b82f6'      // Cold blue
              else if (temp < 5) pointColor = '#06b6d4' // Cool cyan
              else if (temp < 15) pointColor = '#10b981' // Warm green
              else if (temp < 25) pointColor = '#f59e0b' // Hot orange
              else pointColor = '#ef4444'               // Very hot red
            }

            return (
              <div
                key={point.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${Math.max(30, Math.min(pixel.x, (mapRef.current?.offsetWidth || 400) - 30))}px`,
                  top: `${Math.max(30, Math.min(pixel.y, (mapRef.current?.offsetHeight || 300) - 30))}px`,
                  zIndex: isSelected ? 20 : 10
                }}
                onClick={() => handlePointClick(point)}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Point with modern styling */}
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:scale-125 ${
                    isSelected 
                      ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' 
                      : 'border-white/60 shadow-sm'
                  }`}
                  style={{ 
                    backgroundColor: pointColor,
                    boxShadow: isSelected ? `0 0 20px ${pointColor}80` : undefined
                  }}
                />
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute inset-0 w-6 h-6 -translate-x-1 -translate-y-1 border-2 border-yellow-400 rounded-full animate-ping" />
                )}
              </div>
            )
          })}
          </div>

          {/* Hovered Point Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none z-30"
              style={{
                left: `${latLonToPixel(hoveredPoint.lat, hoveredPoint.lon).x + 20}px`,
                top: `${latLonToPixel(hoveredPoint.lat, hoveredPoint.lon).y - 10}px`
              }}
            >
              <div className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg border border-white/20 shadow-xl">
                <div className="font-medium mb-1">
                  {hoveredPoint.lat.toFixed(3)}°, {hoveredPoint.lon.toFixed(3)}°
                </div>
                {hoveredPoint.temperature && (
                  <div className="text-white/80">Temperature: {hoveredPoint.temperature.toFixed(1)}°C</div>
                )}
                {hoveredPoint.depth && (
                  <div className="text-white/80">Depth: {hoveredPoint.depth.toFixed(0)}m</div>
                )}
                {hoveredPoint.salinity && (
                  <div className="text-white/80">Salinity: {hoveredPoint.salinity.toFixed(2)} ppt</div>
                )}
                <div className="text-white/60 text-xs mt-1">Click to focus</div>
              </div>
            </div>
          )}


          {/* Instructions */}
          <div className="absolute top-4 right-4 bg-black/80 text-white text-xs px-3 py-2 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2">
              <Navigation size={14} />
              <span>{isDragging ? 'Dragging...' : 'Drag to pan • Click points to focus'}</span>
            </div>
          </div>

          {/* Drag Indicator */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-center justify-center">
              <div className="bg-black/80 text-white text-sm px-4 py-2 rounded-lg border border-blue-400/50">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Panning map...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
