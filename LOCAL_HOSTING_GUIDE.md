# 🏠 Local Home Network Hosting Guide

## Electricity Tokens Tracker - Windows Laptop Setup

This comprehensive guide will help you host the Electricity Tokens Tracker application locally on your Windows laptop for household use. Perfect for 5-user households who want complete control over their data without monthly hosting fees.

---

## 📋 Prerequisites & Requirements

### Hardware Requirements

- **Windows laptop** with at least 4GB RAM (8GB recommended)
- **50GB free disk space** (for software and data)
- **Stable internet connection** for initial setup and updates
- **Always-on availability** when users need access (laptop stays on)

### Network Requirements

- **Home WiFi network** that all users can access
- **Static local IP address** (we'll configure this)
- **Router admin access** (optional, for easier setup)
- **Windows 10/11** operating system

### User Requirements

- **5 household members** with devices (phones, tablets, computers)
- **Basic computer skills** for initial setup
- **One designated admin** for system management

---

## 💻 Step 1: Install Required Software

### 1.1 Install Node.js

1. **Download Node.js**:
   - Visit: [https://nodejs.org/](https://nodejs.org/)
   - Choose **LTS version** (currently Node.js 20.x)
   - Download the Windows Installer (.msi)

2. **Install Node.js**:
   - Run the downloaded installer
   - **Check "Automatically install necessary tools"** during setup
   - Use default settings for everything else
   - **Restart your computer** after installation

3. **Verify Installation**:
   ```cmd
   # Open Command Prompt (cmd)
   node --version
   npm --version
   # Should show version numbers
   ```

### 1.2 Install Git

1. **Download Git**:
   - Visit: [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - Download the installer

2. **Install Git**:
   - Run the installer
   - Use **default settings** throughout
   - Choose "Git from the command line and also from 3rd-party software"

3. **Verify Installation**:
   ```cmd
   git --version
   # Should show Git version
   ```

### 1.3 Install PostgreSQL Database

1. **Download PostgreSQL**:
   - Visit: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Choose **Version 15 or 16** (latest stable)
   - Download the Windows installer

2. **Install PostgreSQL**:
   - Run the installer
   - **Remember the password** you set for 'postgres' user! (Write it down)
   - Use default port: `5432`
   - Install pgAdmin (database management tool)
   - Install all components offered

3. **Verify Installation**:
   - Look for **pgAdmin** in Start Menu
   - PostgreSQL service should be running automatically

### 1.4 Install Text Editor (Optional)

For configuration file editing:

- **Notepad++**: [https://notepad-plus-plus.org/](https://notepad-plus-plus.org/)
- **VS Code**: [https://code.visualstudio.com/](https://code.visualstudio.com/) (if you want advanced features)

---

## 🗄️ Step 2: Database Setup

### 2.1 Create Database Using pgAdmin

1. **Open pgAdmin**:
   - Find pgAdmin in Start Menu and open it
   - Enter the master password if prompted (same as postgres password)

2. **Connect to PostgreSQL**:
   - Expand "Servers" in the left panel
   - Right-click "PostgreSQL 15" (or your version)
   - Enter the postgres password you set during installation

3. **Create Database**:
   - Right-click "Databases" → "Create" → "Database..."
   - **Database name**: `electricity_tokens`
   - **Owner**: `postgres`
   - Click "Save"

### 2.2 Alternative: Command Line Setup

If you prefer command line:

```cmd
# Open Command Prompt as Administrator
# (Right-click Command Prompt → "Run as administrator")

# Connect to PostgreSQL
psql -U postgres

# Enter your postgres password when prompted

# Create the database
CREATE DATABASE electricity_tokens;

# Exit PostgreSQL
\q
```

### 2.3 Verify Database Creation

In pgAdmin, you should see `electricity_tokens` listed under Databases.

---

## 🚀 Step 3: Download and Install the Application

### 3.1 Create Application Directory

```cmd
# Open Command Prompt
# Navigate to C: drive root
cd C:\

# Create directory for the application
mkdir electricity-app
cd electricity-app
```

### 3.2 Clone the Repository

```cmd
# Download the application from GitHub
git clone https://github.com/tichaonax/electricity-tokens.git

# Enter the application directory
cd electricity-tokens

# Verify files are downloaded
dir
```

You should see folders like `src`, `public`, and files like `package.json`, `README.md`.

### 3.3 Install Application Dependencies

```cmd
# Install all required packages (this may take 5-10 minutes)
npm install
```

**Wait for completion** - you'll see many packages being downloaded and installed.

### 3.4 Configure Environment Variables

1. **Copy the example configuration**:

   ```cmd
   copy .env.example .env.local
   ```

2. **Edit the configuration file**:

   ```cmd
   # Open with Notepad
   notepad .env.local
   ```

3. **Configure the following settings** in `.env.local`:

   ```env
   # Database Configuration
   # Replace YOUR_PASSWORD with the postgres password you set
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/electricity_tokens"

   # Application Configuration
   # Replace YOUR_LAPTOP_IP with your actual IP (we'll find this in Step 4)
   NEXTAUTH_URL="http://YOUR_LAPTOP_IP:3000"

   # Security Configuration
   # Generate a random secret key (use any long random string)
   NEXTAUTH_SECRET="electricity-tokens-secret-key-2024-very-long-random-string-here"

   # Email Configuration (Optional - leave blank for now)
   EMAIL_SERVER=""
   EMAIL_FROM=""

   # Production Settings
   NODE_ENV="production"
   ```

   **Example with sample values**:

   ```env
   DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/electricity_tokens"
   NEXTAUTH_URL="http://192.168.1.100:3000"
   NEXTAUTH_SECRET="my-super-secret-key-for-electricity-tokens-app-2024"
   EMAIL_SERVER=""
   EMAIL_FROM=""
   NODE_ENV="production"
   ```

4. **Save and close** the file (Ctrl+S in Notepad)

### 3.5 Set Up Database Schema

```cmd
# Option 1: Interactive setup (recommended for first-time users)
npm run db:setup

# Option 2: Automated setup (for experienced users)
npm run db:init

# Option 3: Manual setup (if above commands fail)
npx prisma generate
npx prisma db push --accept-data-loss
```

**Success indicators**:

- No error messages
- "Database initialization completed successfully" message
- All 7 tables created (users, accounts, sessions, verification_tokens, token_purchases, user_contributions, audit_logs)

**⚠️ Important**: If you get a 500 error when trying to sign in, it means the database setup didn't complete properly. See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for troubleshooting.
- Database tables created

---

## 🌐 Step 4: Network Configuration

### 4.1 Find Your Laptop's IP Address

1. **Method 1 - Command Prompt**:

   ```cmd
   ipconfig
   ```

   Look for "IPv4 Address" under your WiFi adapter (usually something like `192.168.1.XXX`)

2. **Method 2 - Windows Settings**:
   - Open Settings → Network & Internet
   - Click on WiFi → Hardware properties
   - Note the IPv4 address

**Example**: Your IP might be `192.168.1.100` or `192.168.0.150`

### 4.2 Set Static IP Address (Recommended)

**Why**: Prevents IP address from changing, ensuring consistent access.

1. **Open Network Settings**:
   - Right-click WiFi icon in system tray
   - Click "Open Network & Internet settings"
   - Click "Change adapter options"

2. **Configure WiFi Adapter**:
   - Right-click your WiFi connection
   - Select "Properties"
   - Select "Internet Protocol Version 4 (TCP/IPv4)"
   - Click "Properties"

3. **Set Static IP**:
   - Choose "Use the following IP address"
   - **IP address**: `192.168.1.100` (use an unused IP in your range)
   - **Subnet mask**: `255.255.255.0`
   - **Default gateway**: `192.168.1.1` (your router's IP)
   - **Preferred DNS server**: `8.8.8.8`
   - **Alternate DNS server**: `8.8.4.4`
   - Click "OK" to save

4. **Test connectivity**:
   ```cmd
   ping google.com
   # Should show successful pings
   ```

### 4.3 Configure Windows Firewall

**Allow the application through Windows Firewall**:

1. **Method 1 - Command Line (Recommended)**:

   ```cmd
   # Run Command Prompt as Administrator
   # Right-click Command Prompt → "Run as administrator"

   netsh advfirewall firewall add rule name="Electricity Tokens App" dir=in action=allow protocol=TCP localport=3000
   ```

2. **Method 2 - Windows Firewall GUI**:
   - Open Windows Security → Firewall & network protection
   - Click "Allow an app through firewall"
   - Click "Change Settings" → "Allow another app"
   - Browse to `C:\electricity-app\electricity-tokens\`
   - Add the Node.js executable and allow both Private and Public networks

### 4.4 Update Environment Configuration

Now that you have your static IP, update `.env.local`:

```cmd
notepad .env.local
```

Update the NEXTAUTH_URL line:

```env
NEXTAUTH_URL="http://192.168.1.100:3000"
```

(Replace `192.168.1.100` with your actual static IP)

---

## ▶️ Step 5: Build and Start the Application

### 5.1 Build the Application

```cmd
# Navigate to application directory (if not already there)
cd C:\electricity-app\electricity-tokens

# Build the application for production
npm run build
```

**Wait for build completion** - this may take 5-10 minutes. You should see "Build completed" message.

### 5.2 Start the Application

```cmd
# Start the application
npm start
```

**Success indicators**:

- "Ready - started server on 0.0.0.0:3000"
- "Local: http://localhost:3000"
- No error messages

**Keep this Command Prompt window open** - the application runs here.

### 5.3 Test Local Access

1. **Open web browser** on the laptop
2. **Navigate to**: `http://localhost:3000`
3. **You should see** the Electricity Tokens Tracker login page
4. **Success!** The application is running locally

### 5.4 Create Startup Scripts (Optional)

For easier management, create batch files:

1. **Create `start-app.bat`**:

   ```cmd
   notepad start-app.bat
   ```

   Add this content:

   ```batch
   @echo off
   echo Starting Electricity Tokens Tracker...
   cd C:\electricity-app\electricity-tokens
   npm start
   pause
   ```

2. **Create `build-and-start.bat`**:

   ```cmd
   notepad build-and-start.bat
   ```

   Add this content:

   ```batch
   @echo off
   echo Building and Starting Electricity Tokens Tracker...
   cd C:\electricity-app\electricity-tokens
   npm run build
   npm start
   pause
   ```

3. **Save both files** to `C:\electricity-app\`

### 5.5 Auto-Start on Boot (Optional)

To start the application automatically when Windows boots:

1. **Press Win + R**, type `shell:startup`, press Enter
2. **Copy `start-app.bat`** to this folder
3. **Application will start** automatically when Windows starts

**Note**: The Command Prompt window will appear on startup - minimize it but don't close it.

---

## 👥 Step 6: User Access Setup

### 6.1 Create Admin Account

1. **On the laptop**, open browser and go to `http://localhost:3000`
2. **Click "Sign Up"** to create the first account
3. **This first account automatically becomes admin**
4. **Fill in your details**:
   - Full name
   - Email address
   - Secure password
5. **Click "Create Account"**
6. **Login** with your new credentials
7. **Verify you see "Admin Panel"** in the navigation

### 6.2 Test Network Access

1. **On another device** (phone, tablet, another computer)
2. **Ensure it's connected to the same WiFi network**
3. **Open web browser**
4. **Navigate to**: `http://192.168.1.100:3000` (use your laptop's IP)
5. **You should see the same login page**

**If this doesn't work**, check:

- Both devices are on same WiFi network
- Windows Firewall is configured correctly
- IP address is correct

### 6.3 Create User Accounts

**Option 1 - Admin Creates Accounts**:

1. **Login as admin**
2. **Go to Admin Panel → User Management**
3. **Click "Add New User"**
4. **Create accounts** for each household member
5. **Share login credentials** with users

**Option 2 - Users Self-Register**:

1. **Share the URL** `http://192.168.1.100:3000` with users
2. **Users click "Sign Up"** and create their own accounts
3. **Admin can manage permissions** later if needed

### 6.4 User Access Instructions

**Provide these instructions to household members**:

---

## 📱 ELECTRICITY TOKENS TRACKER - USER GUIDE

### How to Access the App

1. **Connect to home WiFi** (same network as the laptop)
2. **Open any web browser** (Chrome, Firefox, Safari, Edge)
3. **Go to**: `http://192.168.1.100:3000`
   _(Replace with your actual laptop IP address)_
4. **Bookmark this page** for easy access
5. **Create your account** or login with provided credentials

### Mobile Device Setup

1. **Follow steps above** on your phone/tablet
2. **Add to home screen**:
   - **iPhone**: Share button → "Add to Home Screen"
   - **Android**: Menu → "Add to Home screen"
3. **Use like a regular app!**

### What You Can Do

- ⚡ **Track electricity purchases** (when you buy tokens)
- 📊 **Add your usage** (your meter reading and fair share)
- 📈 **View reports** (your consumption and costs)
- 💰 **See your balance** (whether you owe money or are owed)
- 🌙 **Choose theme** (light, dark, or automatic)

### Need Help?

- **App not loading?** Check WiFi connection and try again
- **Forgot password?** Contact the admin (laptop owner)
- **Can't create account?** Make sure you're on the home WiFi
- **Other issues?** Contact [Admin Name] at [Admin Phone/Email]

---

---

## 🔧 Step 7: Configuration & Management

### 7.1 Admin Panel Overview

As the admin, you have access to:

- **User Management**: Create, edit, lock/unlock accounts
- **System Settings**: Configure application defaults
- **Data Management**: Backup, restore, export data
- **Security Dashboard**: Monitor activity and audit logs
- **System Reports**: Usage statistics and performance

### 7.2 Regular Backup Setup

**Critical for data safety!**

1. **Go to Admin Panel → Data Management → Backup & Restore**
2. **Create your first backup**:
   - Choose "Full Backup"
   - Include audit logs
   - Click "Create Backup"
   - Save to external drive or cloud storage

3. **Set up regular backups**:
   - **Weekly**: Create full backups
   - **Monthly**: Archive backups to external location
   - **Before updates**: Always backup before changes

### 7.3 Router Configuration (Optional)

Make access easier with a custom domain:

1. **Access your router admin panel**:
   - Usually `http://192.168.1.1` or `http://192.168.0.1`
   - Login with router admin credentials

2. **Add DNS entry** (if supported):
   - **Host name**: `electricity.home`
   - **IP address**: `192.168.1.100` (your laptop IP)

3. **Users can then access**: `http://electricity.home:3000`

### 7.4 Performance Optimization

**For best performance with 5 users**:

1. **Laptop Settings**:
   - Set power plan to "High Performance"
   - Disable sleep mode when plugged in
   - Close unnecessary programs

2. **Application Settings**:
   - Restart the app weekly
   - Monitor database size (backup old data if needed)
   - Keep Windows updated

---

## 📱 Step 8: Mobile & Device Optimization

### 8.1 Progressive Web App (PWA) Installation

The app supports installation like a native app:

**On Mobile Devices**:

1. **Visit the app** in browser
2. **Look for install prompt** or browser menu
3. **Choose "Add to Home Screen"** or "Install App"
4. **App appears** like a regular mobile app

**On Desktop**:

1. **Visit app in Chrome/Edge**
2. **Look for install icon** in address bar
3. **Click install** for desktop app experience

### 8.2 Bookmark Setup

Help users create easy access:

**Desktop Browsers**:

- Press `Ctrl+D` when on the app page
- Name: "Electricity Tracker"

**Mobile Browsers**:

- Use browser's bookmark or "Add to Home Screen" feature
- Pin to start screen for easy access

### 8.3 Multiple Device Testing

Test access from:

- [ ] Windows computers
- [ ] iPhones/iPads
- [ ] Android phones/tablets
- [ ] Smart TVs with browsers
- [ ] Any device with WiFi and browser

---

## 🛠️ Step 9: Maintenance & Troubleshooting

### 9.1 Daily Operations

**Keep These Running**:

- ✅ Laptop powered on and connected to WiFi
- ✅ PostgreSQL service running
- ✅ Application running (Command Prompt window open)
- ✅ Windows Firewall properly configured

**Monitor These**:

- Laptop performance (RAM, CPU usage)
- Internet connectivity
- Application responsiveness

### 9.2 Weekly Maintenance

**Every Sunday** (recommended):

1. **Restart the application**:

   ```cmd
   # In the running Command Prompt, press Ctrl+C to stop
   # Then restart:
   npm start
   ```

2. **Create backup**:
   - Admin Panel → Data Management → Create Backup
   - Save to external drive

3. **Check Windows Updates**:
   - Settings → Update & Security → Windows Update

4. **Clean up disk space**:
   - Delete temporary files
   - Empty recycle bin

### 9.3 Monthly Maintenance

1. **Full system restart**:
   - Restart Windows laptop
   - Restart application

2. **Database maintenance**:
   - Check database size in pgAdmin
   - Archive old data if needed

3. **Security review**:
   - Review audit logs in Admin Panel
   - Check user accounts and permissions

### 9.4 Common Issues & Solutions

| **Problem**                         | **Symptoms**                  | **Solution**                                                         |
| ----------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| **Can't access from other devices** | "This site can't be reached"  | Check firewall settings, verify IP address, ensure same WiFi network |
| **Application won't start**         | Command prompt shows errors   | Check PostgreSQL is running, verify database connection              |
| **Slow performance**                | Pages load slowly, timeouts   | Restart laptop, close other programs, check available RAM            |
| **Database connection errors**      | "Database unavailable" errors | Restart PostgreSQL service, check database credentials               |
| **Users can't login**               | Authentication failures       | Check user accounts in Admin Panel, verify passwords                 |
| **Laptop keeps sleeping**           | App becomes unavailable       | Configure power settings to prevent sleep                            |

### 9.5 Emergency Procedures

**If Application Stops Working**:

1. **Check PostgreSQL Service**:

   ```cmd
   # Run as Administrator
   net stop postgresql-x64-15
   net start postgresql-x64-15
   ```

2. **Restart Application**:

   ```cmd
   # Stop current instance (Ctrl+C in Command Prompt)
   # Navigate to app directory
   cd C:\electricity-app\electricity-tokens
   # Start again
   npm start
   ```

3. **Check Network Connectivity**:

   ```cmd
   # Test if app is running
   netstat -an | findstr :3000

   # Test network access
   ping 192.168.1.100
   ```

4. **Kill Stuck Processes**:
   ```cmd
   # If app is stuck, kill all Node.js processes
   taskkill /f /im node.exe
   # Then restart normally
   ```

**If Data is Corrupted**:

1. **Stop the application**
2. **Restore from backup** using Admin Panel → Data Management
3. **Restart application**
4. **Verify data integrity**

---

## 📊 Step 10: Performance Expectations

### 10.1 System Performance

**For 5 Concurrent Users**:

- **Response time**: Under 1 second for most actions
- **Simultaneous access**: All 5 users can use it at once
- **Data processing**: Real-time calculations and updates
- **Page loading**: 2-3 seconds initial load, instant navigation

**Resource Usage**:

- **RAM**: 200-500MB while running
- **CPU**: 5-15% on modern laptops
- **Storage**: ~100MB for app, growing database over time
- **Network**: Minimal (mostly local processing)

### 10.2 Data Growth Estimates

**Monthly Data Growth** (5 users):

- **Purchase records**: ~20-50 entries/month
- **Contribution records**: ~20-50 entries/month
- **Audit logs**: ~500-1000 entries/month
- **Total storage**: ~1-5MB additional per month

**Annual Estimates**:

- **Database size**: 50-200MB after 1 year
- **Backup files**: 10-50MB per backup
- **Total storage needed**: 1-2GB including backups

### 10.3 Network Performance

**Local Network Usage**:

- **Initial page load**: ~2MB per user
- **Regular actions**: ~10KB per form submission
- **Real-time updates**: ~1KB per refresh
- **Monthly bandwidth**: Negligible (local processing)

**Internet Usage**:

- **Initial setup**: 100-200MB for downloads
- **Updates**: 10-50MB when available
- **Regular operation**: No internet required once setup

---

## ✅ Step 11: Success Verification Checklist

### 11.1 Technical Setup Verification

- [ ] **Node.js installed** and version showing correctly
- [ ] **PostgreSQL installed** and pgAdmin accessible
- [ ] **Git installed** and repository cloned successfully
- [ ] **Database created** and visible in pgAdmin
- [ ] **Environment file configured** with correct values
- [ ] **Dependencies installed** without errors
- [ ] **Database schema applied** successfully
- [ ] **Static IP address configured** and stable
- [ ] **Windows Firewall configured** to allow port 3000
- [ ] **Application builds** without errors
- [ ] **Application starts** and shows "Ready" message

### 11.2 Network Access Verification

- [ ] **Local access works** (`http://localhost:3000`)
- [ ] **Network access works** from other devices
- [ ] **WiFi devices can connect** using laptop IP
- [ ] **Mobile devices work** (phones, tablets)
- [ ] **All 5 intended users tested** access successfully
- [ ] **Bookmarks created** on all user devices
- [ ] **PWA installation tested** on mobile devices

### 11.3 Application Functionality Verification

- [ ] **Admin account created** and has admin privileges
- [ ] **User accounts created** for all household members
- [ ] **Purchase form works** - can add new token purchases
- [ ] **Contribution form works** - users can add their usage
- [ ] **Reports display correctly** with sample data
- [ ] **Dark/light theme switching** works on all devices
- [ ] **Mobile navigation** works properly
- [ ] **Data calculations** are accurate (fair share, balances)

### 11.4 Admin Functions Verification

- [ ] **Admin Panel accessible** with full features
- [ ] **User management works** (create, edit, lock users)
- [ ] **Backup creation works** and files are saved
- [ ] **Data export works** (CSV, JSON, PDF)
- [ ] **Audit logs visible** and tracking activity
- [ ] **System reports generated** successfully
- [ ] **Security dashboard** shows system status

### 11.5 Data & Security Verification

- [ ] **Database persistence** - data survives app restart
- [ ] **User authentication** - login/logout works
- [ ] **Permission system** - users see appropriate features
- [ ] **Data validation** - forms prevent invalid entries
- [ ] **Backup and restore** tested successfully
- [ ] **Audit logging** captures user actions
- [ ] **Data integrity** - calculations are accurate

---

## 🎉 Step 12: Go-Live Checklist

### 12.1 Final Preparation

**Before announcing to household members**:

1. **Test with sample data**:
   - Create a few test purchases
   - Add contributions from different users
   - Generate reports and verify accuracy
   - Test backup and restore process

2. **Prepare user documentation**:
   - Print or share the user access instructions
   - Create a household contact list
   - Document any house-specific setup details

3. **Establish admin procedures**:
   - Set backup schedule (weekly recommended)
   - Plan regular maintenance times
   - Prepare troubleshooting contact information

### 12.2 User Onboarding

**For each household member**:

1. **Provide access information**:
   - WiFi network confirmation
   - Application URL with your specific IP
   - Login credentials (if pre-created)

2. **Assist with first login**:
   - Help create bookmarks
   - Show basic navigation
   - Explain the purchase and contribution process

3. **Training session** (optional but recommended):
   - Demonstrate adding a purchase
   - Show how to contribute usage
   - Explain the reporting features
   - Answer questions about fair share calculations

### 12.3 Success Metrics

**Your setup is successful when**:

- ✅ All 5 users can access the app reliably
- ✅ Purchases and contributions are being recorded
- ✅ Fair share calculations are accepted by household
- ✅ Reports provide useful insights for cost optimization
- ✅ Admin functions work for user and system management
- ✅ Backup system is protecting your data
- ✅ Performance meets household needs

---

## 🎯 Summary

Congratulations! You now have a **professional-grade electricity cost tracking system** running in your home:

### What You've Accomplished

- ✅ **Self-hosted application** with no monthly fees
- ✅ **Complete data privacy** - everything stays on your laptop
- ✅ **Professional features**: user management, reporting, analytics
- ✅ **Mobile-friendly access** for all household members
- ✅ **Secure and reliable** with backup and restore capabilities
- ✅ **Fair cost sharing** based on actual consumption
- ✅ **Modern interface** with dark mode and responsive design

### Ongoing Benefits

- 💰 **Cost savings**: No hosting fees, no subscriptions
- 🔒 **Data control**: Complete ownership of your data
- ⚡ **Performance**: Fast local access, no internet dependency
- 🏠 **Household harmony**: Transparent and fair electricity cost sharing
- 📊 **Insights**: Detailed analytics for usage optimization
- 🛡️ **Security**: Isolated from external threats, local network only

### Your household now has access to the same professional electricity tracking capabilities that would typically cost $20-50/month from commercial providers, running entirely on your own infrastructure!

---

**Need help?** Refer to the troubleshooting section or contact the original developer through the GitHub repository: [https://github.com/tichaonax/electricity-tokens](https://github.com/tichaonax/electricity-tokens)

**Last Updated**: July 3, 2025  
**Guide Version**: 1.0  
**Application Version**: 1.0 (Production Ready)
