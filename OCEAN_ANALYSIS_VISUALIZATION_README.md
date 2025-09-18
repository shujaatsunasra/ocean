# Ocean Analysis Visualization System

A professional-grade Three.js visualization system designed specifically for oceanographic data analysis. Built for marine scientists, ocean analysts, and researchers who need precise, interactive visualizations of CTD, Argo, and oceanographic survey data.

## 🌊 Key Features

### Oceanographic-Specific Visualizations
- **Profile Viewer**: 3D scatter plots for CTD/Argo profiles with depth-oriented display
- **Section Viewer**: Cross-sectional views along ship transects with interpolated surfaces  
- **Time-Depth Heatmaps**: Temporal evolution visualization for mooring/time-series data
- **Globe Viewer**: Global platform tracking with lat/lon coordinate mapping
- **Comparison Mode**: Side-by-side analysis of observations vs models

### Scientific Accuracy
- **Deterministic Color Mapping**: Oceanographic variable ranges with WebGL shaders
  - Temperature: -2°C to 35°C (blue → red)
  - Salinity: 30-40 PSU (aqua → navy → white)
  - Depth: 0-4000m (yellow → purple)
- **QC Flag Integration**: Visual encoding of data quality (1=good, 4=bad, 9=missing)
- **Anomaly Detection**: Spike detection and climatology comparison
- **Depth Convention**: Positive-down orientation following oceanographic standards

### Performance Optimization
- **GPU Acceleration**: Instanced geometry and WebGL shaders
- **Adaptive LOD**: Automatic quality reduction for large datasets (>50k points)
- **Mobile Responsive**: Performance scaling for different device capabilities
- **Real-time Interaction**: 60fps animation with smooth zooming/panning

## 📊 Visualization Types

### 1. Profile Scatter Plot (`scatter3d`)
```typescript
// Ideal for: CTD casts, Argo profiles, XBT drops
{
  type: "scatter3d",
  data: [...], // Profile measurements
  meta: {
    profile_type: "argo",
    depth_domain: [0, 2000],
    default_variable: "temperature"
  }
}
```

### 2. Section Visualization (`section`)
```typescript
// Ideal for: Ship transects, cross-shelf surveys
{
  type: "section", 
  data: [...], // Along-track measurements
  meta: {
    transect_id: "A",
    max_distance: 150.0,
    variable: "temperature"
  }
}
```

### 3. Time-Depth Heatmap (`timedepth`)
```typescript
// Ideal for: Moorings, time-series analysis
{
  type: "timedepth",
  data: [...], // Time-depth grid
  meta: {
    time_range: ["2025-06-01T00:00:00Z", "2025-08-31T23:59:59Z"],
    animation_fps: 24
  }
}
```

## 🚀 Quick Start

### Basic Integration
```tsx
import { VizRenderer } from './components/VizRenderer';

function OceanAnalysisApp() {
  const vizSpec = {
    type: 'scatter3d',
    data: [
      {
        id: 'cast-001-001',
        lat: -33.2156,
        lon: 150.1234, 
        depth: 5.0,
        temperature: 21.8,
        salinity: 35.0,
        qc: 1
      }
      // ... more data points
    ],
    meta: {
      title: 'CTD Cast 001 — Eastern Shelf Survey',
      variables: ['temperature', 'salinity'],
      default_variable: 'temperature',
      profile_type: 'ctd'
    }
  };

  return (
    <div className="h-screen w-full">
      <VizRenderer 
        vizSpec={vizSpec}
        performanceMode="auto"
        enableInteraction={true}
      />
    </div>
  );
}
```

### Advanced Configuration
```tsx
<VizRenderer 
  vizSpec={oceanData}
  performanceMode="high"        // 'low' | 'medium' | 'high' | 'auto'
  enableInteraction={true}      // Enable mouse/touch controls
  showQCOverlay={true}          // Display QC summary panel
  showAnalystControls={true}    // Show parameter controls
  colorScheme="temperature"     // Default color mapping
  onPointClick={handlePointClick}
  onSelectionChange={handleSelection}
/>
```

