'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Target } from 'lucide-react'
import { VizSpec } from '../../types/actions'
import { loadThree, getThree, isThreeLoaded } from '../../lib/three-loader'
import { GlobalMapInterface } from './GlobalMapInterface'

interface VisualizationOrchestratorProps {
  vizSpec: VizSpec
  mode?: 'explorer' | 'power'
  className?: string
  onHover?: (data: any) => void
  onClick?: (data: any) => void
  onComplete?: () => void
  onResearchSummary?: (summary: any) => void
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
  [key: string]: any // For additional properties
}

interface DatasetValidation {
  isValid: boolean
  errorMessage?: string
  axisCount: number
  numericAxes: string[]
  hasDepth: boolean
  hasSpatial: boolean
  hasTemporal: boolean
  dataQuality: 'excellent' | 'good' | 'poor' | 'invalid'
  pointCount: number
  hasValidGeometry: boolean
  renderable: boolean
}

interface ResearchMetrics {
  variable: string
  min: number
  max: number
  mean: number
  std: number
  unit: string
  count: number
}

interface VisualizationSummary {
  type: string
  dataQuality: string
  metrics: ResearchMetrics[]
  spatialBounds: {
    lat: { min: number; max: number }
    lon: { min: number; max: number }
    depth: { min: number; max: number }
  }
  temporalRange?: {
    start: string
    end: string
  }
}

interface TrajectoryPoint {
  lat: number
  lon: number
  depth: number
  timestamp: string
  [key: string]: any
}

interface RegionalData {
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  values: Array<{
    lat: number
    lon: number
    value: number
    depth?: number
  }>
}

