/**
 * LLM Provider Hierarchy Controller
 * Enforces strict Groq → HuggingFace → graceful failure pattern
 */

import { z } from 'zod';

// Provider Types
export enum ProviderType {
  GROQ = 'groq',
  HUGGINGFACE = 'huggingface'
}

// Provider Response Schema
const ProviderResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number()
  }).optional(),
  model: z.string(),
  provider: z.string()
});

export type ProviderResponse = z.infer<typeof ProviderResponseSchema>;

// Provider Health Status
export interface ProviderHealthStatus {
  isHealthy: boolean;
  lastError?: string;
  lastChecked: Date;
  responseTime?: number;
}

// Provider Interface
export interface LLMProvider {
  name: ProviderType;
  isAvailable(): Promise<boolean>;
  generateResponse(prompt: string): Promise<ProviderResponse>;
  getHealthStatus(): ProviderHealthStatus;
}

// Groq Provider Implementation
class GroqProvider implements LLMProvider {
  name = ProviderType.GROQ;
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';
  private model = 'llama-3.1-8b-instant';
  private healthStatus: ProviderHealthStatus = {
    isHealthy: true,
    lastChecked: new Date()
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      this.healthStatus = {
        isHealthy,
        lastChecked: new Date(),
        responseTime,
        lastError: isHealthy ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

      return isHealthy;
    } catch (error) {
      this.healthStatus = {
        isHealthy: false,
        lastChecked: new Date(),
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
      return false;
    }
  }

  async generateResponse(prompt: string): Promise<ProviderResponse> {
    if (!await this.isAvailable()) {
      throw new Error(`Groq provider is not available: ${this.healthStatus.lastError}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2048,
          temperature: 0.1,
          stream: false
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        model: this.model,
        provider: this.name
      };
    } catch (error) {
      this.healthStatus.isHealthy = false;
      this.healthStatus.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  getHealthStatus(): ProviderHealthStatus {
    return { ...this.healthStatus };
  }
}

// HuggingFace Provider Implementation  
class HuggingFaceProvider implements LLMProvider {
  name = ProviderType.HUGGINGFACE;
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  private model = 'microsoft/DialoGPT-large';
  private healthStatus: ProviderHealthStatus = {
    isHealthy: true,
    lastChecked: new Date()
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'test',
          options: { wait_for_model: false }
        }),
        signal: AbortSignal.timeout(5000)
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok || response.status === 503; // 503 is model loading

      this.healthStatus = {
        isHealthy,
        lastChecked: new Date(),
        responseTime,
        lastError: isHealthy ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

      return isHealthy;
    } catch (error) {
      this.healthStatus = {
        isHealthy: false,
        lastChecked: new Date(),
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
      return false;
    }
  }

  async generateResponse(prompt: string): Promise<ProviderResponse> {
    if (!await this.isAvailable()) {
      throw new Error(`HuggingFace provider is not available: ${this.healthStatus.lastError}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.1,
            return_full_text: false
          },
          options: { wait_for_model: true }
        }),
        signal: AbortSignal.timeout(60000) // 60 second timeout for model loading
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || '';
      
      return {
        content: content.trim(),
        model: this.model,
        provider: this.name
      };
    } catch (error) {
      this.healthStatus.isHealthy = false;
      this.healthStatus.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  getHealthStatus(): ProviderHealthStatus {
    return { ...this.healthStatus };
  }
}

// Provider Controller - Enforces hierarchy and failover
export class LLMProviderController {
  private providers: LLMProvider[] = [];
  private failureLog: Array<{ provider: string; error: string; timestamp: Date }> = [];

  constructor(groqApiKey?: string, huggingFaceApiKey?: string) {
    // Initialize providers in hierarchy order: Groq first, then HuggingFace
    if (groqApiKey && groqApiKey !== 'your_groq_api_key_here') {
      this.providers.push(new GroqProvider(groqApiKey));
    }
    
    if (huggingFaceApiKey && huggingFaceApiKey !== 'your_huggingface_api_key_here') {
      this.providers.push(new HuggingFaceProvider(huggingFaceApiKey));
    }

    if (this.providers.length === 0) {
      console.warn('⚠️  No LLM providers configured. System will return graceful failure messages.');
    }
  }