## 🎛️ Analyst Controls

The system provides comprehensive controls for scientific analysis:

### Variable Selection
- **Primary Variable**: Temperature, Salinity, Density, Oxygen
- **Color Encoding**: Deterministic mapping with scientific ranges
- **Scale Options**: Linear or logarithmic scaling

### Quality Control
- **QC Filtering**: Include/exclude data by quality flags
- **Anomaly Detection**: Highlight statistical outliers
- **Spike Detection**: Identify instrument errors
- **Reference Climatology**: Compare against WOA, CARS, etc.

### Display Options
- **Depth Range**: Focus on specific depth intervals
- **Contour Overlays**: Isolines for quantitative analysis  
- **Point Size**: Adjust for data density
- **Transparency**: Handle overlapping measurements

### Performance Settings
- **LOD Threshold**: Control quality vs performance tradeoff
- **Animation Speed**: Adjust temporal visualization rate
- **Smoothing**: Apply spatial/temporal filters

## 🔧 Technical Architecture

### Component Structure
```
VizRenderer.tsx           # Main orchestrator component
├── ScatterPlot3D_Analyst.ts   # Profile visualization pipeline
├── Section3D.ts              # Transect visualization pipeline  
├── TimeDepthHeatmap.ts       # Time-depth visualization pipeline
├── GlobeViz_Analyst.ts       # Global tracking pipeline
├── ColorMaps.ts              # Oceanographic shader system
├── QCOverlay.tsx             # Quality control summary panel
└── AnalystControls.tsx       # Parameter control interface
```

### Data Pipeline
1. **Input Validation**: Verify viz_spec format and data integrity
2. **Coordinate Transform**: Convert lat/lon to 3D world coordinates  
3. **QC Analysis**: Process quality flags and detect anomalies
4. **Geometry Creation**: Build instanced meshes for performance
5. **Shader Assignment**: Apply oceanographic color mapping
6. **Interaction Setup**: Enable picking, highlighting, tooltips

### Shader System
```glsl
// Temperature color mapping (fragment shader)
vec3 temperatureColor(float temp) {
  float normalized = (temp + 2.0) / 37.0;  // -2°C to 35°C
  return mix(
    vec3(0.0, 0.2, 1.0),  // Cold blue
    vec3(1.0, 0.1, 0.0),  // Hot red  
    normalized
  );
}
```

## 📋 Data Requirements

### Minimum Required Fields
```typescript
{
  id: string;           // Unique identifier
  lat?: number;         // Latitude (-90 to 90)
  lon?: number;         // Longitude (-180 to 180) 
  depth?: number;       // Depth in meters (positive down)
  time?: string;        // ISO 8601 timestamp
}
```

### Recommended Fields
```typescript
{
  temperature?: number;  // °C
  salinity?: number;     // PSU (Practical Salinity Units)
  density?: number;      // kg/m³
  oxygen?: number;       // ml/L or μmol/kg
  qc: number;           // Quality flag (1-9 standard)
  profile_id?: string;   // Links measurements from same cast
  platform_id?: string; // Platform identifier
}
```

### Quality Control Flags
- **1**: Good data (green visualization)
- **2**: Probably good (light green) 
- **3**: Probably bad (yellow/orange)
- **4**: Bad data (red visualization)
- **5**: Changed value (modified)
- **8**: Estimated value (interpolated)
- **9**: Missing value (excluded)

## 🔬 Example Use Cases

### 1. CTD Survey Analysis
```typescript
// Load CTD cast data for water mass analysis
const ctdData = {
  type: "scatter3d",
  data: ctdMeasurements,
  meta: {
    title: "Southern Ocean Survey — Temperature Structure", 
    profile_type: "ctd",
    variables: ["temperature", "salinity", "density"],
    depth_domain: [0, 1000],
    climatology_reference: "WOA-2018"
  }
};
```

### 2. Argo Float Validation  
```typescript
// Compare Argo profiles against climatology
const argoComparison = {
  type: "comparison", 
  data: [...argoObs, ...climData],
  meta: {
    comparison_type: "obs_vs_clim",
    datasets: ["argo", "climatology"],
    validation_period: "2025-07-01_2025-08-31"
  }
};
```

