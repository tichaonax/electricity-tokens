const path = require('path');

// Service configuration
const SERVICE_CONFIG = {
  // Service identification
  name: 'ElectricityTokensTracker',
  description:
    'Electricity Tokens Tracker - A web application for tracking electricity token purchases and usage',

  // Application paths
  appRoot: path.resolve(__dirname, '../..'),
  script: path.resolve(__dirname, 'service-wrapper.js'),

  // Service options
  nodeOptions: ['--max-old-space-size=1024'],

  // Environment variables
  env: {
    NODE_ENV: 'production',
    PORT: process.env.PORT || 3000,

    // Database URL from environment or default
    DATABASE_URL: process.env.DATABASE_URL,

    // NextAuth configuration
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ||
      `http://localhost:${process.env.PORT || 3000}`,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

    // Other environment variables
    ...process.env,
  },

  // Logging configuration
  logOnAs: {
    domain: '',
    account: '',
    password: '',
  },

  // Recovery options
  restart: {
    // Restart after 1 minute if service crashes
    delay: 60000,
    // Maximum 3 restart attempts per hour
    attempts: 3,
  },

  // Service dependencies (optional)
  dependencies: [
    // Add any Windows services this depends on
    // 'MSSQLSERVER', // Example: if using SQL Server
  ],

  // Installation options
  installOptions: {
    programArgs: [],
    programPath: process.execPath, // Path to node.exe
    workingDirectory: path.resolve(__dirname, '../..'),

    // Auto-start options
    startType: 'Automatic', // Start automatically on boot
    errorControl: 'Normal',

    // Failure actions
    failureActions: {
      resetPeriod: 3600, // Reset failure count after 1 hour
      rebootMessage: 'Electricity Tokens Tracker service failed',
      actions: [
        { type: 'restart', delay: 60000 }, // First failure: restart after 1 minute
        { type: 'restart', delay: 60000 }, // Second failure: restart after 1 minute
        { type: 'restart', delay: 300000 }, // Third failure: restart after 5 minutes
      ],
    },
  },
};

module.exports = SERVICE_CONFIG;
