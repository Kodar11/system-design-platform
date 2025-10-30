// Environment configuration with sensible defaults
export const env = {
  // App URLs
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Auth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  
  // Performance settings
  ENABLE_CACHE: process.env.NODE_ENV === 'production',
  CACHE_DURATION: parseInt(process.env.CACHE_DURATION || '3600', 10),
  
  // Rate limiting
  RATE_LIMIT_REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10),
  RATE_LIMIT_DURATION: parseInt(process.env.RATE_LIMIT_DURATION || '60000', 10),
  
  // Feature flags
  ENABLE_PWA: process.env.ENABLE_PWA === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false', // Enabled by default
  
  // Node environment
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}

// Call validation on import in development
if (process.env.NODE_ENV !== 'production') {
  validateEnv();
}