### 3. Frontal Analysis
```typescript
// Visualize temperature gradients across ocean fronts
const frontalData = {
  type: "section",
  data: transectMeasurements, 
  meta: {
    variable: "temperature",
    show_gradients: true,
    contour_levels: [10, 15, 20, 25],
    gradient_threshold: 0.5
  }
};
```

## ⚡ Performance Guidelines

### Dataset Size Optimization
- **< 10k points**: Full resolution rendering
- **10k - 50k points**: Adaptive decimation 
- **> 50k points**: Aggressive LOD with clustering
- **> 500k points**: Consider server-side preprocessing

### Memory Management
```typescript
// Optimize for large datasets
const performanceConfig = {
  maxPoints: 50000,          // Point cloud limit
  instanceLimit: 10000,      // Instanced geometry limit  
  textureResolution: 512,    // Shader texture size
  animationBufferSize: 1000  // Time-series buffer
};
```

### Mobile Device Support
- Automatic performance detection
- Reduced geometry complexity 
- Simplified shader operations
- Touch-optimized controls

## 🧪 Testing & Validation

### Coordinate Accuracy
```typescript
// Test lat/lon to 3D conversion
const testPoint = { lat: -33.8688, lon: 151.2093 };
const world3D = latLonToWorld(testPoint);
// Verify: Sydney Harbor → correct 3D coordinates
```

### Color Mapping Validation
```typescript
// Verify oceanographic color ranges
const tempColors = {
  freezing: temperatureShader(-1.8),  // → blue
  tropical: temperatureShader(30.0),  // → red
  deepwater: temperatureShader(2.0)   // → dark blue
};
```

### Performance Benchmarks
- **Initialization**: < 2 seconds for 50k points
- **Interaction**: 60fps during zoom/pan operations
- **Animation**: Smooth playback at 24-30fps
- **Memory**: < 500MB for typical datasets

## 🤝 Integration Examples

### Backend API Integration
```typescript
// Fetch data from oceanographic API
async function loadOceanData(query: OceanQuery) {
  const response = await fetch('/api/ocean/query', {
    method: 'POST',
    body: JSON.stringify({
      region: query.bounds,
      variables: ['temperature', 'salinity'],  
      depth_range: [0, 1000],
      time_range: query.timespan,
      qc_filter: [1, 2]  // Good and probably good data only
    })
  });
  
  const oceanData = await response.json();
  return transformToVizSpec(oceanData);
}
```

### Real-time Updates
```typescript
// Handle streaming oceanographic data
const [vizSpec, setVizSpec] = useState(initialData);

useEffect(() => {
  const eventSource = new EventSource('/stream/ocean-data');
  
  eventSource.onmessage = (event) => {
    const newMeasurement = JSON.parse(event.data);
    setVizSpec(prev => ({
      ...prev,
      data: [...prev.data, newMeasurement]
    }));
  };
  
  return () => eventSource.close();
}, []);
```

## 📚 References

### Oceanographic Standards
- [ARGO Data Management Handbook](http://www.argodatamgt.org/Documentation)
- [SeaDataNet Quality Control Procedures](https://www.seadatanet.org/Standards)
- [IODE Ocean Data Standards](https://www.iode.org/standards)

### Technical Documentation  
- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Specification](https://www.khronos.org/webgl/)
- [Oceanographic Color Palettes](https://matplotlib.org/cmocean/)

### Example Datasets
- [World Ocean Atlas (WOA)](https://www.ncei.noaa.gov/products/world-ocean-atlas)  
- [Argo Global Data Assembly Centre](https://argo.ucsd.edu/)
- [Global Ocean Ship-Based Hydrographic Investigations Program](https://www.go-ship.org/)

---

**Built for Ocean Scientists** — This visualization system prioritizes scientific accuracy, performance, and analyst workflows over generic charting capabilities. Every component is designed with oceanographic data conventions and research requirements in mind.