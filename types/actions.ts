// Action Types and Schema - Blueprint Section 4
export interface ActionObject {
  id: string;
  type: 'apply_filters' | 'run_analysis' | 'export' | 'create_view' | 'annotate' | 'navigate';
  params: Record<string, any>;
  meta: {
    createdBy: string;
    confidence: number;
    timestamp: string;
  };
}

// Analysis State - Central state management
export interface AnalysisState {
  filters: {
    region?: string;
    timeRange?: [string, string];
    variables?: string[];
    depth?: [number, number];
    mode?: string;
    qcPolicy?: {
      allowed: number[];
      reject: number[];
    };
  };
  pipeline?: {
    type: 'scatter3d' | 'timeseries' | 'globe' | 'heatmap' | 'comparison' | 'section';
    resolution: string;
    aggregation: string;
    outputUrl?: string;
  };
  visualization?: {
    type: string;
    meta: {
      title: string;
      variables: string[];
      depthDomain: [number, number];
      timeRange: [string, string];
      qcPolicy: { allowed: number[]; reject: number[] };
      climatologyReference: string;
      provenance: {
        dataset: string;
        version: string;
        source: string;
      };
    };
    renderHints: {
      lod: 'auto' | 'high' | 'medium' | 'low';
      picking: 'gpu' | 'cpu';
    };
  };
  jobs: JobStatus[];
  history: ActionObject[];
}

export interface JobStatus {
  id: string;
  type: 'coarse_tile' | 'refinement' | 'export' | 'model_run';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
}

// viz_spec from Blueprint
export interface VizSpec {
  type: 'scatter3d' | 'timeseries' | 'globe' | 'heatmap' | 'comparison' | 'section' | 'map' | 'chart' | 'plot3d';
  data: any; // array or tile source descriptor
  library?: 'three' | 'plotly' | 'leaflet';
  fallbackText?: string;
  config?: any; // Configuration object for the visualization
  meta: {
    title: string;
    variables: string[];
    depth_domain: [number, number];
    time_range: [string, string];
    qc_policy: {
      allowed: number[];
      reject: number[];
    };
    climatology_reference: string;
    provenance: {
      dataset: string;
      version: string;
      source: string;
    };
  };
  renderHints: {
    lod: 'auto' | 'high' | 'medium' | 'low';
    picking: 'gpu' | 'cpu';
  };
}

// Action Parameter Schemas
export interface ApplyFiltersParams {
  region?: string;
  timeRange?: [string, string];
  variables?: string[];
  depth?: [number, number];
  mode?: string;
}

export interface RunAnalysisParams {
  pipeline: 'section' | 'heatmap' | 'scatter3d' | 'globe' | 'timeseries' | 'comparison';
  resolution: string;
  aggregation: 'monthly' | 'weekly' | 'daily' | 'hourly';
  output?: 'viz_spec_url' | 'stream' | 'file';
  modelOptions?: {
    climatologyReference?: string;
    anomalyDetection?: boolean;
    smoothing?: number;
  };
}

export interface ExportParams {
  format: 'csv' | 'netcdf' | 'parquet' | 'png' | 'gltf';
  includeMetadata: boolean;
  region?: string;
  timeRange?: [string, string];
  variables?: string[];
}

export interface CreateViewParams {
  name?: string;
  type: 'visualization' | 'analysis' | 'dashboard';
  autoGenerate?: boolean;
  template?: string;
}

export interface AnnotateParams {
  target: 'point' | 'region' | 'anomaly' | 'trend';
  coordinates?: [number, number];
  text: string;
  type: 'note' | 'flag' | 'hypothesis';
}

export interface NavigateParams {
  type: 'zoom' | 'pan' | 'focus';
  coordinates?: [number, number];
  region?: string;
  zoomLevel?: number;
}