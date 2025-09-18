'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, X, Globe, ChevronRight } from 'lucide-react'

interface OceanMapOverlayProps {
  data: any[]
  isVisible: boolean
  onClose: () => void
  onLocationSelect?: (lat: number, lon: number) => void
  className?: string
}

export function OceanMapOverlay({ 
  data, 
  isVisible, 
  onClose, 
  onLocationSelect,
  className = '' 
}: OceanMapOverlayProps) {
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number} | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Generate map points from data
  const mapPoints = data?.map((point, index) => ({
    id: point.id || index,
    lat: point.lat || point.latitude,
    lon: point.lon || point.longitude,
    temperature: point.temperature,
    salinity: point.salinity,
    depth: point.depth,
    date: point.date
  })).filter(point => point.lat && point.lon) || []

  if (!isVisible || mapPoints.length === 0) return null

  // Calculate simple bounds
  const lats = mapPoints.map(p => p.lat)
  const lons = mapPoints.map(p => p.lon)
  const bounds = {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lons),
    west: Math.min(...lons)
  }

  return (
    <div 
      className={`fixed top-4 right-4 z-50 w-64 h-40 transition-all duration-300 ${className}`}
      style={{
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Clean Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Globe size={14} className="text-white/80" />
          <span className="text-sm font-medium text-white">Locations</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X size={14} className="text-white/60" />
        </button>
      </div>

      {/* Simplified Map */}
      <div className="relative p-3 h-full">
        <div 
          ref={mapRef}
          className="relative w-full h-full bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded border border-white/10 overflow-hidden"
        >
          {/* Data Points - Simplified */}
          {mapPoints.map((point, index) => {
            const x = ((point.lon - bounds.west) / (bounds.east - bounds.west)) * 100
            const y = ((bounds.north - point.lat) / (bounds.north - bounds.south)) * 100

            // Simple color based on temperature
            const temp = point.temperature
            let pointColor = '#60a5fa'
            if (temp !== undefined) {
              if (temp < 5) pointColor = '#3b82f6'
              else if (temp < 15) pointColor = '#06b6d4'
              else pointColor = '#10b981'
            }

            return (
              <div
                key={point.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `${Math.max(0, Math.min(100, x))}%`,
                  top: `${Math.max(0, Math.min(100, y))}%`
                }}
                onClick={() => {
                  setSelectedLocation({ lat: point.lat, lon: point.lon })
                  onLocationSelect?.(point.lat, point.lon)
                }}
              >
                <div
                  className="w-2 h-2 rounded-full border border-white/60 shadow-sm transition-all duration-200 hover:scale-125"
                  style={{ backgroundColor: pointColor }}
                />
              </div>
            )
          })}
        </div>

        {/* Simple Stats */}
        <div className="mt-2 text-xs text-white/60 text-center">
          {mapPoints.length} data points • {bounds.north.toFixed(1)}°N to {bounds.south.toFixed(1)}°N
        </div>
      </div>
    </div>
  )
}