  /**
   * Generate response using provider hierarchy
   * Tries Groq first, falls back to HuggingFace, then graceful failure
   */
  async generateResponse(prompt: string): Promise<string> {
    if (this.providers.length === 0) {
      return "System currently unable to generate result. Please retry.";
    }

    let lastError: string = '';

    for (const provider of this.providers) {
      try {
        console.log(`🔄 Attempting to use ${provider.name} provider...`);
        
        const response = await provider.generateResponse(prompt);
        
        console.log(`✅ Successfully generated response using ${provider.name}`);
        
        // Log success after previous failures
        if (lastError) {
          console.log(`✅ Failover successful: ${provider.name} recovered after ${lastError}`);
        }
        
        return response.content;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = errorMessage;
        
        // Log the failure
        this.failureLog.push({
          provider: provider.name,
          error: errorMessage,
          timestamp: new Date()
        });
        
        console.error(`❌ ${provider.name} provider failed: ${errorMessage}`);
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed - return graceful failure message
    console.error('❌ All LLM providers failed. Returning graceful failure message.');
    return "System currently unable to generate result. Please retry.";
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    return {
      providers: this.providers.map(provider => ({
        name: provider.name,
        health: provider.getHealthStatus()
      })),
      recentFailures: this.failureLog.slice(-10), // Last 10 failures
      timestamp: new Date()
    };
  }

  /**
   * Test all providers and return status
   */
  async testAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const provider of this.providers) {
      results[provider.name] = await provider.isAvailable();
    }
    
    return results;
  }
}

// Anti-hallucination guards
export class ResponseValidator {
  private static TEMPLATE_PATTERNS = [
    /here's a fun fact/i,
    /did you know that/i,
    /interesting observation/i,
    /as we can see from the data/i,
    /the analysis shows that/i,
    /based on historical patterns/i
  ];

  private static HARDCODED_RESPONSES = [
    'last week',
    'recent trends show', 
    'typical ocean patterns',
    'standard analysis indicates'
  ];

  /**
   * Validate that response contains real data references and is not templated
   */
  static validateResponse(response: string, hasRealData: boolean): boolean {
    if (!hasRealData) {
      console.warn('⚠️  Response rejected: no real data flag');
      return false; // Must have real data to be valid
    }

    // Only check for obvious template patterns, be less aggressive
    const obviousTemplates = [
      /^here's a fun fact about/i,
      /^did you know that the ocean/i,
      /this is a placeholder/i,
      /lorem ipsum/i,
      /sample data shows/i
    ];

    for (const pattern of obviousTemplates) {
      if (pattern.test(response)) {
        console.warn('⚠️  Response contains obvious template pattern, rejecting');
        return false;
      }
    }

    // Check for hardcoded responses - be more lenient
    const lowerResponse = response.toLowerCase();
    const obviousHardcoded = [
      'this is sample data',
      'placeholder response',
      'mock analysis'
    ];
    
    for (const hardcoded of obviousHardcoded) {
      if (lowerResponse.includes(hardcoded.toLowerCase())) {
        console.warn('⚠️  Response contains hardcoded text, rejecting');
        return false;
      }
    }

    return true;
  }

  /**
   * Ensure response references actual retrieved data
   */
  static requiresRealData(response: string): boolean {
    // Response must mention specific values, coordinates, or measurements
    const dataPatterns = [
      /\d+\.\d+°/,  // Coordinates
      /\d+\s*(°C|celsius|temperature)/i, // Temperature
      /\d+\s*(m|meters|depth)/i, // Depth
      /\d+\s*(psu|salinity)/i, // Salinity
      /\d{4}-\d{2}-\d{2}/, // Dates
      /profile\s*\d+/i, // Profile IDs
      /float\s*\d+/i // Float IDs
    ];

    return dataPatterns.some(pattern => pattern.test(response));
  }
}
