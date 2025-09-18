// Ocean Data Platform - Production Environment Configuration
// This file consolidates all environment variables for production deployment

module.exports = {
  // Argovis API Configuration  
  ARGOVIS_API_KEY: '748fbfd67cd8556d064a0dd54351ce0ef89d4f08',
  ARGOVIS_BASE_URL: 'https://argovis-api.colorado.edu',
  
  // Database Configuration
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432', 
  POSTGRES_USER: 'ocean_ai',
  POSTGRES_PASSWORD: 'ocean_ai_password',
  POSTGRES_DB: 'ocean_ai_db',
  
  // Redis Configuration
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  
  // LLM Provider APIs - Production Ready
  GROQ_API_KEY: process.env.GROQ_API_KEY || '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',
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || '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',
  HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN || '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',
  
  // Model Configuration
  GROQ_API_URL: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  NEXT_PUBLIC_GROQ_MODEL: process.env.NEXT_PUBLIC_GROQ_MODEL || 'llama-3.1-8b-instant',
  HF_LOCAL_MODEL: process.env.HF_LOCAL_MODEL || 'microsoft/DialoGPT-medium',
  NEXT_PUBLIC_HUGGINGFACE_MODEL: process.env.NEXT_PUBLIC_HUGGINGFACE_MODEL || 'microsoft/DialoGPT-medium',
  HF_LOCAL_ALLOW_DOWNLOAD: process.env.HF_LOCAL_ALLOW_DOWNLOAD || 'false',
  
  // Application Configuration
  NODE_ENV: 'production',
  PYTHONPATH: '.'
};
