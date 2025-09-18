# Design Document

## Overview

The FloatChat MCP Orchestrator AI Engine production deployment preparation involves a comprehensive system overhaul to ensure production-readiness, reliability, and strict data-driven responses. The design implements a multi-layered architecture with rigid provider hierarchies, intelligent failure handling, and production-quality visualizations while eliminating all non-essential components.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Explorer Mode  │  │   Power Mode    │                 │
│  │   Interface     │  │   Interface     │                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 MCP Orchestration Layer                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Intent Detection → Data Retrieval → Analysis → Viz     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Provider Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Groq     │→ │ HuggingFace │→ │   Graceful  │        │
│  │  (Primary)  │  │ (Fallback)  │  │   Failure   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Argovis API   │  │  Visualization  │                 │
│  │   Integration   │  │     Engine      │                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### Design Rationale

The architecture enforces strict separation of concerns with clear data flow and failure boundaries. The MCP orchestration layer acts as the central coordinator, ensuring every query follows the same pipeline while the provider layer implements cascading fallbacks to guarantee system reliability.

## Components and Interfaces

### 1. Cleanup and Optimization Module

**Purpose**: Systematically remove non-production files and optimize the codebase for deployment.

**Interface**:
```typescript
interface CleanupModule {
  removeTestFiles(): Promise<string[]>
  removeDeprecatedScripts(): Promise<string[]>
  removePlaceholderVisualizations(): Promise<string[]>
  validateProductionFiles(): Promise<ValidationResult>
}
```

**Design Decision**: Automated cleanup ensures consistent deployment packages and reduces security surface area by removing development artifacts.

### 2. Environment Configuration Manager

**Purpose**: Unify and validate all environment configurations across the system.

**Interface**:
```typescript
interface EnvironmentManager {
  consolidateEnvFiles(): Promise<EnvironmentConfig>
  validateCredentials(): Promise<CredentialStatus>
  generateProductionEnv(): Promise<void>
}

interface EnvironmentConfig {
  groqApiKey: string
  huggingFaceToken: string
  argovisEndpoint: string
  databaseUrl: string
}
```

**Design Decision**: Centralized environment management prevents configuration drift and ensures all services have consistent access to required credentials.

### 3. Provider Hierarchy Controller

**Purpose**: Implement strict LLM provider fallback chain with failure tracking.

**Interface**:
```typescript
interface ProviderController {
  executeQuery(query: string): Promise<LLMResponse>
  handleProviderFailure(provider: Provider, error: Error): Promise<void>
  getProviderStatus(): ProviderHealthStatus
}

enum Provider {
  GROQ = 'groq',
  HUGGINGFACE = 'huggingface'
}

interface LLMResponse {
  content: string
  provider: Provider
  success: boolean
  fallbackUsed: boolean
}
```

**Design Decision**: Explicit provider enumeration and failure tracking enables reliable service delivery and operational monitoring.

### 4. MCP Pipeline Orchestrator

**Purpose**: Enforce the strict 4-step pipeline for all query processing.

**Interface**:
```typescript
interface MCPOrchestrator {
  processQuery(query: string, mode: UserMode): Promise<QueryResult>
  detectIntent(query: string): Promise<IntentResult>
  retrieveData(intent: IntentResult): Promise<DataResult>
  analyzeData(data: DataResult): Promise<AnalysisResult>
  generateVisualization(analysis: AnalysisResult): Promise<VizSpec>
}

interface QueryResult {
  summary: string
  visualization?: VizSpec
  dataSource: string
  processingSteps: PipelineStep[]
}
```

**Design Decision**: Explicit pipeline steps ensure consistent processing and enable granular error handling at each stage.

### 5. Intelligent Failure Handler

**Purpose**: Implement smart data retrieval expansion when initial queries return empty results.

**Interface**:
```typescript
interface FailureHandler {
  handleEmptyData(originalQuery: DataQuery): Promise<DataResult>
  expandTemporal(query: DataQuery, months: number): Promise<DataResult>
  expandSpatial(query: DataQuery, degrees: number): Promise<DataResult>
  generateFailureResponse(attempts: FailureAttempt[]): string
}

interface FailureAttempt {
  type: 'temporal' | 'spatial'
  parameters: Record<string, any>
  result: 'success' | 'empty' | 'error'
}
```

**Design Decision**: Progressive expansion strategy maximizes data availability while maintaining query relevance and user transparency.

