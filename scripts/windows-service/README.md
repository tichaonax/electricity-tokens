# Windows Service Support for Electricity Tokens Tracker

This directory contains scripts and configuration for running the Electricity Tokens Tracker as a Windows service. Running as a service provides automatic startup on system boot, crash recovery, and better integration with Windows server environments.

## 🎯 Features

- **Auto-start**: Service starts automatically when Windows boots
- **Crash Recovery**: Automatic restart on application crashes
- **Logging**: Integrated with Windows Event Log and file logging
- **Production Ready**: Ensures production build before starting
- **Graceful Shutdown**: Proper cleanup on service stop
- **Easy Management**: Simple install/uninstall process

## 📋 Prerequisites

### System Requirements

- Windows 10/11 or Windows Server 2016+
- Node.js 18.0 or higher
- Administrator privileges
- Properly configured application environment

### Application Setup

Before installing as a service, ensure your application is properly configured:

1. **Environment Variables**: Set up all required environment variables

   ```bash
   # Database connection
   DATABASE_URL=your_database_connection_string

   # NextAuth configuration
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000

   # Application port (optional)
   PORT=3000
   ```

2. **Dependencies**: Install all dependencies

   ```bash
   npm install
   ```

3. **Database**: Ensure database is set up and accessible
   ```bash
   npm run db:setup
   ```

## 🚀 Installation

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Install the Service

**⚠️ Must be run as Administrator**

```bash
# Open PowerShell or Command Prompt as Administrator
npm run service:install

# If the above fails, try the simple installer:
npm run service:install-simple
```

The installation process will:

- Validate the environment
- Check for existing service installations
- Create necessary directories
- Register the service with Windows
- Configure crash recovery options
- Start the service

### Step 3: Verify Installation

```bash
npm run service:status
```

## 🛠️ Service Management

### Available Commands

| Command                     | Description                   |
| --------------------------- | ----------------------------- |
| `npm run service:install`   | Install and start the service |
| `npm run service:uninstall` | Stop and remove the service   |
| `npm run service:start`     | Start the service             |
| `npm run service:stop`      | Stop the service              |
| `npm run service:status`    | Check service status          |

### Manual Windows Commands

You can also use Windows Service Control (sc) commands directly:

```cmd
# Check status
sc query "ElectricityTokensTracker"

# Start service
sc start "ElectricityTokensTracker"

# Stop service
sc stop "ElectricityTokensTracker"

# Delete service (after stopping)
sc delete "ElectricityTokensTracker"
```

## 📊 Monitoring and Logs

### File Logs

Service logs are written to:

```
<app-root>/logs/service.log
```

### Windows Event Viewer

1. Open Windows Event Viewer
2. Navigate to: Windows Logs → Application
3. Filter by Source: "ElectricityTokensTracker"

### Log Levels

- **INFO**: Normal operation messages
- **WARN**: Warning conditions
- **ERROR**: Error conditions

## 🔧 Configuration

### Service Configuration

Edit `scripts/windows-service/config.js` to customize:

```javascript
const SERVICE_CONFIG = {
  name: 'ElectricityTokensTracker',
  description: 'Your custom description',

  // Port configuration
  env: {
    PORT: 3000,
    NODE_ENV: 'production',
    // Add your environment variables here
  },

  // Recovery options
  restart: {
    delay: 60000, // Restart delay in milliseconds
    attempts: 3, // Max restart attempts per hour
  },
};
```

### Environment Variables

The service inherits environment variables from the installation context. For production deployments, consider:

1. **System Environment Variables**: Set via Windows System Properties
2. **Service Account**: Configure service to run under specific account
3. **Startup Type**: Automatic (default) or Manual

## 🔄 Updating the Application

When updating the application code:

1. **Stop the service**:

   ```bash
   npm run service:stop
   ```

2. **Update your code** (git pull, etc.)

3. **Install new dependencies** (if any):

   ```bash
   npm install
   ```

4. **Start the service**:
   ```bash
   npm run service:start
   ```

The service will automatically rebuild the application if needed.

## 🚨 Troubleshooting

### Common Issues

#### Service Installation Hangs

1. **Try the simple installer**:

   ```bash
   npm run service:install-simple
   ```

2. **Check if node-windows is properly installed**:

   ```bash
   npm install node-windows --save
   ```

3. **Manual service creation**:
   ```bash
   sc create "ElectricityTokensTracker" binPath= "\"C:\path\to\node.exe\" \"C:\path\to\service-wrapper.js\"" start= auto
   ```

#### Service Won't Start

1. Check if running as Administrator
2. Verify all environment variables are set
3. Check Windows Event Viewer for detailed errors
4. Ensure database is accessible
5. Verify Node.js path is correct

#### Database Connection Issues

1. Check DATABASE_URL environment variable
2. Verify database server is running
3. Test connection from service account context
4. Check network connectivity and firewall rules

#### Port Already in Use

1. Check what's using the port: `netstat -ano | findstr :3000`
2. Change PORT environment variable
3. Stop conflicting applications

#### Permission Issues

1. Service runs as SYSTEM by default
2. Database/file permissions may need adjustment
3. Consider running service under specific account

### Diagnostic Commands

```bash
# Check Node.js version
node --version

# Test application manually
npm run build
npm start

# Check environment variables
set | findstr DATABASE_URL

# Test database connection
npm run db:setup
```

### Log Analysis

Check the service log for common patterns:

```bash
# View recent logs
type logs\service.log | findstr /C:"ERROR"
type logs\service.log | findstr /C:"WARN"
```

## 📁 File Structure

```
scripts/windows-service/
├── config.js              # Service configuration
├── service-wrapper.js     # Main service runner
├── install-service.js     # Installation script
├── uninstall-service.js   # Uninstallation script
└── README.md              # This documentation
```

## 🔒 Security Considerations

### Service Account

- Service runs as LOCAL SYSTEM by default
- Consider creating dedicated service account for production
- Grant minimum required permissions

### Network Security

- Configure Windows Firewall rules
- Use HTTPS in production
- Secure database connections

### Environment Variables

- Store sensitive data in Windows Credential Manager
- Use encrypted configuration files
- Rotate secrets regularly

## 🏭 Production Deployment

### Best Practices

1. **Dedicated Server**: Use dedicated Windows Server
2. **Service Account**: Create dedicated service account
3. **Monitoring**: Set up monitoring and alerting
4. **Backups**: Regular database and configuration backups
5. **Updates**: Plan for application updates
6. **SSL/TLS**: Configure HTTPS with proper certificates

### Deployment Checklist

- [ ] Server prepared with Node.js and dependencies
- [ ] Database configured and accessible
- [ ] Environment variables set
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Firewall rules configured
- [ ] Service account created (if needed)
- [ ] Monitoring configured
- [ ] Backup procedures in place
- [ ] Service installed and tested
- [ ] Documentation updated

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Review logs in Windows Event Viewer
3. Check application logs in `logs/service.log`
4. Test application manually first
5. Check GitHub issues for similar problems

## 🔄 Version History

- **v1.0.0**: Initial Windows service support
  - Basic service installation and management
  - Crash recovery and auto-restart
  - Logging integration
  - Production build automation