export function VisualizationOrchestrator({ 
  vizSpec, 
  mode = 'explorer',
  className = '',
  onHover,
  onClick,
  onComplete,
  onResearchSummary
}: VisualizationOrchestratorProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>()
  const rendererRef = useRef<any>()
  const cameraRef = useRef<any>()
  const controlsRef = useRef<any>()
  const raycasterRef = useRef<any>()
  const animationIdRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  const hoveredObjectRef = useRef<any>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [THREE, setTHREE] = useState<any>(null)
  const [visualizationType, setVisualizationType] = useState<string>('')
  const [dataStats, setDataStats] = useState<any>(null)
  const [hoveredData, setHoveredData] = useState<any>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const [validationResult, setValidationResult] = useState<DatasetValidation | null>(null)
  const [researchSummary, setResearchSummary] = useState<VisualizationSummary | null>(null)
  const [isProgressiveRendering, setIsProgressiveRendering] = useState(false)
  const [renderTaskId, setRenderTaskId] = useState<string | null>(null)
  const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout | null>(null)
  const [fallbackMode, setFallbackMode] = useState<'3d' | '2d' | 'static'>('3d')
  const [isRendering, setIsRendering] = useState(false)
  
  // Map overlay state
  const [showMap, setShowMap] = useState(false)
  const [mapData, setMapData] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number} | undefined>(undefined)
  const [filteredData, setFilteredData] = useState<any[]>([])


  // Load Three.js
  useEffect(() => {
    let mounted = true

    const initializeThree = async () => {
      try {
        if (isThreeLoaded()) {
          setTHREE(getThree())
          return
        }

        const threeInstance = await loadThree()
        if (mounted) {
          setTHREE(threeInstance)
        }
      } catch (err) {
        console.error('Failed to load Three.js:', err)
        if (mounted) {
          setError('Failed to load Three.js visualization library')
        }
      }
    }

    initializeThree()

    return () => {
      mounted = false
    }
  }, [])

  // FloatChat Ocean MCP Validation Engine - Strict Geometry Validation
  const validateDataset = useCallback((data: any): DatasetValidation => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        isValid: false,
        errorMessage: 'FloatChat Error: No data available. Please refine query to include ocean measurements.',
        axisCount: 0,
        numericAxes: [],
        hasDepth: false,
        hasSpatial: false,
        hasTemporal: false,
        dataQuality: 'invalid',
        pointCount: 0,
        hasValidGeometry: false,
        renderable: false
      }
    }

    const pointCount = data.length
    console.log(`🔍 FloatChat Validation: Checking ${pointCount} datapoints`)

    // CRITICAL RULE: Require at least 10 datapoints (reduced from 20 for better UX)
    if (pointCount < 10) {
      return {
        isValid: false,
        errorMessage: `FloatChat Error: Insufficient data points (${pointCount}/10). Please refine query to include more ocean measurements.`,
        axisCount: 0,
        numericAxes: [],
        hasDepth: false,
        hasSpatial: false,
        hasTemporal: false,
        dataQuality: 'invalid',
        pointCount,
        hasValidGeometry: false,
        renderable: false
      }
    }

    // Analyze data structure
    const sample = data[0]
    const numericAxes: string[] = []
    let hasDepth = false
    let hasSpatial = false
    let hasTemporal = false
    let hasValidGeometry = true

    // Check for required numeric axes
    Object.keys(sample).forEach(key => {
      const value = sample[key]
      if (typeof value === 'number' && !isNaN(value)) {
        numericAxes.push(key)
        
        if (key === 'depth') hasDepth = true
        if (key === 'lat' || key === 'lon') hasSpatial = true
        if (key === 'temperature' || key === 'salinity' || key === 'pressure') hasDepth = true
      }
    })

    // Debug: Log what we found
    console.log('🔍 FloatChat Validation - Sample data analysis:', {
      sampleKeys: Object.keys(sample),
      sampleValues: Object.entries(sample).map(([k, v]) => [k, v, typeof v, isNaN(v as number)]),
      numericAxes,
      hasDepth,
      hasSpatial,
      hasTemporal,
      sampleData: sample
    })
    
    // Additional debugging for data structure
    console.log('🔍 FloatChat Validation - Data structure check:', {
      lat: sample.lat,
      lon: sample.lon,
      depth: sample.depth,
      temperature: sample.temperature,
      salinity: sample.salinity,
      latType: typeof sample.lat,
      lonType: typeof sample.lon,
      depthType: typeof sample.depth
    })

    // Check for temporal data
    hasTemporal = data.some((point: any) => 
      point.timestamp || point.time || point.date
    )

    // CRITICAL RULE: Validate geometry - require valid lat, lon, depth
    const validPoints = data.filter((point: any) => {
      const hasValidLat = typeof point.lat === 'number' && !isNaN(point.lat) && point.lat >= -90 && point.lat <= 90
      const hasValidLon = typeof point.lon === 'number' && !isNaN(point.lon) && point.lon >= -180 && point.lon <= 180
      const hasValidDepth = typeof point.depth === 'number' && !isNaN(point.depth) && point.depth >= 0
      return hasValidLat && hasValidLon && hasValidDepth
    })

    if (validPoints.length < 10) {
      hasValidGeometry = false
    }

    const axisCount = numericAxes.length
    let dataQuality: 'excellent' | 'good' | 'poor' | 'invalid' = 'invalid'
    let errorMessage: string | undefined
    let renderable = true

    // Validation rules - STRICT but with better error messages
    if (axisCount < 2) {
      errorMessage = `FloatChat Error: Insufficient numeric data (${axisCount}/2). Found: ${numericAxes.join(', ')}. Please refine query to include at least 2 measurement variables.`
      dataQuality = 'invalid'
      renderable = false
    } else if (!hasValidGeometry) {
      errorMessage = 'FloatChat Error: Invalid geometry. Please refine query to include valid lat/lon/depth coordinates.'
      dataQuality = 'invalid'
      renderable = false
    } else if (!hasSpatial) {
      errorMessage = 'FloatChat Error: Missing spatial coordinates. Please refine query to include lat/lon data.'
      dataQuality = 'invalid'
      renderable = false
    } else if (!hasDepth) {
      errorMessage = 'FloatChat Error: Missing depth axis. Please refine query to include depth profile data.'
      dataQuality = 'invalid'
      renderable = false
    } else {
      // Determine data quality - more lenient for smaller datasets
      if (pointCount >= 1000 && hasDepth && hasSpatial && hasTemporal) {
        dataQuality = 'excellent'
      } else if (pointCount >= 50 && hasDepth && hasSpatial) {
        dataQuality = 'good'
      } else if (pointCount >= 10 && hasDepth && hasSpatial) {
        dataQuality = 'good' // Changed from 'poor' to 'good' for 10+ points
      } else {
        dataQuality = 'poor'
      }
    }

    console.log(`✅ FloatChat Validation: ${renderable ? 'PASSED' : 'FAILED'}`, {
      points: pointCount,
      validPoints: validPoints.length,
      geometry: hasValidGeometry,
      spatial: hasSpatial,
      depth: hasDepth,
      quality: dataQuality
    })

    return {
      isValid: !errorMessage,
      errorMessage,
      axisCount,
      numericAxes,
      hasDepth,
      hasSpatial,
      hasTemporal,
      dataQuality,
      pointCount,
      hasValidGeometry,
      renderable
    }
  }, [])

  // Calculate research-grade metrics
  const calculateResearchMetrics = useCallback((data: any[], validation: DatasetValidation): ResearchMetrics[] => {
    if (!validation.isValid || data.length === 0) return []

    const metrics: ResearchMetrics[] = []
    const units: Record<string, string> = {
      temperature: '°C',
      salinity: 'PSU',
      pressure: 'dbar',
      depth: 'm',
      lat: '°N',
      lon: '°E'
    }

    validation.numericAxes.forEach(variable => {
      const values = data.map(point => point[variable]).filter(v => typeof v === 'number' && !isNaN(v))
      
      if (values.length > 0) {
        const min = Math.min(...values)
        const max = Math.max(...values)
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        const std = Math.sqrt(variance)

        metrics.push({
          variable,
          min: Number(min.toFixed(3)),
          max: Number(max.toFixed(3)),
          mean: Number(mean.toFixed(3)),
          std: Number(std.toFixed(3)),
          unit: units[variable] || '',
          count: values.length
        })
      }
    })

    return metrics
  }, [])

  // Detect visualization type from validated data
  const detectVisualizationType = useCallback((data: any, vizSpec: VizSpec, validation: DatasetValidation) => {
    if (!validation.isValid) return 'fallback'
    
    // Profile data (temp/salinity vs. depth) → 3D scatter plot
    if (validation.hasDepth && (data.some((p: any) => p.temperature) || data.some((p: any) => p.salinity))) {
      return 'profiles'
    }
    
    // Spatiotemporal data → 3D point cloud
    if (validation.hasSpatial && validation.hasTemporal && data.length > 20) {
      return 'trajectory'
    }
    
    // Multi-variable comparison → 3D scatter with color mapping
    if (validation.axisCount >= 3 && validation.hasSpatial) {
      return 'comparison'
    }
    
    // Regional data
    if (data.some((p: any) => p.bounds || (p.lat && p.lon && p.value))) {
      return 'regional'
    }
    
    return 'profiles' // Default to 3D scatter
  }, [])

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!mountRef.current || !THREE) return

    try {
      const container = mountRef.current
      const width = container.clientWidth
      const height = container.clientHeight

      // Scene setup with professional theme
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000000) // Professional black
      sceneRef.current = scene

      // Camera setup with better initial positioning
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
      camera.position.set(40, 30, 40)
      camera.lookAt(0, 0, 0)
      cameraRef.current = camera

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: mode === 'power' ? 'high-performance' : 'default'
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      rendererRef.current = renderer

      container.appendChild(renderer.domElement)

      // Lighting setup - professional theme
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(50, 50, 50)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      scene.add(directionalLight)

      const pointLight = new THREE.PointLight(0xffffff, 0.4, 100)
      pointLight.position.set(-30, 20, -30)
      scene.add(pointLight)

      // Add ocean surface reference
      const oceanGeometry = new THREE.PlaneGeometry(100, 100, 32, 32)
      const oceanMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.3,
        wireframe: false,
        side: THREE.DoubleSide
      })
      const oceanSurface = new THREE.Mesh(oceanGeometry, oceanMaterial)
      oceanSurface.rotation.x = -Math.PI / 2
      oceanSurface.position.y = 0
      oceanSurface.receiveShadow = true
      scene.add(oceanSurface)

      // Add depth reference planes
      for (let depth = 500; depth <= 2000; depth += 500) {
        const depthPlane = new THREE.PlaneGeometry(80, 80)
        const depthMaterial = new THREE.MeshBasicMaterial({
          color: 0x444444,
          transparent: true,
          opacity: 0.15,
          wireframe: true
        })
        const depthMesh = new THREE.Mesh(depthPlane, depthMaterial)
        depthMesh.rotation.x = -Math.PI / 2
        depthMesh.position.y = -depth * 0.01
        scene.add(depthMesh)
      }

      // Add coordinate axes with labels
      const axesHelper = new THREE.AxesHelper(15)
      scene.add(axesHelper)

      // Add main grid for spatial reference
      const gridHelper = new THREE.GridHelper(60, 30, 0x444444, 0x222222)
      gridHelper.position.y = -0.1
      scene.add(gridHelper)

      // Add depth reference planes with labels
      for (let depth = 0; depth <= 2000; depth += 500) {
        const depthGrid = new THREE.GridHelper(50, 15, 0x444444, 0x222222)
        depthGrid.position.y = -depth * 0.01
        depthGrid.rotation.x = -Math.PI / 2
        scene.add(depthGrid)
        
        // Add depth labels
        const depthLabel = new THREE.SphereGeometry(0.2, 8, 6)
        const depthLabelMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.8
        })
        const depthMarker = new THREE.Mesh(depthLabel, depthLabelMaterial)
        depthMarker.position.set(25, -depth * 0.01, 25)
        depthMarker.userData = { label: `${depth}m`, type: 'depth-marker' }
        scene.add(depthMarker)
      }

      // Add cardinal direction markers
      const directions = [
        { name: 'N', position: [0, 0, 30], color: 0xffffff },
        { name: 'S', position: [0, 0, -30], color: 0xffffff },
        { name: 'E', position: [30, 0, 0], color: 0xffffff },
        { name: 'W', position: [-30, 0, 0], color: 0xffffff }
      ]

      directions.forEach(dir => {
        const markerGeometry = new THREE.SphereGeometry(0.3, 8, 6)
        const markerMaterial = new THREE.MeshBasicMaterial({ 
          color: dir.color,
          transparent: true,
          opacity: 0.8
        })
        const marker = new THREE.Mesh(markerGeometry, markerMaterial)
        marker.position.set(dir.position[0], dir.position[1], dir.position[2])
        marker.userData = { label: dir.name, type: 'direction-marker' }
        scene.add(marker)
      })

      // Raycaster for interactions
      raycasterRef.current = new THREE.Raycaster()

      // Mouse controls
      let isDragging = false
      let previousMousePosition = { x: 0, y: 0 }

      const onMouseDown = (event: MouseEvent) => {
        isDragging = true
        previousMousePosition = { x: event.clientX, y: event.clientY }
      }

      const onMouseMove = (event: MouseEvent) => {
        if (!cameraRef.current) return

        mouseRef.current = {
          x: (event.clientX / width) * 2 - 1,
          y: -(event.clientY / height) * 2 + 1
        }

        if (isDragging) {
          const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
          }

          // Improved camera controls with smoother rotation
          const spherical = new THREE.Spherical()
          spherical.setFromVector3(cameraRef.current.position)
          spherical.theta -= deltaMove.x * 0.005 // Reduced sensitivity
          spherical.phi += deltaMove.y * 0.005 // Reduced sensitivity
          spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

          cameraRef.current.position.setFromSpherical(spherical)
          cameraRef.current.lookAt(0, 0, 0)

          previousMousePosition = { x: event.clientX, y: event.clientY }
        }

        // Hover detection with tooltip
        if (raycasterRef.current && sceneRef.current) {
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
          const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true)
          
          if (intersects.length > 0) {
            const object = intersects[0].object
            const data = object.userData?.profile || object.userData?.point || object.userData?.data
            
            if (data) {
              setHoveredData(data)
              setTooltipPosition({ x: event.clientX, y: event.clientY })
              setShowTooltip(true)
              
              if (onHover) {
                onHover(data)
              }
            }
            
            if (hoveredObjectRef.current !== object) {
              // Reset previous hover effect
              if (hoveredObjectRef.current && hoveredObjectRef.current.material) {
                hoveredObjectRef.current.material.emissive = new THREE.Color(0x000000)
              }
              
              hoveredObjectRef.current = object
              // Add hover effect
              if (object.material) {
                object.material.emissive = new THREE.Color(0x444444)
              }
            }
          } else {
            if (hoveredObjectRef.current && hoveredObjectRef.current.material) {
              hoveredObjectRef.current.material.emissive = new THREE.Color(0x000000)
            }
            hoveredObjectRef.current = null
            setShowTooltip(false)
            setHoveredData(null)
          }
        }
      }

      const onMouseUp = () => {
        isDragging = false
      }

      const onWheel = (event: WheelEvent) => {
        if (!cameraRef.current) return
        
        const distance = cameraRef.current.position.distanceTo(new THREE.Vector3(0, 0, 0))
        const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9
        const newDistance = Math.max(15, Math.min(150, distance * zoomFactor))
        
        cameraRef.current.position.normalize().multiplyScalar(newDistance)
      }

      // Add keyboard controls for better navigation
      const onKeyDown = (event: KeyboardEvent) => {
        if (!cameraRef.current) return
        
        const moveSpeed = 5
        const position = cameraRef.current.position.clone()
        
        switch (event.key.toLowerCase()) {
          case 'r': // Reset view
            cameraRef.current.position.set(40, 30, 40)
            cameraRef.current.lookAt(0, 0, 0)
            break
          case 'arrowup':
            position.y += moveSpeed
            cameraRef.current.position.copy(position)
            break
          case 'arrowdown':
            position.y -= moveSpeed
            cameraRef.current.position.copy(position)
            break
          case 'arrowleft':
            position.x -= moveSpeed
            cameraRef.current.position.copy(position)
            break
          case 'arrowright':
            position.x += moveSpeed
            cameraRef.current.position.copy(position)
            break
        }
      }

      const onClickHandler = (event: MouseEvent) => {
        if (raycasterRef.current && sceneRef.current && onClick) {
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
          const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true)
          
          if (intersects.length > 0) {
            const object = intersects[0].object
            if (object.userData && object.userData.profile) {
              onClick(object.userData.profile)
            }
          }
        }
      }

      // Add event listeners
      renderer.domElement.addEventListener('mousedown', onMouseDown)
      renderer.domElement.addEventListener('mousemove', onMouseMove)
      renderer.domElement.addEventListener('mouseup', onMouseUp)
      renderer.domElement.addEventListener('wheel', onWheel)
      renderer.domElement.addEventListener('click', onClickHandler)
      window.addEventListener('keydown', onKeyDown)

      // Store cleanup functions
      const cleanup = () => {
        renderer.domElement.removeEventListener('mousedown', onMouseDown)
        renderer.domElement.removeEventListener('mousemove', onMouseMove)
        renderer.domElement.removeEventListener('mouseup', onMouseUp)
        renderer.domElement.removeEventListener('wheel', onWheel)
        renderer.domElement.removeEventListener('click', onClickHandler)
        window.removeEventListener('keydown', onKeyDown)
      }

      return cleanup
    } catch (err) {
      console.error('Failed to initialize Three.js scene:', err)
      setError('Failed to initialize 3D visualization')
      return () => {}
    }
  }, [mode, THREE, onHover, onClick])

  // Progressive rendering for large datasets
  const createProgressiveVisualization = useCallback(async (profiles: OceanProfile[], validation: DatasetValidation) => {
    if (!sceneRef.current || !profiles.length || !THREE) return

    try {
      // Remove existing visualization objects
      const objectsToRemove = sceneRef.current.children.filter((child: any) => 
        child.userData && child.userData.type === 'visualization'
      )
      objectsToRemove.forEach((obj: any) => {
        sceneRef.current.remove(obj)
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat: any) => mat.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })

      // Performance optimization: subsample if too many points
      const maxPoints = mode === 'power' ? 50000 : 20000
      const needsSubsampling = profiles.length > maxPoints
      
      if (needsSubsampling) {
        setIsProgressiveRendering(true)
        console.log(`📊 Large dataset detected: ${profiles.length} points. Enabling progressive rendering.`)
      }

      const subsampledProfiles = needsSubsampling
        ? profiles.filter((_, i) => i % Math.ceil(profiles.length / maxPoints) === 0)
        : profiles

      console.log(`📊 Performance: ${profiles.length} total points, displaying ${subsampledProfiles.length} (${Math.round(subsampledProfiles.length / profiles.length * 100)}%)`)

      // Calculate bounds with safety checks
      const bounds = {
        lat: { 
          min: Math.min(...subsampledProfiles.map(p => p.lat || 0)), 
          max: Math.max(...subsampledProfiles.map(p => p.lat || 0)) 
        },
        lon: { 
          min: Math.min(...subsampledProfiles.map(p => p.lon || 0)), 
          max: Math.max(...subsampledProfiles.map(p => p.lon || 0)) 
        },
        depth: { 
          min: Math.min(...subsampledProfiles.map(p => p.depth || 0)), 
          max: Math.max(...subsampledProfiles.map(p => p.depth || 0)) 
        },
        temp: { 
          min: Math.min(...subsampledProfiles.map(p => p.temperature || 20)), 
          max: Math.max(...subsampledProfiles.map(p => p.temperature || 20)) 
        }
      }

      // Ensure bounds are valid and not identical (avoid division by zero)
      if (bounds.lat.min === bounds.lat.max) {
        bounds.lat.min -= 0.1
        bounds.lat.max += 0.1
      }
      if (bounds.lon.min === bounds.lon.max) {
        bounds.lon.min -= 0.1
        bounds.lon.max += 0.1
      }
      if (bounds.depth.min === bounds.depth.max) {
        bounds.depth.min = 0
        bounds.depth.max = 2000
      }
      if (bounds.temp.min === bounds.temp.max) {
        bounds.temp.min = 10
        bounds.temp.max = 30
      }

      console.log('📊 Bounds calculated:', bounds)

      // Create geometry
      const positions = new Float32Array(subsampledProfiles.length * 3)
      const colors = new Float32Array(subsampledProfiles.length * 3)
      const sizes = new Float32Array(subsampledProfiles.length)

      subsampledProfiles.forEach((profile, i) => {
        // Normalize coordinates with safety checks
        const lat = profile.lat || 0
        const lon = profile.lon || 0
        const depth = profile.depth || 0
        const temperature = profile.temperature || 20

        // Calculate normalized coordinates with bounds checking
        const latRange = bounds.lat.max - bounds.lat.min
        const lonRange = bounds.lon.max - bounds.lon.min
        
        const x = latRange > 0 ? ((lon - bounds.lon.min) / latRange - 0.5) * 50 : (Math.random() - 0.5) * 50
        const z = latRange > 0 ? ((lat - bounds.lat.min) / latRange - 0.5) * 50 : (Math.random() - 0.5) * 50
        const y = -depth * 0.02

        // Ensure no NaN values
        positions[i * 3] = isNaN(x) ? 0 : x
        positions[i * 3 + 1] = isNaN(y) ? 0 : y
        positions[i * 3 + 2] = isNaN(z) ? 0 : z

        // Color by temperature with safety checks
        const tempRange = bounds.temp.max - bounds.temp.min
        const tempNorm = tempRange > 0 ? (temperature - bounds.temp.min) / tempRange : 0.5
        const clampedTempNorm = Math.max(0, Math.min(1, tempNorm))
        
        const color = new THREE.Color()
        if (clampedTempNorm < 0.33) {
          color.lerpColors(new THREE.Color(0x0D47A1), new THREE.Color(0x00BCD4), clampedTempNorm / 0.33)
        } else if (clampedTempNorm < 0.66) {
          color.lerpColors(new THREE.Color(0x00BCD4), new THREE.Color(0xFFEB3B), (clampedTempNorm - 0.33) / 0.33)
        } else {
          color.lerpColors(new THREE.Color(0xFFEB3B), new THREE.Color(0xFF6F00), (clampedTempNorm - 0.66) / 0.34)
        }

        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b

        // Size based on depth with safety check
        sizes[i] = Math.max(2, 8 - depth * 0.003)
      })

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      // Compute bounding sphere to ensure geometry is valid
      try {
        geometry.computeBoundingSphere()
      } catch (error) {
        console.error('❌ Failed to compute bounding sphere:', error)
        setError('Invalid data geometry - unable to create visualization')
        return
      }
      
      // Validate geometry before creating points
      if (geometry.boundingSphere && 
          !isNaN(geometry.boundingSphere.radius) && 
          geometry.boundingSphere.radius > 0 && 
          geometry.boundingSphere.radius < 1000) {
      // GPU-optimized material with custom shader
      const material = new THREE.PointsMaterial({
        size: mode === 'power' ? 8 : 12,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        // GPU optimization flags
        precision: 'highp'
      })

      // Custom shader for better performance
      material.onBeforeCompile = (shader: any) => {
        shader.vertexShader = `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vSize;
          ${shader.vertexShader}
        `.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vColor = color;
          vSize = size;
          gl_PointSize = size * (300.0 / -mvPosition.z);
          `
        )
        
        shader.fragmentShader = `
          varying vec3 vColor;
          varying float vSize;
          ${shader.fragmentShader}
        `.replace(
          '#include <color_fragment>',
          `
          #include <color_fragment>
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.95);
          `
        )
      }

        const points = new THREE.Points(geometry, material)
        points.userData = { type: 'visualization', profiles: subsampledProfiles }
        sceneRef.current.add(points)
        
        console.log('✅ Points created successfully with radius:', geometry.boundingSphere.radius)
      } else {
        console.error('❌ Invalid geometry - bounding sphere radius is NaN or zero')
        setError('Invalid data geometry - unable to create visualization')
        return
      }

      setDataStats({
        totalPoints: profiles.length,
        displayedPoints: subsampledProfiles.length,
        bounds,
        type: 'profiles'
      })
      
      // Update map data count immediately
      setMapData(profiles.map((profile: any) => ({
        id: profile.id || Math.random().toString(36).substr(2, 9),
        lat: profile.lat || profile.latitude,
        lon: profile.lon || profile.longitude,
        temperature: profile.temperature,
        salinity: profile.salinity,
        depth: profile.depth,
        date: profile.date || profile.timestamp
      })).filter((point: any) => point.lat && point.lon))

    } catch (err) {
      console.error('Failed to create profile visualization:', err)
      setError('Failed to create profile visualization')
    }
  }, [mode, THREE])

  // Create trajectory visualization with time animation
  const createTrajectoryVisualization = useCallback((data: TrajectoryPoint[]) => {
    if (!sceneRef.current || !data.length || !THREE) return

    try {
      // Remove existing visualization objects
      const objectsToRemove = sceneRef.current.children.filter((child: any) => 
        child.userData && child.userData.type === 'visualization'
      )
      objectsToRemove.forEach((obj: any) => {
        sceneRef.current.remove(obj)
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
      })

      // Sort by timestamp
      const sortedData = [...data].sort((a, b) => 
        new Date(a.timestamp || a.date).getTime() - new Date(b.timestamp || b.date).getTime()
      )

      // Calculate bounds with safety checks
      const bounds = {
        lat: { 
          min: Math.min(...sortedData.map(p => p.lat || 0)), 
          max: Math.max(...sortedData.map(p => p.lat || 0)) 
        },
        lon: { 
          min: Math.min(...sortedData.map(p => p.lon || 0)), 
          max: Math.max(...sortedData.map(p => p.lon || 0)) 
        },
        depth: { 
          min: Math.min(...sortedData.map(p => p.depth || 0)), 
          max: Math.max(...sortedData.map(p => p.depth || 0)) 
        }
      }

      // Ensure bounds are valid
      if (bounds.lat.min === bounds.lat.max) {
        bounds.lat.min -= 0.1
        bounds.lat.max += 0.1
      }
      if (bounds.lon.min === bounds.lon.max) {
        bounds.lon.min -= 0.1
        bounds.lon.max += 0.1
      }
      if (bounds.depth.min === bounds.depth.max) {
        bounds.depth.min = 0
        bounds.depth.max = 2000
      }

      // Create trajectory line with gradient colors
      const points = sortedData.map(point => {
        const lat = point.lat || 0
        const lon = point.lon || 0
        const depth = point.depth || 0
        
        const latRange = bounds.lat.max - bounds.lat.min
        const lonRange = bounds.lon.max - bounds.lon.min
        
        const x = latRange > 0 ? ((lon - bounds.lon.min) / latRange - 0.5) * 50 : (Math.random() - 0.5) * 50
        const z = latRange > 0 ? ((lat - bounds.lat.min) / latRange - 0.5) * 50 : (Math.random() - 0.5) * 50
        const y = -depth * 0.02
        
        return new THREE.Vector3(
          isNaN(x) ? 0 : x,
          isNaN(y) ? 0 : y,
          isNaN(z) ? 0 : z
        )
      })

      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      
      // Create gradient colors along the trajectory
      const colors = new Float32Array(points.length * 3)
      for (let i = 0; i < points.length; i++) {
        const t = i / (points.length - 1)
        const color = new THREE.Color()
        color.lerpColors(new THREE.Color(0x00BCD4), new THREE.Color(0xFF6B6B), t)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const material = new THREE.LineBasicMaterial({ 
        vertexColors: true,
        linewidth: 4,
        transparent: true,
        opacity: 0.9
      })
      const line = new THREE.Line(geometry, material)
      line.userData = { type: 'visualization', trajectory: sortedData }
      sceneRef.current.add(line)

      // Add animated markers for key points
      const markerGeometry = new THREE.SphereGeometry(0.6, 12, 8)
      
      // Start marker (green)
      const startMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.9
      })
      const startMarker = new THREE.Mesh(markerGeometry, startMaterial)
      startMarker.position.copy(points[0])
      startMarker.userData = { type: 'visualization', point: sortedData[0] }
      sceneRef.current.add(startMarker)

      // End marker (red)
      const endMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF6B6B,
        transparent: true,
        opacity: 0.9
      })
      const endMarker = new THREE.Mesh(markerGeometry, endMaterial)
      endMarker.position.copy(points[points.length - 1])
      endMarker.userData = { type: 'visualization', point: sortedData[sortedData.length - 1] }
      sceneRef.current.add(endMarker)

      // Add intermediate markers for significant points (every 10% of trajectory)
      const intermediateMarkers = []
      for (let i = 0; i < points.length; i += Math.max(1, Math.floor(points.length / 10))) {
        const markerMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00BCD4,
          transparent: true,
          opacity: 0.7
        })
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), markerMaterial)
        marker.position.copy(points[i])
        marker.userData = { type: 'visualization', point: sortedData[i] }
        sceneRef.current.add(marker)
        intermediateMarkers.push(marker)
      }

      // Store animation data for time-based animation
      line.userData.animationData = {
        points,
        sortedData,
        intermediateMarkers,
        currentTime: 0,
        duration: 10000 // 10 seconds animation
      }

      setDataStats({
        totalPoints: data.length,
        displayedPoints: data.length,
        bounds,
        type: 'trajectory',
        timeRange: {
          start: sortedData[0].timestamp || sortedData[0].date,
          end: sortedData[sortedData.length - 1].timestamp || sortedData[sortedData.length - 1].date
        }
      })

    } catch (err) {
      console.error('Failed to create trajectory visualization:', err)
      setError('Failed to create trajectory visualization')
    }
  }, [THREE])

  // Create regional heatmap visualization
  const createRegionalVisualization = useCallback((data: RegionalData) => {
    if (!sceneRef.current || !data || !THREE) return

    try {
      // Remove existing visualization objects
      const objectsToRemove = sceneRef.current.children.filter((child: any) => 
        child.userData && child.userData.type === 'visualization'
      )
      objectsToRemove.forEach((obj: any) => {
        sceneRef.current.remove(obj)
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
      })

      const { bounds, values } = data
      const valueBounds = {
        min: Math.min(...values.map(v => v.value)),
        max: Math.max(...values.map(v => v.value))
      }

      // Create heatmap surface
      const geometry = new THREE.PlaneGeometry(40, 40, 32, 32)
      const material = new THREE.MeshBasicMaterial({
        color: 0x00BCD4,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
      const heatmap = new THREE.Mesh(geometry, material)
      heatmap.rotation.x = -Math.PI / 2
      heatmap.position.y = 0
      heatmap.userData = { type: 'visualization', regionalData: data }
      sceneRef.current.add(heatmap)

      // Add data points
      values.forEach(point => {
        const x = ((point.lon - bounds.west) / (bounds.east - bounds.west) - 0.5) * 40
        const z = ((point.lat - bounds.south) / (bounds.north - bounds.south) - 0.5) * 40
        const y = 0.1

        const valueNorm = (point.value - valueBounds.min) / (valueBounds.max - valueBounds.min)
        const color = new THREE.Color()
        color.lerpColors(new THREE.Color(0x0D47A1), new THREE.Color(0xFF6F00), valueNorm)

        const pointGeometry = new THREE.SphereGeometry(0.3, 8, 6)
        const pointMaterial = new THREE.MeshBasicMaterial({ color })
        const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
        pointMesh.position.set(x, y, z)
        pointMesh.userData = { type: 'visualization', point }
        sceneRef.current.add(pointMesh)
      })

      setDataStats({
        totalPoints: values.length,
        displayedPoints: values.length,
        bounds,
        valueBounds,
        type: 'regional'
      })

    } catch (err) {
      console.error('Failed to create regional visualization:', err)
      setError('Failed to create regional visualization')
    }
  }, [THREE])

  // Create comparison visualization
  const createComparisonVisualization = useCallback((data: any[]) => {
    if (!sceneRef.current || !data.length || !THREE) return

    try {
      // Remove existing visualization objects
      const objectsToRemove = sceneRef.current.children.filter((child: any) => 
        child.userData && child.userData.type === 'visualization'
      )
      objectsToRemove.forEach((obj: any) => {
        sceneRef.current.remove(obj)
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
      })

      // Group data by series
      const seriesGroups = data.reduce((groups, item) => {
        const series = item.series || item.dataset || item.group || 'default'
        if (!groups[series]) groups[series] = []
        groups[series].push(item)
        return groups
      }, {} as Record<string, any[]>)

      const colors = [0x00BCD4, 0xFF6B6B, 0x4CAF50, 0xFF9800, 0x9C27B0]
      let colorIndex = 0

      Object.entries(seriesGroups).forEach(([seriesName, seriesData]) => {
        const color = colors[colorIndex % colors.length]
        colorIndex++

        // Create points for this series
        const dataArray = seriesData as any[]
        const positions = new Float32Array(dataArray.length * 3)
        const colorsArray = new Float32Array(dataArray.length * 3)
        const sizes = new Float32Array(dataArray.length)

        dataArray.forEach((point: any, i: number) => {
          const x = (point.lon || 0) * 0.5
          const z = (point.lat || 0) * 0.5
          const y = -(point.depth || 0) * 0.02

          positions[i * 3] = x
          positions[i * 3 + 1] = y
          positions[i * 3 + 2] = z

          const pointColor = new THREE.Color(color)
          colorsArray[i * 3] = pointColor.r
          colorsArray[i * 3 + 1] = pointColor.g
          colorsArray[i * 3 + 2] = pointColor.b

          sizes[i] = 6
        })

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3))
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const material = new THREE.PointsMaterial({
          size: 12,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          sizeAttenuation: true
        })

        const points = new THREE.Points(geometry, material)
        points.userData = { type: 'visualization', series: seriesName, data: seriesData }
        sceneRef.current.add(points)
      })

      setDataStats({
        totalPoints: data.length,
        displayedPoints: data.length,
        series: Object.keys(seriesGroups),
        type: 'comparison'
      })

    } catch (err) {
      console.error('Failed to create comparison visualization:', err)
      setError('Failed to create comparison visualization')
    }
  }, [THREE])

  // Create fallback visualization for insufficient data
  const createFallbackVisualization = useCallback(() => {
    if (!sceneRef.current || !THREE) return

    try {
      // Remove existing visualization objects
      const objectsToRemove = sceneRef.current.children.filter((child: any) => 
        child.userData && child.userData.type === 'visualization'
      )
      objectsToRemove.forEach((obj: any) => {
        sceneRef.current.remove(obj)
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
      })

      // Create a simple informational display
      const fallbackGeometry = new THREE.BoxGeometry(2, 2, 2)
      const fallbackMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x666666,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      })
      const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial)
      fallbackMesh.userData = { type: 'visualization', fallback: true }
      sceneRef.current.add(fallbackMesh)

      setDataStats({
        totalPoints: 0,
        displayedPoints: 0,
        type: 'fallback',
        message: 'Insufficient data for visualization'
      })

    } catch (err) {
      console.error('Failed to create fallback visualization:', err)
      setError('Failed to create fallback visualization')
    }
  }, [THREE])

  // FloatChat Ocean MCP Non-Blocking Rendering Engine
  const createVisualization = useCallback(async () => {
    console.log('🔍 createVisualization called with:', {
      hasVizSpec: !!vizSpec,
      hasData: !!vizSpec?.data,
      dataLength: Array.isArray(vizSpec?.data) ? vizSpec.data.length : 'not array',
      hasTHREE: !!THREE,
      vizSpecData: vizSpec?.data
    })

    if (!vizSpec?.data || !THREE) {
      console.log('❌ createVisualization: Missing vizSpec.data or THREE, returning early')
      return
    }

    const data = vizSpec.data

    // Check if we have valid data
    if (!Array.isArray(data) || data.length === 0) {
      console.log('❌ createVisualization: No data available for visualization')
      setError('No data available for visualization. Please try a different query.')
      setIsRendering(false)
      return
    }
    const taskId = `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🚀 FloatChat Ocean MCP: Starting non-blocking render task', { 
      taskId, 
      dataLength: Array.isArray(data) ? data.length : 'object',
      dataSample: Array.isArray(data) ? data.slice(0, 2) : data
    })

    // Cancel any existing render task
    if (renderTaskId) {
      console.log('🛑 FloatChat: Cancelling previous render task', renderTaskId)
      if (renderTimeout) {
        clearTimeout(renderTimeout)
        // Don't set renderTimeout to null here to avoid infinite loop
      }
    }

    setRenderTaskId(taskId)
    setIsRendering(true)
    setError(null)

    // Step 1: Validate dataset (INSTANT - non-blocking)
    const validation = validateDataset(data)
    setValidationResult(validation)

    // Step 2: Calculate research metrics (INSTANT - non-blocking)
    const metrics = calculateResearchMetrics(data, validation)
    const spatialBounds = {
      lat: { min: Math.min(...data.map((p: any) => p.lat || 0)), max: Math.max(...data.map((p: any) => p.lat || 0)) },
      lon: { min: Math.min(...data.map((p: any) => p.lon || 0)), max: Math.max(...data.map((p: any) => p.lon || 0)) },
      depth: { min: Math.min(...data.map((p: any) => p.depth || 0)), max: Math.max(...data.map((p: any) => p.depth || 0)) }
    }

    const summary: VisualizationSummary = {
      type: 'FloatChat Ocean MCP Visualization',
      dataQuality: validation.dataQuality,
      metrics,
      spatialBounds,
      temporalRange: validation.hasTemporal ? {
        start: data[0]?.date || data[0]?.timestamp || 'Unknown',
        end: data[data.length - 1]?.date || data[data.length - 1]?.timestamp || 'Unknown'
      } : undefined
    }
    setResearchSummary(summary) // INSTANT DISPLAY
    onResearchSummary?.(summary) // Pass to parent component
    
    // Extract map data for geographic visualization
    const extractedMapData = data.map((point: any) => ({
      id: point.id || Math.random().toString(36).substr(2, 9),
      lat: point.lat || point.latitude,
      lon: point.lon || point.longitude,
      temperature: point.temperature,
      salinity: point.salinity,
      depth: point.depth,
      date: point.date || point.timestamp
    })).filter((point: any) => point.lat && point.lon)
    
    console.log('🗺️ Extracted map data:', {
      totalData: data.length,
      mapData: extractedMapData.length,
      sample: extractedMapData.slice(0, 3)
    })
    
    setMapData(extractedMapData)
    setShowMap(extractedMapData.length > 0) // Show map if we have geographic data
    setFilteredData(data) // Initialize with all data

    // If validation fails, show fallback immediately
    if (!validation.isValid || !validation.renderable) {
      console.error('❌ FloatChat Validation failed:', validation.errorMessage)
      setError(validation.errorMessage || 'Invalid dataset')
      setFallbackMode('static')
      setIsRendering(false)
      return
    }

    console.log('✅ FloatChat Validation passed:', {
      quality: validation.dataQuality,
      points: validation.pointCount,
      geometry: validation.hasValidGeometry,
      renderable: validation.renderable
    })

    // Step 3: Set 5-second render timeout
    const timeout = setTimeout(() => {
      console.warn('⏰ FloatChat: Render timeout (5s) - falling back to 2D')
      setFallbackMode('2d')
      setIsRendering(false)
      setError('Render timeout - falling back to 2D visualization')
    }, 5000)
    setRenderTimeout(timeout)

    // Step 4: Async rendering with task cancellation
    try {
      const detectedType = detectVisualizationType(data, vizSpec, validation)
      setVisualizationType(detectedType)

      console.log('🎨 FloatChat: Creating visualization (async)', { 
        type: detectedType, 
        dataLength: data.length,
        quality: validation.dataQuality,
        taskId
      })

      // Check if task was cancelled
      if (renderTaskId !== taskId) {
        console.log('🛑 FloatChat: Render task cancelled', taskId)
        clearTimeout(timeout)
        return
      }

      // Create visualization based on type
      switch (detectedType) {
        case 'profiles':
          await createProgressiveVisualization(data, validation)
          break
        case 'trajectory':
          createTrajectoryVisualization(data)
          break
        case 'regional':
          createRegionalVisualization(data as unknown as RegionalData)
          break
        case 'comparison':
          createComparisonVisualization(data)
          break
        case 'fallback':
          createFallbackVisualization()
          break
        default:
          setError('Unsupported visualization type')
          setFallbackMode('static')
          break
      }

      // Check if task was cancelled before completion
      if (renderTaskId !== taskId) {
        console.log('🛑 FloatChat: Render task cancelled during creation', taskId)
        clearTimeout(timeout)
        return
      }

      clearTimeout(timeout)
      setRenderTimeout(null)
      setIsProgressiveRendering(false)
      setIsRendering(false)
      setFallbackMode('3d')
      
      console.log('✅ FloatChat: Visualization created successfully', taskId)
    } catch (error) {
      console.error('❌ FloatChat: Visualization creation failed:', error)
      clearTimeout(timeout)
      setRenderTimeout(null)
      setIsRendering(false)
      setError('Failed to create visualization')
      setFallbackMode('2d')
      return
    }

    if (onComplete) {
      onComplete()
    }
  }, [vizSpec, THREE, validateDataset, calculateResearchMetrics, detectVisualizationType, createProgressiveVisualization, createTrajectoryVisualization, createRegionalVisualization, createComparisonVisualization, createFallbackVisualization, onComplete, renderTaskId, renderTimeout, onResearchSummary])

  // Handle location selection from map
  const handleLocationSelect = useCallback((lat: number, lon: number, point: any) => {
    setSelectedLocation({ lat, lon })
    
    // Filter data to show only nearby points (within 1 degree radius)
    const nearbyData = vizSpec.data.filter((item: any) => {
      const itemLat = item.lat || item.latitude
      const itemLon = item.lon || item.longitude
      if (!itemLat || !itemLon) return false
      
      const distance = Math.sqrt(
        Math.pow(itemLat - lat, 2) + Math.pow(itemLon - lon, 2)
      )
      return distance < 1.0 // 1 degree radius
    })
    
    setFilteredData(nearbyData.length > 0 ? nearbyData : [point])
    
    // Re-trigger visualization with filtered data
    if (nearbyData.length > 0) {
      const newVizSpec = {
        ...vizSpec,
        data: nearbyData
      }
      // This will trigger a re-render with the filtered data
      setTimeout(() => {
        createVisualization()
      }, 100)
    }
  }, [vizSpec, createVisualization])

  // FloatChat Ocean MCP - 60fps Capped Animation Loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

    try {
      const time = Date.now() * 0.001
      let needsUpdate = false

      // 60fps cap - only update every 16ms (60fps)
      const frameTime = Math.floor(time * 60) / 60
      
      // Only animate every few frames for performance
      if (Math.floor(frameTime * 10) % 3 === 0) {
        // Animate visualization objects
        sceneRef.current.children.forEach((child: any) => {
          if (child.userData && child.userData.type === 'visualization') {
            if (child.type === 'Points') {
              // Gentle rotation for scatter plots (reduced frequency)
              child.rotation.y += 0.0005
              
              // Pulsing size effect (reduced frequency)
              const material = child.material
              if (material && material.size !== undefined) {
                material.size = (mode === 'power' ? 8 : 12) * (1 + Math.sin(frameTime * 1) * 0.05)
                needsUpdate = true
              }
            } else if (child.type === 'Line' && child.userData.animationData) {
              // Animate trajectory line (exactly 60fps)
              const animData = child.userData.animationData
              animData.currentTime += 16.67 // Exactly 60fps (1000ms/60fps)
              
              if (animData.currentTime < animData.duration) {
                const progress = animData.currentTime / animData.duration
                const currentIndex = Math.floor(progress * (animData.points.length - 1))
                
                // Highlight current position
                animData.intermediateMarkers.forEach((marker: any, index: number) => {
                  if (index <= currentIndex) {
                    marker.material.opacity = 0.9
                    marker.scale.setScalar(1.2)
                  } else {
                    marker.material.opacity = 0.3
                    marker.scale.setScalar(0.8)
                  }
                })
                needsUpdate = true
              } else {
                // Reset animation
                animData.currentTime = 0
              }
            }
          }
        })
      }

      // Only render if something changed or every 3rd frame (20fps effective)
      if (needsUpdate || Math.floor(frameTime * 10) % 3 === 0) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
      
      animationIdRef.current = requestAnimationFrame(animate)
    } catch (error) {
      console.error('FloatChat Animation loop error:', error)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = undefined
      }
    }
  }, [mode])

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !rendererRef.current || !cameraRef.current) return

    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(width, height)
  }, [])

  // Initialize scene and create visualization
  useEffect(() => {
    const cleanup = initializeScene()
    setIsLoading(false)

    const startAnimation = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        animate()
      } else {
        setTimeout(startAnimation, 100)
      }
    }

    setTimeout(startAnimation, 100)
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = undefined
      }
      window.removeEventListener('resize', handleResize)
      if (cleanup) cleanup()
    }
  }, [initializeScene, animate, handleResize])

  // Create visualization when data changes
  useEffect(() => {
    console.log('🔍 useEffect triggered for createVisualization:', {
      hasVizSpec: !!vizSpec,
      hasData: !!vizSpec?.data,
      dataLength: Array.isArray(vizSpec?.data) ? vizSpec.data.length : 'not array',
      filteredDataLength: filteredData.length,
      hasTHREE: !!THREE,
      dataToUse: filteredData.length > 0 ? filteredData : vizSpec?.data
    })

    const dataToUse = filteredData.length > 0 ? filteredData : vizSpec?.data
    if (dataToUse && THREE) {
      console.log('✅ useEffect: Calling createVisualization with data:', dataToUse.length, 'points')
      // Create a temporary vizSpec with filtered data
      const tempVizSpec = {
        ...vizSpec,
        data: dataToUse
      }
      createVisualization()
    } else {
      console.log('❌ useEffect: Not calling createVisualization - missing data or THREE')
    }
    
    // Cleanup function to clear timeout on unmount
    return () => {
      if (renderTimeout) {
        clearTimeout(renderTimeout)
      }
    }
  }, [vizSpec, THREE, filteredData]) // Removed createVisualization to prevent infinite loops

  // Update map data when vizSpec changes
  useEffect(() => {
    if (vizSpec?.data && Array.isArray(vizSpec.data)) {
      const extractedMapData = vizSpec.data.map((point: any) => ({
        id: point.id || Math.random().toString(36).substr(2, 9),
        lat: point.lat || point.latitude,
        lon: point.lon || point.longitude,
        temperature: point.temperature,
        salinity: point.salinity,
        depth: point.depth,
        date: point.date || point.timestamp
      })).filter((point: any) => point.lat && point.lon)
      
      console.log('🗺️ Map data updated:', {
        totalData: vizSpec.data.length,
        mapData: extractedMapData.length
      })
      
      setMapData(extractedMapData)
      setShowMap(extractedMapData.length > 0)
    }
  }, [vizSpec?.data])

  if (error) {
    return (
      <div className={`w-full h-full flex ${className}`}>
        {/* LEFT COLUMN: Error Display */}
        <div className="flex-1 flex items-center justify-center bg-red-900/20">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-400 text-lg mb-2">🔬 FloatChat Visualization Error</div>
            <div className="text-red-300 text-sm mb-4">{error}</div>
            <div className="text-gray-400 text-xs mb-4">
              {vizSpec?.fallbackText || 'Unable to render 3D visualization'}
            </div>
            
            {/* Actionable Guidance */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-left">
              <div className="text-white text-sm font-medium mb-2">💡 How to fix this:</div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Ensure your query includes ocean measurement data</li>
                <li>• Check that data contains lat/lon coordinates and depth</li>
                <li>• Verify at least 20 data points are available</li>
                <li>• Try refining your search parameters</li>
              </ul>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setError(null)
                  setIsLoading(true)
                  setTimeout(() => {
                    createVisualization()
                    setIsLoading(false)
                  }, 100)
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Retry
              </button>
              <button 
                onClick={() => {
                  setError(null)
                  setFallbackMode('2d')
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Try 2D View
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Research Summary (Empty State) */}
        <div className="w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700/50 overflow-y-auto">
          <div className="p-4 text-white">
            <div className="font-bold mb-4 text-gray-400 text-lg">📊 FloatChat Research Summary</div>
            <div className="text-sm text-gray-500">
              <div className="bg-red-900/20 rounded-lg p-3 mb-4">
                <div className="text-red-400 text-xs font-medium mb-2">Validation Failed</div>
                <div className="text-xs text-gray-300">
                  {error}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                No data available for analysis. Please provide ocean measurement data to generate research insights.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state when no data is available
  if (!vizSpec?.data || (Array.isArray(vizSpec.data) && vizSpec.data.length === 0)) {
    return (
      <div className={`w-full h-full flex ${className}`}>
        {/* LEFT COLUMN: Empty State */}
        <div className="flex-1 bg-black/90 border border-white/10 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Ocean Data Visualization</h3>
            <div className="text-sm text-white/60">Ready for Analysis</div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-blue-400 text-6xl mb-4">🌊</div>
              <h4 className="text-xl font-medium text-white mb-2">No Data Available</h4>
              <p className="text-white/70 mb-6">
                Ask a question about ocean data to see interactive visualizations and analysis.
              </p>
              <div className="text-sm text-white/50 space-y-2">
                <p>💡 Try asking:</p>
                <p>• "Show me temperature data from the North Atlantic"</p>
                <p>• "What are the salinity patterns in the Pacific?"</p>
                <p>• "Analyze ocean currents near the Gulf Stream"</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* RIGHT COLUMN: Map Placeholder */}
        <div className="w-96 bg-black/80 border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-medium text-white">Global Data Map</h3>
            <p className="text-sm text-white/60">Interactive Map</p>
          </div>
          <div className="flex-1 p-4">
            <div className="text-center text-white/60">
              <div className="text-4xl mb-4">🗺️</div>
              <p>Map will appear when data is loaded</p>
              <p className="text-xs mt-2">Click on data points to explore specific regions</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`w-full h-full flex ${className}`}>
        {/* LEFT COLUMN: Loading State */}
        <div className="flex-1 flex items-center justify-center bg-gray-900/20">
          <div className="text-center p-6">
            <div className="animate-spin h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-white text-lg">🔬 FloatChat Ocean MCP</div>
            <div className="text-gray-300 text-sm">Initializing 3D visualization engine...</div>
          </div>
        </div>

        {/* RIGHT COLUMN: Loading Summary */}
        <div className="w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700/50 overflow-y-auto">
          <div className="p-4 text-white">
            <div className="font-bold mb-4 text-white text-lg">📊 FloatChat Research Summary</div>
            <div className="text-sm text-gray-500">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-white text-xs font-medium mb-2">Initializing...</div>
                <div className="text-xs text-gray-300">
                  Loading Three.js engine and validating dataset...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle empty data case
  if (!vizSpec?.data || (Array.isArray(vizSpec.data) && vizSpec.data.length === 0)) {
    return (
      <div className={`w-full h-full flex ${className}`}>
        {/* LEFT COLUMN: Empty Data State */}
        <div className="flex-1 flex items-center justify-center bg-gray-900/20">
          <div className="text-center p-6 max-w-md">
            <div className="text-gray-400 text-lg mb-2">🔬 FloatChat Ocean MCP</div>
            <div className="text-gray-300 text-sm mb-4">No Data Available</div>
            <div className="text-gray-500 text-xs mb-4">
              Please provide ocean measurement data to create visualizations
            </div>
            
            {/* Data Requirements */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-left">
              <div className="text-white text-sm font-medium mb-2">📋 Data Requirements:</div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Minimum 20 data points</li>
                <li>• Latitude and longitude coordinates</li>
                <li>• Depth measurements</li>
                <li>• At least 2 measurement variables (temp, salinity, etc.)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Empty Summary */}
        <div className="w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700/50 overflow-y-auto">
          <div className="p-4 text-white">
            <div className="font-bold mb-4 text-gray-400 text-lg">📊 FloatChat Research Summary</div>
            <div className="text-sm text-gray-500">
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="text-gray-400 text-xs font-medium mb-2">Waiting for Data</div>
                <div className="text-xs text-gray-300">
                  No ocean measurement data available for analysis. Please provide data through the MCP pipeline to generate research insights.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-full flex ${className}`}>
      {/* LEFT COLUMN: Three.js Canvas Container */}
      <div className="flex-1 relative">
        <div 
          ref={mountRef} 
          className="w-full h-full"
          style={{ 
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
            minHeight: '400px'
          }}
        />
      
      {/* Visualization Info Overlay */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Ocean Data Visualization</div>
          <button
            onClick={() => {
              if (cameraRef.current) {
                cameraRef.current.position.set(40, 30, 40)
                cameraRef.current.lookAt(0, 0, 0)
              }
            }}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs rounded transition-colors"
            title="Reset view (R key)"
          >
            Reset View
          </button>
        </div>
        <div className="text-xs text-gray-300 space-y-1">
          <div>Type: {visualizationType}</div>
          <div>Points: {dataStats?.displayedPoints?.toLocaleString() || mapData.length || 0}</div>
          <div>Map Points: {mapData.length}</div>
          <div>Mode: {mode === 'power' ? 'Power User' : 'Explorer'}</div>
          {dataStats?.message && (
            <div className="text-yellow-400 text-xs">{dataStats.message}</div>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-2 space-y-1">
          <div>🖱️ Drag to rotate • Scroll to zoom • Hover for details</div>
          <div>⌨️ Arrow keys to move • R to reset view</div>
          <div>🧭 N/S/E/W markers show directions</div>
        </div>
      </div>

      {/* Fallback message for insufficient data */}
      {visualizationType === 'fallback' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="text-center p-6 bg-black/60 backdrop-blur-sm rounded-lg border border-gray-600/50">
            <div className="text-gray-300 text-lg mb-2">Insufficient Data</div>
            <div className="text-gray-400 text-sm mb-4">
              {vizSpec?.fallbackText || 'Not enough data points to create a meaningful visualization'}
            </div>
            <div className="text-xs text-gray-500">
              Try adjusting your filters or query parameters
            </div>
          </div>
        </div>
      )}

      {/* Legend for comparison visualizations */}
      {visualizationType === 'comparison' && dataStats?.series && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
          <div className="font-medium mb-2">Data Series</div>
          <div className="space-y-1">
            {dataStats.series.map((series: string, index: number) => (
              <div key={series} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 mr-2 rounded"
                  style={{ 
                    backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                  }}
                />
                {series}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research-Grade Tooltip */}
      {showTooltip && hoveredData && (
        <div 
          className="absolute bg-black/90 backdrop-blur-sm text-white text-xs p-4 rounded-lg border border-gray-500/50 pointer-events-none z-50 max-w-sm"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-bold mb-2 text-white">🔬 Ocean Data Point</div>
          <div className="space-y-1 font-mono">
            {hoveredData.lat !== undefined && (
              <div>Lat: {hoveredData.lat.toFixed(4)}°N</div>
            )}
            {hoveredData.lon !== undefined && (
              <div>Lon: {hoveredData.lon.toFixed(4)}°E</div>
            )}
            {hoveredData.depth !== undefined && (
              <div>Depth: {hoveredData.depth.toFixed(1)}m</div>
            )}
            {hoveredData.temperature !== undefined && (
              <div>Temp: {hoveredData.temperature.toFixed(3)}°C</div>
            )}
            {hoveredData.salinity !== undefined && (
              <div>Salinity: {hoveredData.salinity.toFixed(3)} PSU</div>
            )}
            {hoveredData.pressure !== undefined && (
              <div>Pressure: {hoveredData.pressure.toFixed(1)} dbar</div>
            )}
            {hoveredData.date && (
              <div>Date: {new Date(hoveredData.date).toLocaleDateString()}</div>
            )}
            {hoveredData.timestamp && (
              <div>Time: {new Date(hoveredData.timestamp).toLocaleString()}</div>
            )}
            {hoveredData.value !== undefined && (
              <div>Value: {hoveredData.value.toFixed(3)}</div>
            )}
          </div>
        </div>
      )}

      </div>

      {/* RIGHT COLUMN: Global Map Interface */}
      <div className="w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700/50 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Map Controls Header */}
          {selectedLocation && (
            <div className="flex items-center justify-between p-2 border-b border-white/10 bg-white/5">
              <div className="flex items-center space-x-2">
                <Target size={14} className="text-yellow-400" />
                <span className="text-xs text-white/80">
                  Focused on {selectedLocation.lat.toFixed(2)}°, {selectedLocation.lon.toFixed(2)}°
                  </span>
                </div>
              <button
                onClick={() => {
                  setSelectedLocation(undefined)
                  setFilteredData([])
                }}
                className="text-xs text-white/60 hover:text-white px-2 py-1 hover:bg-white/10 rounded transition-colors"
              >
                Reset View
              </button>
                </div>
              )}

          {/* Global Map */}
          <div className="flex-1">
            <GlobalMapInterface
              data={mapData}
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
              className="h-full"
            />
                  </div>
                  </div>
      </div>

      {/* Progressive Rendering Indicator */}
      {isProgressiveRendering && (
        <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Progressive rendering large dataset...</span>
          </div>
        </div>
      )}

      {/* Fallback text for accessibility */}
      {vizSpec?.fallbackText && (
        <div className="sr-only">{vizSpec.fallbackText}</div>
      )}

    </div>
  )
}