### 6. Mode-Specific Interface Controller

**Purpose**: Handle user mode selection at the interface level without LLM guessing.

**Interface**:
```typescript
interface ModeController {
  setUserMode(mode: UserMode): void
  formatResponse(content: string, mode: UserMode): FormattedResponse
  validateModeTransition(from: UserMode, to: UserMode): boolean
}

enum UserMode {
  EXPLORER = 'explorer',
  POWER = 'power'
}

interface FormattedResponse {
  content: string
  visualStyle: ResponseStyle
  interactionLevel: InteractionLevel
}
```

**Design Decision**: Interface-level mode handling eliminates ambiguity and ensures consistent user experience across different query types.

## Data Models

### Query Processing Models

```typescript
interface DataQuery {
  polygon?: GeoPolygon
  dateRange: DateRange
  parameters: OceanParameter[]
  mode: UserMode
}

interface GeoPolygon {
  coordinates: [number, number][]
  type: 'Polygon'
}

interface DateRange {
  start: Date
  end: Date
}

enum OceanParameter {
  TEMPERATURE = 'temperature',
  SALINITY = 'salinity',
  PRESSURE = 'pressure',
  OXYGEN = 'oxygen'
}
```

### Visualization Models

```typescript
interface VizSpec {
  type: 'threejs' | 'plotly'
  config: ThreeJSConfig | PlotlyConfig
  data: ProcessedData
  interactive: boolean
}

interface ThreeJSConfig {
  scene: SceneConfig
  camera: CameraConfig
  lighting: LightingConfig
  meshes: MeshConfig[]
}

interface PlotlyConfig {
  traces: TraceConfig[]
  layout: LayoutConfig
  config: PlotConfig
}
```

## Error Handling

### Provider Failure Strategy

1. **Primary Provider (Groq)**: Attempt query with llama-3.1-8b-instant
2. **Fallback Provider (HuggingFace)**: On Groq failure, attempt with HF LLM
3. **Graceful Failure**: On all provider failures, return standardized error message
4. **No Hallucination**: Never generate filler content or mock responses

### Data Retrieval Failure Strategy

1. **Initial Query**: Execute with provided parameters
2. **Temporal Expansion**: If empty, expand date range by ±6 months
3. **Spatial Expansion**: If still empty, expand geographic bounds by ±10 degrees
4. **Final Failure**: Return "No data available" message with retry suggestions

### Pipeline Error Boundaries

Each pipeline step has isolated error handling:
- **Intent Detection Failure**: Return "Unable to process query format"
- **Data Retrieval Failure**: Trigger intelligent expansion or graceful failure
- **Analysis Failure**: Return raw data with basic formatting
- **Visualization Failure**: Provide text-based data summary

## Testing Strategy

### Unit Testing Approach

- **Provider Controller**: Mock LLM responses and test fallback chains
- **MCP Orchestrator**: Test each pipeline step in isolation
- **Failure Handler**: Test expansion algorithms with various data scenarios
- **Environment Manager**: Test configuration validation and consolidation

### Integration Testing Approach

- **End-to-End Pipeline**: Test complete query flow from frontend to visualization
- **Provider Failover**: Test actual provider failures and recovery
- **Data Expansion**: Test with real Argovis API empty result scenarios
- **Mode Switching**: Test interface behavior across different user modes

### Production Readiness Testing

- **Performance**: Load testing with concurrent queries
- **Reliability**: Extended failure scenario testing
- **Security**: Credential validation and secure configuration testing
- **Cleanup Validation**: Verify all non-production files are removed

## Deployment Architecture

### File Structure Post-Cleanup

```
production-ready/
├── app/                    # Next.js frontend
├── components/            # React components
├── lib/                   # Utility libraries
├── public/               # Static assets
├── ai_ocean_mcp_server.py # Primary MCP server
├── ocean_mcp_server.py   # Backup MCP server
├── .env                  # Unified environment config
├── package.json          # Dependencies
└── next.config.js        # Next.js configuration
```

### Environment Configuration

Single `.env` file containing:
- Groq API credentials
- HuggingFace tokens
- Argovis API endpoints
- Database connection strings
- Production-specific settings

### Monitoring and Observability

- Provider failure logging
- Pipeline step timing
- Data retrieval success rates
- User mode distribution
- Visualization rendering performance

This design ensures a production-ready system that maintains strict data integrity, provides reliable fallback mechanisms, and delivers consistent user experiences across different interaction modes.