'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  ActionObject, 
  AnalysisState, 
  JobStatus, 
  ApplyFiltersParams, 
  RunAnalysisParams, 
  ExportParams, 
  CreateViewParams, 
  AnnotateParams, 
  NavigateParams 
} from '../types/actions';

// Action Executor - Handles deterministic action execution
export class ActionExecutor {
  private apiBase: string;
  private onStateChange?: (state: AnalysisState) => void;
  private onJobUpdate?: (job: JobStatus) => void;

  constructor(apiBase = '/api', callbacks?: {
    onStateChange?: (state: AnalysisState) => void;
    onJobUpdate?: (job: JobStatus) => void;
  }) {
    this.apiBase = apiBase;
    this.onStateChange = callbacks?.onStateChange;
    this.onJobUpdate = callbacks?.onJobUpdate;
  }

  async executeAction(action: ActionObject, currentState: AnalysisState): Promise<AnalysisState> {
    console.log(`Executing action: ${action.type}`, action);

    try {
      switch (action.type) {
        case 'apply_filters':
          return this.applyFilters(action.params as ApplyFiltersParams, currentState);
        
        case 'run_analysis':
          return this.runAnalysis(action.params as RunAnalysisParams, currentState);
        
        case 'export':
          return this.exportData(action.params as ExportParams, currentState);
        
        case 'create_view':
          return this.createView(action.params as CreateViewParams, currentState);
        
        case 'annotate':
          return this.annotate(action.params as AnnotateParams, currentState);
        
        case 'navigate':
          return this.navigate(action.params as NavigateParams, currentState);
        
        default:
          throw new Error(`Unknown action type: ${(action as any).type}`);
      }
    } catch (error) {
      console.error('Action execution failed:', error);
      throw error;
    }
  }

  private async applyFilters(params: ApplyFiltersParams, state: AnalysisState): Promise<AnalysisState> {
    const newState: AnalysisState = {
      ...state,
      filters: {
        ...state.filters,
        ...params
      }
    };

    // Trigger coarse tile request
    if (Object.keys(params).length > 0) {
      const job = await this.requestCoarseTile(newState.filters);
      newState.jobs = [...state.jobs, job];
    }

    this.onStateChange?.(newState);
    return newState;
  }

  private async runAnalysis(params: RunAnalysisParams, state: AnalysisState): Promise<AnalysisState> {
    const jobId = `analysis-${Date.now()}`;
    
    const job: JobStatus = {
      id: jobId,
      type: 'model_run',
      status: 'queued',
      progress: 0,
      startTime: new Date().toISOString()
    };

    const newState: AnalysisState = {
      ...state,
      pipeline: {
        type: params.pipeline as any,
        resolution: params.resolution,
        aggregation: params.aggregation,
      },
      jobs: [...state.jobs, job]
    };

    // Start analysis pipeline
    this.startAnalysisPipeline(jobId, params, state.filters);
    
    this.onStateChange?.(newState);
    return newState;
  }

  private async exportData(params: ExportParams, state: AnalysisState): Promise<AnalysisState> {
    const jobId = `export-${Date.now()}`;
    
    const job: JobStatus = {
      id: jobId,
      type: 'export',
      status: 'queued',
      progress: 0,
      startTime: new Date().toISOString()
    };

    const newState: AnalysisState = {
      ...state,
      jobs: [...state.jobs, job]
    };

    // Start export job
    this.startExportJob(jobId, params, state.filters);
    
    this.onStateChange?.(newState);
    return newState;
  }

  private async createView(params: CreateViewParams, state: AnalysisState): Promise<AnalysisState> {
    const viewConfig = {
      name: params.name || `View-${Date.now()}`,
      type: params.type,
      filters: state.filters,
      pipeline: state.pipeline,
      timestamp: new Date().toISOString()
    };

    // Auto-generate visualization if requested
    if (params.autoGenerate && state.filters.variables && state.filters.region) {
      const vizSpec = this.generateVizSpec(state);
      return {
        ...state,
        visualization: vizSpec
      };
    }

    this.onStateChange?.(state);
    return state;
  }

  private async annotate(params: AnnotateParams, state: AnalysisState): Promise<AnalysisState> {
    // Create annotation record
    const annotation = {
      id: `annotation-${Date.now()}`,
      ...params,
      timestamp: new Date().toISOString(),
      filters: state.filters // Capture state for provenance
    };

    console.log('Created annotation:', annotation);
    
    // In production, this would be saved to the annotation service
    this.onStateChange?.(state);
    return state;
  }

  private async navigate(params: NavigateParams, state: AnalysisState): Promise<AnalysisState> {
    // Navigation actions are handled by the visualization component
    console.log('Navigation action:', params);
    
    this.onStateChange?.(state);
    return state;
  }

  // Backend API calls
  private async requestCoarseTile(filters: any): Promise<JobStatus> {
    const jobId = `coarse-tile-${Date.now()}`;
    
    try {
      const response = await fetch(`${this.apiBase}/tiles/coarse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, jobId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Coarse tile request failed: ${response.status} - ${result.error || 'Unknown error'}`);
      }
      
      const job: JobStatus = {
        id: jobId,
        type: 'coarse_tile',
        status: 'completed',
        progress: 100,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        result
      };

      this.onJobUpdate?.(job);
      return job;

    } catch (error) {
      console.error('Coarse tile request error:', error);
      const job: JobStatus = {
        id: jobId,
        type: 'coarse_tile',
        status: 'failed',
        progress: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.onJobUpdate?.(job);
      return job;
    }
  }

