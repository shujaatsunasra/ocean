# Requirements Document

## Introduction

The FloatChat MCP Orchestrator AI Engine requires comprehensive preparation for production-grade deployment. This involves critical pre-deployment cleanup to remove unnecessary files and ensure only production-ready components remain, while implementing strict LLM-RAG orchestration rules to guarantee reliable, dynamic responses through the MCP pipeline. The system must enforce a rigid provider hierarchy (Groq → HuggingFace → graceful failure) and maintain strict response discipline that prevents hallucinated or template responses.

## Requirements

### Requirement 1: Critical Pre-Deployment Cleanup

**User Story:** As a deployment engineer, I want all unnecessary files and folders removed from the project, so that only production-ready components remain for deployment.

#### Acceptance Criteria

1. WHEN the cleanup process is executed THEN the system SHALL remove all test files including `*.test.js`, `*.spec.ts`, mock files, and dummy data generators
2. WHEN identifying files for removal THEN the system SHALL preserve only files required for Next.js frontend, MCP servers, core API clients, and configuration files
3. WHEN removing deprecated files THEN the system SHALL eliminate experimental scripts not referenced by the main flow
4. WHEN cleaning visualization files THEN the system SHALL remove old 2D/3D placeholders and demo plots that are not part of the production visualization pipeline
5. WHEN removing dead code THEN the system SHALL eliminate scaffolding and unreferenced utilities

### Requirement 2: Environment Configuration Unification

**User Story:** As a system administrator, I want all environment configurations unified and validated, so that the production deployment has consistent and working credentials.

#### Acceptance Criteria

1. WHEN unifying environment files THEN the system SHALL consolidate all .env files across root and subdirectories into a single configuration
2. WHEN preserving credentials THEN the system SHALL maintain all existing API keys and tokens without replacing them with placeholders
3. WHEN validating configuration THEN the system SHALL ensure Groq, HuggingFace, and Argovis credentials are properly configured
4. WHEN finalizing environment setup THEN the system SHALL reflect the real production setup in the final .env file

### Requirement 3: Provider Hierarchy Implementation

**User Story:** As a system architect, I want a strict LLM provider hierarchy enforced, so that the system has reliable fallback mechanisms and never produces hallucinated responses.

#### Acceptance Criteria

1. WHEN processing queries THEN the system SHALL use Groq (llama-3.1-8b-instant) as the primary reasoning LLM
2. WHEN Groq fails THEN the system SHALL fallback to HuggingFace LLM
3. WHEN both providers fail THEN the system SHALL return "System currently unable to generate result. Please retry."
4. WHEN any provider fails THEN the system SHALL NOT generate hallucinated filler text
5. WHEN implementing fallback logic THEN the system SHALL log provider failures for monitoring

### Requirement 4: MCP Pipeline Orchestration

**User Story:** As a data analyst, I want every query to follow a strict MCP orchestration pipeline, so that all responses are generated dynamically from real data retrieval and analysis.

#### Acceptance Criteria

1. WHEN processing any query THEN the system SHALL execute INTENT_DETECTION to classify Explorer vs Power mode
2. WHEN intent is detected THEN the system SHALL perform DATA_RETRIEVAL via Argovis API with polygon and date filters
3. WHEN data is retrieved THEN the system SHALL execute ANALYSIS where LLM synthesizes insights from retrieved data
4. WHEN analysis is complete THEN the system SHALL generate VISUALIZATION spec for three.js/plotly rendering
5. WHEN pipeline completes THEN the system SHALL return LLM summary combined with visualization spec
6. WHEN any pipeline step fails THEN the system SHALL provide specific error feedback without proceeding to next step

### Requirement 5: Strict Response Discipline

**User Story:** As a quality assurance engineer, I want all system responses to be based on real retrieved data, so that users receive accurate and reliable information without template responses.

#### Acceptance Criteria

1. WHEN generating responses THEN the system SHALL NOT use hardcoded template text or static "fun facts"
2. WHEN no specific date is requested THEN the system SHALL NOT default to last week's data unless explicitly requested
3. WHEN data retrieval fails THEN the system SHALL NOT provide mock responses except in empty data fallback scenarios
4. WHEN successful data retrieval occurs THEN responses SHALL always reference real retrieved data
5. WHEN unable to provide real data THEN the system SHALL gracefully fail with retry suggestions

### Requirement 6: User Mode Interface Enforcement

**User Story:** As a frontend developer, I want user modes handled at the interface level, so that mode selection is clear and doesn't rely on intent guessing within LLM logic.

#### Acceptance Criteria

1. WHEN user selects Explorer Mode THEN the interface SHALL enforce conversational, simple, and visually engaging responses
2. WHEN user selects Power Mode THEN the interface SHALL enforce precise, numeric, and research-level analysis
3. WHEN mode is selected THEN the system SHALL NOT attempt to guess user intent from query content
4. WHEN switching modes THEN the interface SHALL clearly indicate the active mode to the user
5. WHEN processing queries THEN mode-specific formatting SHALL be applied at the interface layer

### Requirement 7: Intelligent Failure Handling

**User Story:** As an end user, I want the system to intelligently handle data retrieval failures, so that I receive useful results even when initial queries return no data.

#### Acceptance Criteria

1. WHEN data retrieval returns empty results THEN the system SHALL auto-expand temporally by ± 6 months
2. WHEN temporal expansion fails THEN the system SHALL auto-expand spatially by ± 10 degrees
3. WHEN both expansions fail THEN the system SHALL return "No data available for this query. Try refining filters."
4. WHEN expanding search parameters THEN the system SHALL inform the user about the parameter adjustments made
5. WHEN no data is found after all attempts THEN the system SHALL NOT substitute with pre-written responses

### Requirement 8: Production-Ready Visualization System

**User Story:** As a data visualization specialist, I want interactive visualizations powered by three.js and plotly, so that users can explore ocean data through dynamic, production-quality graphics.

#### Acceptance Criteria

1. WHEN generating visualizations THEN the system SHALL use three.js for 3D ocean data representations
2. WHEN creating charts THEN the system SHALL use plotly for interactive 2D data plots
3. WHEN replacing old visualizations THEN the system SHALL remove all placeholder 2D/3D components
4. WHEN rendering visualizations THEN the system SHALL ensure they are responsive and performant
5. WHEN visualization generation fails THEN the system SHALL provide fallback text-based data summaries