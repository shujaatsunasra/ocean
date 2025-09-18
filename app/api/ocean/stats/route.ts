import { NextResponse } from 'next/server'

async function callMCPServer(method: string, params: any): Promise<any> {
    try {
        // MCP server is not available in Vercel serverless environment
        // Skip MCP server calls in production
        if (process.env.NODE_ENV === 'production') {
            throw new Error('MCP server not available in production');
        }

        const response = await fetch('http://localhost:5001/api/mcp/' + method, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`MCP server error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.log('MCP server not available:', error);
        throw error;
    }
}

export async function GET() {
    try {
        // Try to get real-time stats from MCP server first
        try {
            const mcpResponse = await callMCPServer('get_real_time_metrics', {})

            if (mcpResponse && mcpResponse.result) {
                const data = mcpResponse.result
                
                return NextResponse.json({
                    temperature: data.mean_temperature || 21.5,
                    salinity: data.mean_salinity || 35.1,
                    currentSpeed: 1.2 + (Math.random() - 0.5) * 0.6,
                    avgDepth: 4200 + (Math.random() - 0.5) * 400,
                    source: 'ai_mcp_server',
                    profileCount: data.sample_count || 100,
                    lastUpdated: new Date().toISOString(),
                    learning_score: data.learning_score || 0.85,
                    ai_enhanced: true
                })
            }
        } catch (error) {
            console.log('MCP server not available, trying Argovis API:', error instanceof Error ? error.message : String(error))
        }

        // Fallback to Argovis API
        try {
            const argovisResponse = await fetch('https://argovis-api.colorado.edu/profiles?limit=100', {
                headers: {
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(5000)
            })

            if (argovisResponse.ok) {
                const profiles = await argovisResponse.json()

                if (Array.isArray(profiles) && profiles.length > 0) {
                    // Calculate real stats from recent profiles
                    const temperatures = profiles
                        .filter(p => p.measurements && p.measurements.length > 0)
                        .map(p => p.measurements[0].temperature)
                        .filter(t => t !== null && t !== undefined)

                    const salinities = profiles
                        .filter(p => p.measurements && p.measurements.length > 0)
                        .map(p => p.measurements[0].salinity)
                        .filter(s => s !== null && s !== undefined)

                    if (temperatures.length > 0 && salinities.length > 0) {
                        const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length
                        const avgSalinity = salinities.reduce((a, b) => a + b, 0) / salinities.length

                        return NextResponse.json({
                            temperature: avgTemp,
                            salinity: avgSalinity,
                            currentSpeed: Math.random() * 2 + 0.5, // Mock for now
                            avgDepth: 3800 + Math.random() * 800,
                            source: 'argovis_live',
                            profileCount: profiles.length,
                            lastUpdated: new Date().toISOString()
                        })
                    }
                }
            }
        } catch (error) {
            console.log('Argovis API not available, using enhanced mock data')
        }

        // Enhanced mock data with realistic variations
        const now = new Date()
        const hourOfDay = now.getHours()

        // Simulate daily temperature variation
        const baseTemp = 22.5 + Math.sin((hourOfDay / 24) * 2 * Math.PI) * 2
        const tempVariation = (Math.random() - 0.5) * 1.5

        return NextResponse.json({
            temperature: baseTemp + tempVariation,
            salinity: 35.1 + (Math.random() - 0.5) * 0.8,
            currentSpeed: 1.2 + (Math.random() - 0.5) * 0.6,
            avgDepth: 4200 + (Math.random() - 0.5) * 400,
            source: 'enhanced_simulation',
            lastUpdated: now.toISOString()
        })

    } catch (error) {
        console.error('Stats API Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ocean statistics' },
            { status: 500 }
        )
    }
}