  private async startAnalysisPipeline(jobId: string, params: RunAnalysisParams, filters: any): Promise<void> {
    try {
      const response = await fetch(`${this.apiBase}/analysis/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, params, filters })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Analysis pipeline failed: ${response.status} - ${result.error || 'Unknown error'}`);
      }

      // Start polling for job status if the job was queued successfully
      if (result.status === 'queued' || result.status === 'running') {
        this.pollJobStatus(jobId, 'model_run');
      } else {
        // Job completed immediately (rare case)
        this.onJobUpdate?.({
          id: jobId,
          type: 'model_run',
          status: result.status,
          progress: result.progress || 100,
          startTime: result.startTime,
          endTime: result.endTime,
          result: result.result
        });
      }

    } catch (error) {
      console.error('Analysis pipeline error:', error);
      this.onJobUpdate?.({
        id: jobId,
        type: 'model_run',
        status: 'failed',
        progress: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async startExportJob(jobId: string, params: ExportParams, filters: any): Promise<void> {
    try {
      const response = await fetch(`${this.apiBase}/export/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, params, filters })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Export job failed: ${response.status} - ${result.error || 'Unknown error'}`);
      }

      // Start polling for job status if the job was queued successfully
      if (result.status === 'queued' || result.status === 'running') {
        this.pollJobStatus(jobId, 'export');
      } else {
        // Job completed immediately
        this.onJobUpdate?.({
          id: jobId,
          type: 'export',
          status: result.status,
          progress: result.progress || 100,
          startTime: result.startTime,
          endTime: result.endTime,
          result: result.result
        });
      }

    } catch (error) {
      console.error('Export job error:', error);
      this.onJobUpdate?.({
        id: jobId,
        type: 'export',
        status: 'failed',
        progress: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async pollJobStatus(jobId: string, type: JobStatus['type']): Promise<void> {
    let pollCount = 0;
    const maxPolls = 50; // Prevent infinite polling (100 seconds max)

    const poll = async () => {
      try {
        pollCount++;
        if (pollCount > maxPolls) {
          console.warn(`Job polling timeout for ${jobId}`);
          this.onJobUpdate?.({
            id: jobId,
            type,
            status: 'failed',
            progress: 0,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            error: 'Polling timeout - job took too long to complete'
          });
          return;
        }

        const response = await fetch(`${this.apiBase}/jobs/${jobId}/status`);
        
        if (!response.ok) {
          console.error(`Job status fetch failed: ${response.status}`);
          return;
        }

        const status = await response.json();
        
        const job: JobStatus = {
          id: jobId,
          type,
          status: status.status,
          progress: status.progress || 0,
          startTime: status.startTime,
          endTime: status.endTime,
          result: status.result,
          error: status.error
        };

        this.onJobUpdate?.(job);

        // Continue polling if job is still running
        if (status.status === 'running' || status.status === 'queued') {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Job polling error:', error);
        // Don't fail the job on polling errors, just retry
        setTimeout(poll, 3000); // Retry after 3 seconds
      }
    };

    // Start polling immediately
    poll();
  }

  private generateVizSpec(state: AnalysisState): any {
    const { filters, pipeline } = state;
    
    return {
      type: pipeline?.type || 'scatter3d',
      meta: {
        title: this.generateTitle(filters),
        variables: filters.variables || [],
        depth_domain: filters.depth || [0, 2000],
        time_range: filters.timeRange || ['2020-01-01', '2024-12-31'],
        qc_policy: filters.qcPolicy || { allowed: [1], reject: [4, 9] },
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
  }

  private generateTitle(filters: any): string {
    const parts = [];
    
    if (filters.variables?.length) {
      parts.push(filters.variables.join(', '));
    }
    
    if (filters.region) {
      parts.push(filters.region.replace('_', ' '));
    }
    
    if (filters.timeRange) {
      parts.push(`${filters.timeRange[0]} to ${filters.timeRange[1]}`);
    }
    
    return parts.join(' - ') || 'Ocean Analysis';
  }
}

// React Hook for Action Execution
export function useActionExecutor() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    filters: {},
    jobs: [],
    history: []
  });

  const [executor] = useState(() => new ActionExecutor('/api', {
    onStateChange: setAnalysisState,
    onJobUpdate: (job) => {
      setAnalysisState(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => j.id === job.id ? job : j)
      }));
    }
  }));

  const executeActions = useCallback(async (actions: ActionObject[]) => {
    let currentState = analysisState;
    
    for (const action of actions) {
      try {
        currentState = await executor.executeAction(action, currentState);
        
        // Add to history
        currentState = {
          ...currentState,
          history: [...currentState.history, action]
        };
        
      } catch (error) {
        console.error(`Failed to execute action ${action.id}:`, error);
        // Continue with other actions even if one fails
      }
    }

    setAnalysisState(currentState);
  }, [analysisState, executor]);

  const getReproducibleScript = useCallback(() => {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      actions: analysisState.history,
      finalState: {
        filters: analysisState.filters,
        pipeline: analysisState.pipeline
      }
    };
  }, [analysisState]);

  const replayScript = useCallback(async (script: any) => {
    if (script.actions && Array.isArray(script.actions)) {
      await executeActions(script.actions);
    }
  }, [executeActions]);

  return {
    analysisState,
    executeActions,
    getReproducibleScript,
    replayScript,
    activeJobs: analysisState.jobs.filter(j => j.status === 'running' || j.status === 'queued'),
    completedJobs: analysisState.jobs.filter(j => j.status === 'completed'),
    failedJobs: analysisState.jobs.filter(j => j.status === 'failed')
  };
}