import { NextRequest, NextResponse } from 'next/server'
import { MCPOrchestrator, UserMode } from '../../../../lib/mcp/orchestrator'
import { config } from '../../../../lib/config'

// Initialize MCP Orchestrator
const orchestrator = new MCPOrchestrator(config)

export async function POST(request: NextRequest) {
  let mode = 'explorer'; // Default mode
  
  try {
    const body = await request.json()
    const { query = '', mode: requestMode = 'explorer', filters = {} } = body
    mode = requestMode; // Update mode from request

    console.log(`🌊 [API] Processing query: "${query}" in ${mode} mode`)

    // Validate mode
    const userMode = mode === 'power' ? UserMode.POWER : UserMode.EXPLORER

    // Execute MCP Pipeline - Enforces strict 4-step process
    // Note: MCP server may not be available, system will use Argovis API fallback
    const result = await orchestrator.processQuery(query, userMode)

    if (result.success) {
      console.log(`✅ [API] Pipeline completed successfully in ${result.executionTime}ms`)
      
      // Transform result to expected frontend format
      const response = transformQueryResult(result, mode)
      return NextResponse.json(response)
    } else {
      console.error(`❌ [API] Pipeline failed at step ${result.pipelineStep}: ${result.error}`)
      
      // Return graceful failure response
      const failureResponse = createFailureResponse(result.error!, mode)
      return NextResponse.json(failureResponse)
    }

  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    
    // Return system failure message
    const systemFailure = {
      summary: "System currently unable to generate result. Please retry.",
      error: "System currently unable to generate result. Please retry.",
    timestamp: new Date().toISOString(),
      source: 'system_error',
    mode: mode,
      success: false
    }
    
    return NextResponse.json(systemFailure, { status: 500 })
  }
}

/**
 * Transform MCP Query Result to Frontend Format
 * Enforces mode-specific response formatting at interface level
 */
function transformQueryResult(result: any, mode: string): any {
  const base = {
    timestamp: new Date().toISOString(),
    source: 'mcp_orchestrator',
    success: result.success,
    executionTime: result.executionTime,
    pipelineStep: result.pipelineStep
  }

  if (mode === 'power') {
    // Power Mode: Technical, precise, research-level
    return {
      ...base,
      summary: result.analysis.summary,
      technical_analysis: {
        methodology: 'MCP Pipeline with Argovis data retrieval',
        data_quality: {
          profileCount: result.data.metadata.totalProfiles,
          hasRealData: result.analysis.hasRealData,
          confidence: result.analysis.confidence
        },
        statistics: result.analysis.statistics,
        llmProvider: result.analysis.llmProvider
      },
      visualization_specs: {
        type: result.visualization.type,
        library: result.visualization.library,
        config: result.visualization.config,
        fallbackText: result.visualization.fallbackText
      },
      data_metadata: result.data.metadata,
      data_summary: {
        profiles: result.data.profiles,
        profileCount: result.data.metadata.totalProfiles,
        hasData: !result.data.isEmpty,
        timeRange: result.data.metadata.dateRange,
        region: result.data.metadata.region
      },
      insights: result.analysis.insights,
      region: result.data.metadata.region,
      mode: 'power'
    }
  } else {
    // Explorer Mode: Conversational, simple, engaging
  return {
      ...base,
      summary: result.analysis.summary,
      conversational_insights: result.analysis.insights.map((insight: string, index: number) => ({
      type: 'discovery',
        title: `Insight ${index + 1}`,
        content: insight,
        icon: '🌊'
      })),
      visualization: {
        type: result.visualization.type,
        library: result.visualization.library,
        data: result.visualization.data,
        config: result.visualization.config,
        fallbackText: result.visualization.fallbackText
      },
      region: result.data.metadata.region,
      data_summary: {
        profiles: result.data.profiles,
        profileCount: result.data.metadata.totalProfiles,
        timeRange: result.data.metadata.dateRange,
        hasData: !result.data.isEmpty,
        region: result.data.metadata.region
      },
      mode: 'explorer',
      // Add debugging info
      debug: {
        mcpResponse: result.analysis,
        dataCount: result.data.profiles.length,
        hasRealData: result.analysis.hasRealData
      }
    }
  }
}

/**
 * Create graceful failure response
 * NO template content, NO hardcoded responses
 */
function createFailureResponse(error: string, mode: string): any {
  const baseResponse = {
    summary: "System currently unable to generate result. Please retry.",
    error,
    timestamp: new Date().toISOString(),
    source: 'mcp_failure',
    success: false,
    mode
  }

  // Mode-specific failure formatting
  if (mode === 'power') {
  return {
      ...baseResponse,
      technical_analysis: {
        error: "Pipeline execution failed",
        recommendation: "Check system status and retry query"
      },
      data_quality: null,
      visualization_specs: null
    }
  } else {
  return {
      ...baseResponse,
      conversational_insights: [],
      visualization: null,
      data_summary: null
    }
  }
}
