// Environment configuration for Vercel deployment
// This replaces the require() approach with proper environment variable handling

export const config = {
  // Argovis API Configuration
  argovisApiKey: process.env.ARGOVIS_API_KEY || '748fbfd67cd8556d064a0dd54351ce0ef89d4f08',
  argovisBaseUrl: process.env.ARGOVIS_BASE_URL || 'https://argovis-api.colorado.edu',
  
  // LLM Provider APIs
  groqApiKey: process.env.GROQ_API_KEY,
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY,
  huggingFaceToken: process.env.HUGGINGFACE_TOKEN,
  
  // Model Configuration
  groqApiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  huggingFaceModel: process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-medium',
  
  // Application Configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  timeoutMs: process.env.NODE_ENV === 'production' ? 15000 : 10000,
  enableFailureExpansion: true,
  
  // Database Configuration (for future use)
  postgresHost: process.env.POSTGRES_HOST,
  postgresPort: process.env.POSTGRES_PORT,
  postgresUser: process.env.POSTGRES_USER,
  postgresPassword: process.env.POSTGRES_PASSWORD,
  postgresDb: process.env.POSTGRES_DB,
  
  // Redis Configuration (for future use)
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
}

// Validation function to check required environment variables
export function validateConfig() {
  const required = ['ARGOVIS_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  return missing.length === 0;
}
