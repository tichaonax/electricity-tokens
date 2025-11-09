/**
 * PM2 Ecosystem Configuration - Staging Environment
 * 
 * Purpose: Manages the Electricity Tokens application in staging environment
 * Usage: pm2 start ecosystem.staging.config.js
 * 
 * Features:
 * - Single instance for staging (no clustering needed)
 * - Auto-restart on crashes
 * - Memory limit: 1GB
 * - Separate port from production (3001 vs 3000)
 * - Staging environment variables
 */

module.exports = {
  apps: [{
    // Application Configuration
    name: 'electricity-tokens-staging',
    script: 'npm',
    args: 'start',
    
    // Instance Configuration
    instances: 1,           // Single instance for staging
    exec_mode: 'fork',      // Fork mode (not cluster)
    
    // Restart Configuration
    autorestart: true,      // Auto-restart on crash
    watch: false,           // Don't watch files (use npm run dev for development)
    max_restarts: 10,       // Max restarts within restart delay
    min_uptime: '10s',      // Minimum uptime before considered stable
    restart_delay: 4000,    // Delay between restarts (ms)
    
    // Memory Management
    max_memory_restart: '1G',  // Restart if memory exceeds 1GB
    
    // Environment Variables
    env: {
      NODE_ENV: 'staging',
      PORT: 3001,           // Different from production (3000)
      APP_NAME: 'Electricity Tokens Tracker (STAGING)'
    },
    
    // Logging Configuration
    error_file: './logs/staging-error.log',
    out_file: './logs/staging-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Advanced Options
    kill_timeout: 5000,     // Time to wait before force kill (ms)
    listen_timeout: 3000,   // Time to wait for app to listen (ms)
    
    // Environment-specific settings
    node_args: '--max-old-space-size=1024'  // Node.js heap size
  }],
  
  // Deployment Configuration (optional - for automated deployments)
  deploy: {
    staging: {
      // SSH Configuration
      user: 'deploy',
      host: 'staging-server.example.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/electricity-tokens.git',
      path: '/var/www/electricity-tokens-staging',
      
      // Pre-deployment commands
      'pre-deploy': 'git fetch --all',
      
      // Deployment commands
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.staging.config.js',
      
      // Environment variables for deployment
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
