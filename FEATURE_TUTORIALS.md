# Feature Tutorials - Electricity Tokens Tracker

## 📚 Complete Step-by-Step Guides

This document provides detailed, visual tutorials for all major features in the Electricity Tokens Tracker application. Each tutorial includes screenshots descriptions, common pitfalls, and expert tips.

---

## 🚀 Tutorial 1: Getting Started (New Users)

### Complete Setup Walkthrough

#### Step 1: Registration

1. **Navigate to the app** in your web browser
2. **Click "Sign Up"** (or "Register" button)
3. **Fill out the registration form**:
   ```
   Full Name: [Your display name]
   Email: [your-email@example.com]
   Password: [minimum 8 characters]
   Confirm Password: [same as above]
   ```
4. **Click "Create Account"**
5. **Look for success message**: "Account created successfully"

#### Step 2: First Login

1. **Click "Sign In"** if not automatically logged in
2. **Enter your credentials**:
   ```
   Email: [your registered email]
   Password: [your password]
   ```
3. **Click "Sign In"**
4. **Welcome!** You should see your dashboard

#### Step 3: Dashboard Orientation

**What you'll see**:

- 📊 **Recent Activity**: Currently empty (you're new!)
- 📈 **Current Status**: Shows $0 contributed, 0 tokens consumed
- 🔔 **Notifications**: Welcome message and getting started tips
- 🎯 **Quick Actions**: Buttons for main features

#### Step 4: Theme Selection (New in v1.4.0!)

1. **Access Theme Settings**:
   - **Desktop**: Click your profile name (top-right) → Theme preferences
   - **Mobile**: Open mobile menu → Profile → Theme preferences
2. **Available Options**:
   - **Light Mode**: Traditional bright interface, best for daytime use
   - **Dark Mode**: Eye-friendly dark interface, saves battery on OLED screens
   - **System**: Automatically follows your device's day/night settings
3. **Theme Persistence**: Your choice saves automatically across all devices and sessions!

**NEW FEATURE**: Your theme preference is now tied to your user account and persists across:

- Different devices (phone, tablet, laptop)
- Different browsers
- After logging out and back in
- When other users log in (each person keeps their own theme)

#### Step 5: Profile Setup (Optional but Recommended)

1. **Click your name** in the top-right corner
2. **Select "Profile"**
3. **Update your information**:
   - Profile picture (optional)
   - Display preferences
   - Notification settings

**💡 Expert Tip**: Set up email notifications for new purchases so you don't miss contributing!

---

## ⚡ Tutorial 2: Creating Your First Token Purchase

### Scenario: You just bought 100 kWh for $150

#### Step 1: Navigate to Purchase Form

1. **From Dashboard**: Click "Create Purchase" button
   - OR -
2. **From Menu**: Click "Purchase Form" in navigation

#### Step 2: Fill Out Purchase Details

**Form Fields Explanation**:

1. **Total Tokens** (kWh bought):

   ```
   Example: 100
   What it means: You bought 100 kilowatt-hours of electricity
   ```

2. **Total Payment** (Amount paid):

   ```
   Example: 150.50
   What it means: You paid $150.50 total (including taxes/fees)
   ```

3. **Meter Reading** (Current reading):

   ```
   Example: 5000
   Where to find: Look at your electricity meter display
   Important: This is the starting point for consumption tracking
   ```

4. **Purchase Date**:

   ```
   Example: Today's date (default)
   Tip: Use the actual date you bought the tokens
   ```

5. **Emergency Purchase** (checkbox):
   ```
   Check this if: You bought tokens because you were almost out
   Why it matters: Emergency purchases are tracked for cost analysis
   ```

#### Step 3: Validation and Submission

**Before Clicking Submit**:

- ✅ All fields filled correctly
- ✅ Meter reading makes sense (higher than previous purchases)
- ✅ Amount and tokens are reasonable

**Click "Create Purchase"**

**Success Indicators**:

- ✅ Green notification: "Purchase created successfully"
- ✅ Redirected to purchase list or dashboard
- ✅ New purchase appears in Recent Activity

#### Step 4: What Happens Next?

**Immediate Effects**:

- Purchase is saved in the system
- Other household members will see it in their "Pending Contributions"
- You'll see it in your Recent Activity

**Next Steps for You**:

- Wait for others to contribute OR
- Add your own contribution (next tutorial)

**💡 Expert Tips**:

- Take a photo of your meter reading for reference
- Keep receipts/proof of payment
- Note any special circumstances (power outage, emergency, etc.)

---

## 📝 Tutorial 3: Contributing to a Purchase (Most Important!)

### Scenario: Someone bought tokens, now you need to pay your fair share

#### Step 1: Understanding What You're Doing

**Before Contributing**:

- Someone in your household bought electricity tokens
- You need to pay for the electricity you've used since that purchase
- Payment is based on your actual consumption (meter reading difference)

#### Step 2: Navigate to Contribution Form

1. **From Dashboard**: Click "Add Contribution" in notifications
   - OR -
2. **From Menu**: Click "Contribute" in navigation
   - OR -
3. **From Notification**: Click the notification about pending contributions

#### Step 3: Select Which Purchase to Contribute To

**Purchase Dropdown Shows**:

```
Purchase #123 - Jan 15, 2024
100 tokens for $150.50 (Meter: 5000)
[No contribution yet] ← You haven't contributed
```

**Choose the Purchase**: Click to select it

#### Step 4: Check Your Current Meter Reading

**This is the Most Important Step!**

1. **Go to your electricity meter**
2. **Write down the current reading**
   ```
   Example: If purchase was at 5000, and now shows 5025
   You've used: 25 kWh since the purchase
   ```
3. **Double-check the number** (errors here affect everyone's costs)

#### Step 5: Fill Out Contribution Form

**Form Fields**:

1. **Current Meter Reading**:

   ```
   Example: 5025
   Validation: Must be higher than purchase reading (5000)
   ```

2. **Contribution Amount** (Auto-calculated):

   ```
   System calculates: (25 ÷ 100) × $150.50 = $37.63
   Your usage: 25 tokens out of 100 total
   Your fair share: $37.63
   ```

3. **Review the Calculation**:
   ```
   Tokens Consumed: 25 kWh
   Your Share: 25%
   Rate per kWh: $1.51
   ```

#### Step 6: Adjust if Needed (Advanced)

**Why You Might Adjust**:

- Special arrangement with purchaser
- You want to overpay for convenience
- Rounding for easier payment

**How to Adjust**:

1. **Manual Entry**: Uncheck "Use calculated amount"
2. **Enter your preferred amount**
3. **System will note the difference**

#### Step 7: Submit Contribution

1. **Review all information**
2. **Click "Submit Contribution"**
3. **Look for success message**

**What Happens Next**:

- Your contribution is recorded
- Your balance is updated
- Original purchaser is notified
- You'll see it in your Recent Activity

**💡 Expert Tips**:

- Contribute within a few days of the purchase
- If your meter reading seems wrong, double-check before submitting
- You can't contribute twice to the same purchase (one-to-one relationship)
- If you make an error, contact an admin to fix it

---

## 📊 Tutorial 4: Understanding Your Reports

### Accessing and Reading Your Usage Analytics

#### Step 1: Navigate to Reports

1. **Click "Reports"** in main navigation
2. **You'll see three tabs**:
   - 📈 Usage Reports
   - 💰 Financial Reports
   - ⚡ Efficiency Metrics

#### Step 2: Usage Reports Deep Dive

**Monthly Trends Chart**:

```
What it shows: Your electricity consumption each month
Green bars: Normal usage months
Red bars: High usage months
Trend line: Whether you're using more or less over time
```

**How to Read It**:

- **Y-axis**: kWh consumed
- **X-axis**: Months
- **Hover**: See exact numbers

**Example Analysis**:

```
January: 85 kWh (normal)
February: 120 kWh (high - cold month?)
March: 75 kWh (low - less heating needed)
Trend: Seasonal variation is normal
```

#### Step 3: Financial Reports Analysis

**Monthly Cost Summary**:

```
What it tracks: How much you've spent each month
Key metrics:
- Total Spent: $127.50
- Cost per kWh: $1.50 (average)
- Efficiency Rating: "Good" (compared to group)
```

**Balance Tracking**:

```
Current Balance: +$15.50 (you've overpaid)
This month: -$5.25 (you owe a little)
Last month: +$20.75 (you overpaid last month)
```

**Understanding Your Balance**:

- ✅ **Positive (+)**: Others owe you money
- ❌ **Negative (-)**: You owe money to the group
- 🎯 **Zero**: Perfect balance

#### Step 4: Efficiency Metrics (Advanced)

**Usage Prediction**:

```
Next Month Prediction: 95 kWh
Confidence Level: 85%
Based on: Historical usage, seasonal trends
```

**Purchase Optimization Suggestions**:

```
Recommendation: "Buy tokens when usage hits 80% of supply"
Optimal Amount: 150 kWh
Expected Savings: $12.50/month vs emergency purchases
```

**💡 How to Use These Reports**:

1. **Monthly Review**: Check reports at month-end
2. **Identify Patterns**: Look for high-usage periods
3. **Budget Planning**: Use predictions for financial planning
4. **Optimize Timing**: Follow purchase recommendations

---

## 🎛 Tutorial 5: Admin Features (For Household Managers)

### User Management and System Administration

#### Step 1: Accessing Admin Panel

1. **Admin users see**: Additional "Admin Panel" in navigation
2. **Click "Admin Panel"**
3. **You'll see the admin dashboard with**:
   - 👥 User Management
   - 🔒 Security & Audit
   - ⚙️ System Settings
   - 📊 System Reports

#### Step 2: User Management

**Viewing All Users**:

1. **Click "User Management"**
2. **See user list with**:
   ```
   Name | Email | Role | Status | Last Login
   John Doe | john@example.com | USER | Active | 2 hours ago
   Jane Smith | jane@example.com | ADMIN | Active | 1 day ago
   ```

**Managing Individual Users**:

1. **Click on a user's name**
2. **Available actions**:
   - 🔒 Lock/Unlock account
   - 👑 Change role (USER ↔ ADMIN)
   - ✏️ Edit profile information
   - 📋 View user's activity history

**When to Lock a User**:

- Security concern
- User leaving household
- Temporary access restriction

#### Step 3: Security and Audit Features

**Audit Log Review**:

1. **Click "Security & Audit"**
2. **See complete activity log**:
   ```
   Time | User | Action | Details
   10:30 AM | John | CREATE | Purchase #123 created
   10:35 AM | Jane | UPDATE | Contribution added
   10:40 AM | Admin | DELETE | Old purchase removed
   ```

**Security Monitoring**:

- Failed login attempts
- Unusual activity patterns
- Data modification alerts
- System access logs

#### Step 4: Data Management (Advanced Admin)

**Export Data**:

1. **Navigate to Admin → Data Management**
2. **Choose export format**:
   - CSV (for Excel)
   - JSON (for technical use)
3. **Select date range**
4. **Click "Export"**

**Import Data** (Caution Required):

1. **Prepare CSV file** with correct format
2. **Upload via import form**
3. **Review preview** before confirming
4. **System validates** all data

**Backup Management**:

1. **Access Admin → Backup**
2. **Create backup**: Full or incremental
3. **Verify integrity**: Always test backups
4. **Schedule regular backups**

**Database Performance Management**:

1. **Navigate to Admin → Database Performance**
2. **Check Status**: Review current index status and performance metrics
3. **Run Optimization**: Create missing indexes during maintenance windows
4. **Monitor Results**: Track performance improvements and audit trail

**💡 Admin Best Practices**:

- Review audit logs weekly
- Lock unused accounts promptly
- Test backups regularly
- Monitor system health daily

---

## 🌙 Tutorial 6: Advanced Features and Settings

### Customizing Your Experience

#### Step 1: Dark Mode and Themes

1. **Toggle dark mode**: Click 🌙 icon in navigation
2. **Automatic mode**: Follows your device's setting
3. **Manual mode**: Stay in your preferred theme

**Benefits of Dark Mode**:

- Easier on eyes in low light
- Better battery life on mobile
- Modern, sleek appearance

#### Step 2: Notification Management

1. **Go to Profile → Notifications**
2. **Configure preferences**:
   ```
   ✅ Email for new purchases
   ✅ Reminder for pending contributions
   ❌ Monthly usage summaries (off)
   ✅ System maintenance alerts
   ```

#### Step 3: Mobile App Features

**Installing as PWA** (Progressive Web App):

1. **On iPhone**: Safari → Share → Add to Home Screen
2. **On Android**: Chrome → Menu → Add to Home Screen
3. **On Desktop**: Address bar → Install icon

**Offline Capabilities**:

- View recent data without internet
- Basic navigation works offline
- Syncs when connection restored

#### Step 4: Accessibility Features

**Keyboard Navigation**:

- `Tab`: Move between elements
- `Enter`: Activate buttons
- `Space`: Toggle checkboxes
- `Esc`: Close dialogs

**Screen Reader Support**:

- All buttons have descriptive labels
- Form fields have clear instructions
- Navigation landmarks are properly marked

**High Contrast Mode**:

1. **Enable in**: Profile → Accessibility
2. **Improves**: Text readability and button visibility

---

## 🔧 Tutorial 7: Troubleshooting Common Issues

### Self-Help Problem Solving

#### Problem: "I can't enter my meter reading"

**Common Causes and Solutions**:

1. **Reading too low**:

   ```
   Error: "Meter reading must be higher than purchase reading"
   Solution: Double-check your meter - make sure you're reading it correctly
   Purchase was at: 5000
   Your reading must be: >5000 (like 5025)
   ```

2. **Reading out of sequence**:

   ```
   Error: "Meter reading violates chronological order"
   Solution: Ensure your reading is higher than the most recent purchase
   Check: What was the last recorded meter reading?
   ```

3. **Reading too high**:
   ```
   Warning: "Unusually high consumption detected"
   Solution: Verify your meter reading is correct
   If correct: Proceed (might indicate meter issues or high usage)
   ```

#### Problem: "My contribution amount looks wrong"

**Debugging Steps**:

1. **Check the calculation**:

   ```
   Purchase: 100 tokens for $150
   Your usage: 25 tokens
   Expected share: (25 ÷ 100) × $150 = $37.50
   ```

2. **Verify meter readings**:
   - Purchase reading: 5000
   - Your reading: 5025
   - Consumption: 5025 - 5000 = 25 tokens ✓

3. **Check for emergency purchase premium**:
   - Emergency purchases cost more per kWh
   - Your share reflects the higher rate

#### Problem: "I can't see the Admin Panel"

**Requirements Check**:

1. **User role**: Must be ADMIN
2. **Check your role**: Profile → Account Details
3. **Request admin access**: Contact current admin
4. **Log out and back in**: After role change

#### Problem: "The app is slow or not loading"

**Quick Fixes**:

1. **Refresh the page**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**: Settings → Privacy → Clear Data
3. **Try incognito mode**: Tests if extensions are interfering
4. **Check internet connection**: Visit other websites
5. **Try different browser**: Chrome, Firefox, Safari, Edge

**💡 Prevention Tips**:

- Keep your browser updated
- Don't leave the app open for days
- Close other tabs if memory is low
- Use the latest version of the app

---

## 🆕 Tutorial 8: New v1.4.0 Features Deep Dive

### Mobile-First Design and Enhanced Features

#### Part A: Enhanced Theme System

**What's New in Theme Management**:

- **User-specific themes**: Each household member has their own preference
- **Cross-device synchronization**: Your theme follows you everywhere
- **Instant switching**: No page reload required
- **System integration**: Automatic dark/light switching based on device settings

**Step-by-Step Theme Setup**:

1. **Access Your Theme Settings**:

   ```
   Desktop: Profile Menu → Theme Preferences
   Mobile: Menu (☰) → Profile → Theme Preferences
   ```

2. **Choose Your Preference**:
   - **Light**: Always bright interface
   - **Dark**: Always dark interface
   - **System**: Follows your device automatically

3. **Test the Change**:
   - Theme changes instantly
   - No need to save or reload
   - Setting is immediately synced to your account

4. **Verify Persistence**:
   - Log out and back in → Theme preserved
   - Switch devices → Same theme applies
   - Other users log in → They keep their own themes

**Advanced Theme Tips**:

- **Battery Saving**: Dark mode saves ~30% battery on OLED screens
- **Eye Comfort**: Use dark mode in low-light environments
- **System Mode**: Perfect for day/night workers - auto-switches with your schedule

#### Part B: Meter Reading System (New Feature)

**What's New**: Individual meter reading tracking separate from purchases

**When to Use**:

- Regular consumption monitoring
- Before making contributions
- Monthly usage tracking
- Audit trail purposes

**Step-by-Step Meter Reading Entry**:

1. **Navigate to Meter Readings**:

   ```
   Dashboard → "Record Meter Reading" button
   OR
   Menu → Meter Readings → "Add New Reading"
   ```

2. **Fill Out the Form**:

   ```
   Current Reading: [Your meter display number]
   Reading Date: [When you took the reading - defaults to now]
   Notes (optional): [Any special circumstances]
   ```

3. **Understanding Validation**:
   - Must be higher than previous readings
   - System shows your last reading for reference
   - Warns if the increase seems unusual

4. **Submit and Review**:
   - Reading is saved with timestamp
   - Shows in your reading history
   - Available for audit trail

**Meter Reading Best Practices**:

- Take photos of your meter for reference
- Record readings weekly for better tracking
- Note any unusual circumstances (vacation, new appliances)
- Check the history to spot patterns

#### Part C: Enhanced Audit Trail

**What's New**: See who created or modified every entry

**Information Now Visible**:

- **Creator**: Who originally created each purchase/reading
- **Last Modified By**: Who made recent changes (if any)
- **Timestamps**: Precise creation and modification times
- **Admin Details**: IP addresses and user agents (admin view only)

**How to View Audit Information**:

1. **On Meter Readings Page**:

   ```
   Each reading shows:
   "Created by John Doe on Jan 15, 2025 at 10:30 AM"
   "Last modified by Admin User on Jan 15, 2025 at 2:15 PM"
   ```

2. **Admin Audit Access**:

   ```
   Admin users see "View Audit Log" links
   Detailed modification history
   IP addresses and browser information
   ```

3. **Your Personal History**:
   ```
   Profile → Activity History
   Complete record of your actions
   Timestamps for all your entries
   ```

**Benefits of Enhanced Audit Trail**:

- **Transparency**: Know who did what and when
- **Accountability**: Clear responsibility for accuracy
- **Dispute Resolution**: Detailed history helps resolve questions
- **Data Integrity**: Track all changes for accuracy

#### Part D: Running Balance Improvements

**What's Enhanced**: More accurate balance calculations using latest meter readings

**New Calculation Logic**:

- Uses the most recent meter reading for each day
- Accounts for multiple readings on the same date
- Provides more accurate "Anticipated Next Payment" amounts
- Better handles chronological meter reading sequences

**Understanding Your Enhanced Balance Display**:

```
Account Balance: $-15.50 (you owe money)
Anticipated Next Payment: $-38.25 (based on latest meter reading)

Usage Since Last Contribution:
- Tokens Consumed: 25.5 kWh
- Estimated Cost: $38.25
- Rate (Historical Avg): $1.50/kWh
```

**What This Means**:

- **More Accurate**: Uses actual latest consumption data
- **Forward-Looking**: Shows what you'll likely owe next
- **Real-Time**: Updates as you add meter readings
- **Transparent**: Shows the calculation components

## 📱 Tutorial 9: Mobile-First Experience (v1.4.0)

### Revolutionary Mobile Design - No More Horizontal Scrolling!

#### What's New in Mobile Design

**Mobile-First Architecture**:

- **Card-based layouts**: Tables automatically become cards on small screens
- **Touch-optimized**: All buttons sized for finger taps
- **No horizontal scrolling**: Everything fits your screen width perfectly
- **Responsive breakpoints**: Adapts from phone to tablet to desktop seamlessly

#### Step 1: Installing the Mobile App

**Progressive Web App (PWA) Installation**:

1. **iPhone/iPad Setup**:

   ```
   1. Open Safari browser
   2. Navigate to your app URL
   3. Tap Share button (square with arrow up)
   4. Scroll down → "Add to Home Screen"
   5. Name it "Electricity Tracker" → Add
   ```

2. **Android Setup**:

   ```
   1. Open Chrome browser
   2. Navigate to your app URL
   3. Look for "Add to Home Screen" notification banner
   4. OR: Menu (⋮) → "Add to Home Screen"
   5. Confirm installation
   ```

3. **Benefits of Installation**:
   - App icon on home screen
   - Native app experience
   - Faster loading
   - Works offline for viewing
   - No browser bars taking up space

#### Step 2: Understanding the New Mobile Layout

**Meter Readings Page (Card View)**:

```
Instead of horizontal scrolling table:
┌─────────────────────────────────────┐
│ Meter Reading #123                  │
│ 1,362.5 kWh                        │
│ Jan 15, 2025 at 10:30 AM           │
│ Created by: John Doe                │
│ Notes: Monthly reading              │
│ [Edit] [Delete]                     │
└─────────────────────────────────────┘
```

**Purchase List (Stacked Information)**:

```
┌─────────────────────────────────────┐
│ Purchase #456                       │
│ 100 kWh for $150.50               │
│ Jan 20, 2025                       │
│ Emergency Purchase                  │
│ Meter: 1,400 kWh                  │
│ Created by: Jane Smith              │
│ [View Details] [Contribute]         │
└─────────────────────────────────────┘
```

#### Step 3: Mobile-Optimized Workflows

**Quick Meter Reading Entry (Mobile)**:

1. **Open app** from home screen icon
2. **Tap "Record Reading"** button (large, thumb-friendly)
3. **Take photo** of meter (use device camera for reference)
4. **Enter reading** in large input field
5. **Add notes** if needed (swipe to expand text area)
6. **Tap "Save Reading"** (full-width button)

**Quick Contribution (Mobile)**:

1. **Check notifications** for pending contributions
2. **Tap contribution notification**
3. **View purchase details** in card format
4. **Enter current meter reading**
5. **Review calculation** (clearly displayed)
6. **Confirm contribution** with large submit button

#### Step 4: Advanced Mobile Features

**Touch Gestures**:

- **Pull to refresh**: Update data by pulling down on lists
- **Swipe navigation**: Swipe left/right in appropriate contexts
- **Pinch zoom**: Enlarge charts and small text
- **Long press**: Access context menus (admin features)

**Keyboard Optimization**:

- **Numeric keypad**: Automatic for meter readings and amounts
- **Email keyboard**: For login and profile updates
- **Optimized layouts**: Form fields stack vertically for easy typing

**Theme Integration on Mobile**:

- **System theme**: Follows your phone's dark/light mode automatically
- **Battery optimization**: Dark mode uses less power on OLED screens
- **Readability**: High contrast ratios for outdoor use

#### Step 5: Mobile Performance Tips

**Best Practices for Mobile Use**:

1. **Installation**:
   - Always install as PWA for best performance
   - Don't use in regular browser if possible
   - Enable notifications for important updates

2. **Data Entry**:
   - Use landscape mode for complex forms
   - Take photos of meters before entering numbers
   - Double-check calculations before submitting

3. **Navigation**:
   - Use the bottom navigation for quick access
   - Swipe gestures for faster navigation
   - Bookmark frequently used features

4. **Connectivity**:
   - App caches recent data for offline viewing
   - Submit data when you have good connection
   - Check sync status before relying on data

#### Step 6: Troubleshooting Mobile Issues

**Common Mobile Problems & Solutions**:

**"Layout looks broken"**:

- Force refresh: Pull down to refresh
- Clear browser cache: Settings → Clear Data
- Try landscape mode
- Restart the PWA

**"Buttons are too small"**:

- Use zoom: Pinch to enlarge
- Switch to landscape mode
- Check browser zoom settings
- Try accessibility large text

**"Keyboard covers input fields"**:

- Scroll up after keyboard appears
- Use landscape mode for complex forms
- Tap outside keyboard area first

**"Theme not saving"**:

- Ensure you're logged in
- Check internet connection
- Try logging out and back in
- Clear browser data

#### Step 7: Mobile-Specific Features

**NEW: Mobile Camera Integration**:

- Take photos of meter readings for reference
- Images help with accuracy verification
- Photos stored locally (not uploaded for privacy)
- Visual reference for dispute resolution

**Touch-Optimized Charts**:

- Pinch to zoom on usage charts
- Swipe to scroll through time periods
- Tap data points for details
- Landscape mode for better chart viewing

**Offline Capabilities**:

- View last 30 days of data offline
- Access profile and settings
- Read cached reports
- Navigate app structure
- Sync when connection restored

**💡 Mobile Pro Tips for v1.4.0**:

- Install as PWA for native app experience
- Use dark mode to save battery on OLED screens
- Take meter photos for accuracy reference
- Enable system theme for automatic switching
- Pull to refresh for latest data
- Use landscape mode for detailed reports

---

## 🧾 Tutorial 10: Receipt Data & Dual-Currency Tracking (ET-100)

### Understanding Receipt Data Feature

**What is Receipt Data?**

Receipt data is optional information from your official electricity purchase receipt (from ZETDC/ZESA) that enables:

- **Dual-currency tracking**: Compare USD payments to official ZWG (Zimbabwe Gold) costs
- **Exchange rate monitoring**: Track how ZWG/USD rates change over time
- **Historical analysis**: Identify cost trends and anomalies
- **Accurate breakdown**: See exact charges (energy, debt, REA levy, VAT)

**Why Track Receipt Data?**

1. **Currency transparency**: Understand true cost in both USD and ZWG
2. **Rate trends**: Spot when ZWG rates are rising or falling
3. **Budget accuracy**: Plan purchases based on historical exchange rates
4. **Anomaly detection**: Get alerts for unusual pricing patterns
5. **Cost forecasting**: Predict future costs based on trends

---

### Tutorial 10A: Adding Receipt Data Manually

**Scenario**: You just bought 203.21 kWh for $25.50 USD and received this official receipt:

```
ZETDC/ZESA ELECTRICITY RECEIPT
─────────────────────────────────────
Transaction Date/Time: 16/10/25 14:02:36
Token Number:          6447 1068 4258 9659 8834
Account Number:        37266905928

Energy Cost (ZWG):     1,306.60
Debt/Arrears (ZWG):        0.00
REA Levy (ZWG):           78.40
VAT (ZWG):               195.99
─────────────────────────────────────
Total Amount (ZWG):    1,580.99
Amount Tendered (ZWG): 1,581.00

kWh Purchased:         203.21
─────────────────────────────────────
```

**Step-by-Step: Adding This Receipt**

**Step 1: Navigate to Purchase**

1. Log in to your account
2. Click "Purchases" in main menu
3. Find your Oct 16 purchase (203.21 kWh, $25.50)
4. Click on the purchase to open details
5. Click "Add Receipt Data" button

**Step 2: Fill in Receipt Form**

**Token Number** (Optional):
- Type: `6447 1068 4258 9659 8834`
- Spaces are allowed and preserved
- Can be left blank if not needed

**Account Number** (Optional):
- Type: `37266905928`
- Your electricity account number
- Can be left blank

**kWh Purchased** (Required):
- Type: `203.21`
- Must match or be close to your purchase kWh
- System uses this for matching in bulk imports

**Energy Cost (ZWG)** (Required):
- Type: `1306.60`
- Base cost of electricity before fees/taxes
- From "Energy Cost (ZWG)" line on receipt

**Debt/Arrears (ZWG)** (Required):
- Type: `0.00`
- Any outstanding balance from previous months
- If you have debt, enter the exact amount
- Can be 0 if no debt

**REA Levy (ZWG)** (Required):
- Type: `78.40`
- Rural Electrification Agency levy (~6% of energy cost)
- From "REA Levy (ZWG)" line on receipt

**VAT (ZWG)** (Required):
- Type: `195.99`
- Value Added Tax (15% on energy cost + REA levy)
- From "VAT (ZWG)" line on receipt

**Total Amount (ZWG)** (Required):
- Type: `1580.99`
- Sum of: Energy Cost + Debt + REA Levy + VAT
- System validates: 1306.60 + 0 + 78.40 + 195.99 = 1580.99 ✓

**Amount Tendered (ZWG)** (Required):
- Type: `1581.00`
- What you actually paid in ZWG
- Usually slightly more than Total Amount (includes change)

**Transaction Date/Time** (Required):
- Click date picker
- Select: October 16, 2025
- Set time: 14:02:36
- Format automatically handled by system

**Step 3: Submit and Review**

1. Click "Save Receipt Data"
2. System validates all fields:
   - ✓ All ZWG amounts ≥ 0
   - ✓ Total = Energy + Debt + REA + VAT
   - ✓ kWh within valid range (0-100,000)
3. Success message appears: "Receipt data saved successfully"
4. Exchange rate calculated automatically:
   ```
   ZWG Rate = 1580.99 ÷ 25.50 = 62.00 ZWG/USD
   ZWG/kWh = 1580.99 ÷ 203.21 = 7.78 ZWG per kWh
   USD/kWh = 25.50 ÷ 203.21 = 0.125 USD per kWh
   ```

**Step 4: View Your Receipt Data**

After saving, you'll see on the purchase details page:

**Receipt Information Panel:**
```
🧾 Receipt Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Token Number:     6447 1068 4258 9659 8834
Account Number:   37266905928
Transaction Date: Oct 16, 2025 at 14:02:36

💰 Cost Breakdown (ZWG)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Energy Cost:      1,306.60 ZWG
Debt/Arrears:          0.00 ZWG
REA Levy:             78.40 ZWG
VAT:                 195.99 ZWG
─────────────────────────────────────
Total Amount:     1,580.99 ZWG
Amount Tendered:  1,581.00 ZWG

📊 Exchange Rate Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZWG/USD Rate:     62.00
ZWG per kWh:       7.78
USD per kWh:       0.125

✏️ [Edit Receipt]  🗑️ [Delete Receipt]
```

**What These Numbers Mean:**

- **Energy Cost**: Base electricity cost (1,306.60 ZWG)
- **REA Levy**: Government levy for rural electrification (6% of energy cost)
- **VAT**: 15% tax on (Energy Cost + REA Levy)
- **Exchange Rate**: How many ZWG per 1 USD (62.00 means 1 USD = 62 ZWG)
- **ZWG/kWh**: Cost per kilowatt-hour in ZWG currency
- **USD/kWh**: Cost per kilowatt-hour in USD currency

---

### Tutorial 10B: Bulk Importing Historical Receipts

**Scenario**: You have 10 historical receipts from the past 3 months and want to import them all at once.

**Step 1: Gather Your Receipts**

Collect all physical receipts and organize them by date:

```
Oct 16, 2025 - 203.21 kWh - 1,580.99 ZWG
Oct 10, 2025 - 180.50 kWh - 1,398.75 ZWG
Oct 05, 2025 - 150.00 kWh - 1,162.50 ZWG
Sep 28, 2025 - 200.00 kWh - 1,520.00 ZWG
Sep 20, 2025 - 175.30 kWh - 1,330.28 ZWG
... (and so on)
```

**Step 2: Download CSV Template**

1. Navigate to "Bulk Import" page in main menu
2. Click "Download CSV Template" button
3. Save file as `receipts-import-2025.csv`
4. Open in Excel, Google Sheets, or text editor

**Step 3: Fill in CSV Template**

**Column Headers (DO NOT MODIFY):**
```csv
Transaction Date/Time,Token Number,Account Number,kWh Purchased,Energy Cost (ZWG),Debt/Arrears (ZWG),REA Levy (ZWG),VAT (ZWG),Total Amount (ZWG),Amount Tendered (ZWG)
```

**Add Your Receipt Data:**

```csv
Transaction Date/Time,Token Number,Account Number,kWh Purchased,Energy Cost (ZWG),Debt/Arrears (ZWG),REA Levy (ZWG),VAT (ZWG),Total Amount (ZWG),Amount Tendered (ZWG)
16/10/25 14:02:36,6447 1068 4258 9659 8834,37266905928,203.21,1306.60,0.00,78.40,195.99,1580.99,1581.00
10/10/25 09:15:22,5123 4567 8901 2345 6789,37266905928,180.50,1161.22,0.00,69.67,174.18,1405.07,1410.00
05/10/25 16:48:11,9876 5432 1098 7654 3210,37266905928,150.00,965.25,0.00,57.92,144.79,1167.96,1170.00
28/09/25 11:30:45,1111 2222 3333 4444 5555,37266905928,200.00,1287.00,0.00,77.22,193.05,1557.27,1560.00
20/09/25 08:20:18,7777 8888 9999 0000 1111,37266905928,175.30,1128.19,0.00,67.69,169.23,1365.11,1370.00
```

**Important CSV Rules:**

1. **Date Format**: `DD/MM/YY HH:mm:ss` (e.g., `16/10/25 14:02:36`)
2. **Decimals**: Use `.` not `,` for decimals (1306.60, not 1306,60)
3. **No currency symbols**: Just numbers (1306.60, not ZWG 1,306.60)
4. **No commas in numbers**: 1306.60, not 1,306.60
5. **Token spaces allowed**: Can include or omit spaces in token number
6. **Optional fields**: Token Number and Account Number can be empty

**Step 4: Upload CSV File**

1. Go to "Bulk Import" page
2. Click "Choose File" button
3. Select your `receipts-import-2025.csv` file
4. File uploads and validates:
   - ✓ File size < 5 MB
   - ✓ Format is CSV
   - ✓ Rows ≤ 500
   - ✓ Headers match template
5. Click "Preview Import" button

**Step 5: Review Preview Results**

System shows preview with matched purchases:

**Summary Panel:**
```
📊 Import Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Rows:    10
Valid Rows:     8
Invalid Rows:   2
```

**Matched Receipt Example (High Confidence):**

```
🟢 Row 1: HIGH CONFIDENCE (95%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Receipt Data:
   Date: Oct 16, 2025 14:02:36
   kWh: 203.21
   Total ZWG: 1,580.99

🔗 Matched Purchase:
   Date: Oct 16, 2025
   kWh: 203.21
   USD: $25.50
   Buyer: John Doe

✓ Match Reasons:
   • Date match: same day (50 points)
   • kWh exact match (50 points)

✅ WILL BE IMPORTED
```

**Matched Receipt Example (Medium Confidence):**

```
🟡 Row 2: MEDIUM CONFIDENCE (65%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Receipt Data:
   Date: Oct 10, 2025 09:15:22
   kWh: 180.50
   Total ZWG: 1,405.07

🔗 Matched Purchase:
   Date: Oct 11, 2025
   kWh: 180.00
   USD: $22.75
   Buyer: Jane Smith

✓ Match Reasons:
   • Date match: within 1 day (40 points)
   • kWh ±1% match (45 points)

⚠️ Warning: Date differs by 1 day

✅ WILL BE IMPORTED
```

**Skipped Receipt Example (Low Confidence):**

```
🟠 Row 5: LOW CONFIDENCE (35%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Receipt Data:
   Date: Sep 15, 2025 10:00:00
   kWh: 120.00
   Total ZWG: 950.00

🔗 Matched Purchase:
   Date: Sep 10, 2025
   kWh: 150.00
   USD: $19.50
   Buyer: John Doe

✓ Match Reasons:
   • Date match: within 7 days (10 points)
   • kWh ±5% match (35 points)

⚠️ Warnings:
   • Date differs by 5 days
   • kWh differs by 20%

⏭️ SKIPPED - Manual review required
```

**Error Example:**

```
❌ Row 8: INVALID DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❗ Error: Invalid date format: 32/13/25
📄 Raw Data:
   32/13/25 14:00:00,1234...,372669...,100.00,...

⏭️ SKIPPED
```

**Understanding Confidence Scores:**

| Score | Level | Color | Action | Meaning |
|-------|-------|-------|--------|---------|
| 80-100% | High | 🟢 Green | Auto-import | Excellent match, very confident |
| 50-79% | Medium | 🟡 Yellow | Auto-import | Good match, reasonably confident |
| 20-49% | Low | 🟠 Orange | Skip | Poor match, manual review needed |
| 0-19% | None | ❌ Red | Skip | No suitable match found |

**Step 6: Confirm Import**

1. Review all preview results
2. Check warnings on medium confidence matches
3. Note which rows will be skipped
4. Click "Confirm Import" button
5. System imports high/medium confidence matches
6. Low confidence and errors are skipped

**Step 7: Review Import Results**

After import completes:

```
✅ Import Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Rows:     10
Imported:        8
Skipped:         2
Failed:          0
```

**Imported Receipts:**
```
Row 1: ✅ Imported (Receipt ID: clxxx1...)
Row 2: ✅ Imported (Receipt ID: clxxx2...)
Row 3: ✅ Imported (Receipt ID: clxxx3...)
Row 4: ✅ Imported (Receipt ID: clxxx4...)
Row 6: ✅ Imported (Receipt ID: clxxx5...)
Row 7: ✅ Imported (Receipt ID: clxxx6...)
Row 9: ✅ Imported (Receipt ID: clxxx7...)
Row 10: ✅ Imported (Receipt ID: clxxx8...)
```

**Skipped Receipts:**
```
Row 5: ⏭️ Skipped - Low confidence (35%)
       Reason: Date differs by 5 days, kWh differs by 20%
       
Row 8: ❌ Skipped - Invalid date format: 32/13/25
       Reason: Invalid data
```

**Step 8: Handle Skipped Receipts**

For skipped receipts, you have two options:

**Option 1: Add Manually**
1. Go to the purchase details page for that date
2. Click "Add Receipt Data"
3. Enter receipt information manually
4. Submit

**Option 2: Fix CSV and Re-import**
1. Create new CSV with only skipped rows
2. Fix errors (correct date format, adjust kWh if needed)
3. Upload and import again

---

### Tutorial 10C: Understanding Dual-Currency Analysis

**Scenario**: You've added 8+ receipts and want to analyze your dual-currency costs.

**Step 1: Access Dual-Currency Chart**

1. Navigate to "Dashboard" or "Analytics" page
2. Scroll to "Dual-Currency Cost Analysis" section
3. View the dual-line chart

**What You'll See:**

```
📊 Dual-Currency Cost Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ┌─────────────────────────────┐
 10 │                         ●   │ ZWG/kWh
    │                     ●   │   │
  8 │                 ●   │   │   │
    │             ●   │   │   │   │
  6 │         ●   │   │   │   │   │
    │     ●   │   │   │   │   │   │
  4 │ ●   │   │   │   │   │   │   │
    │     ━   ━   ━   ━   ━   ━   │ USD/kWh
  2 │ ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
    │                             │
  0 └─────────────────────────────┘
     Aug  Sep  Oct  Nov
```

**Reading the Chart:**

- **Blue Line (USD/kWh)**: Your cost per kWh in USD (relatively stable ~0.125)
- **Green Line (ZWG/kWh)**: Official cost per kWh in ZWG (rising trend ~7.78)
- **X-Axis**: Timeline of your purchases (by month)
- **Y-Axis**: Cost per kilowatt-hour

**What This Tells You:**

1. **USD costs stable**: Your USD cost per kWh stays around $0.125
2. **ZWG costs rising**: ZWG per kWh is increasing from 7.50 → 7.78 (+3.7%)
3. **Exchange rate trending up**: ZWG is weakening against USD
4. **Budget impact**: Expect higher ZWG costs in future purchases

**Step 2: View ZWG Rate History**

1. Scroll to "ZWG Exchange Rate History" table
2. Review chronological rate changes

**Example Table:**

| Date | ZWG/USD Rate | ZWG/kWh | Change | Trend |
|------|-------------|---------|--------|-------|
| Nov 1 | 62.19 | 7.77 | +3.5% | ↗️ Rising |
| Oct 16 | 62.00 | 7.78 | +0.3% | → Stable |
| Oct 10 | 61.82 | 7.75 | -2.1% | ↘️ Falling |
| Oct 5 | 63.16 | 7.92 | +5.8% | ↗️ Rising |
| Sep 28 | 59.70 | 7.49 | -1.2% | ↘️ Falling |

**Reading the Table:**

- **Change %**: Percentage increase/decrease from previous purchase
- **Trend Indicators**:
  - ↗️ Rising: Rate increased >1%
  - ↘️ Falling: Rate decreased >1%
  - → Stable: Change between -1% and +1%

**Step 3: Check Insights Card**

If you have 3+ receipts, scroll to "Insights Card":

```
🔍 Cost Insights
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Current Trend: RISING
   ZWG costs have increased 15% over the
   last 3 months. Current ZWG/kWh rate
   (7.77) is 3.5% above the 3-month average.

⚠️ Anomaly Detected:
   Oct 5 purchase had unusually high rate
   (7.92 ZWG/kWh, 26% above average).
   Possible emergency purchase or rate spike.

💡 Recommendations:
   • Purchase larger quantities when rates
     are lower to average out costs
   • Monitor rate trends before buying
   • Consider buying on 15th-20th when
     historical rates tend to be lower
```

**What Insights Mean:**

- **Trend**: Overall direction of costs (rising/falling/stable)
- **Anomalies**: Unusual purchases that deviate >20% from average
- **Recommendations**: AI-generated suggestions based on your data

---

### Tutorial 10D: Common Receipt Data Scenarios

**Scenario 1: Receipt with Debt/Arrears**

```
RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Energy Cost (ZWG):    1,200.00
Debt/Arrears (ZWG):     450.00  ← Outstanding balance
REA Levy (ZWG):          72.00
VAT (ZWG):              180.00
─────────────────────────────────────
Total Amount (ZWG):   1,902.00
```

**How to Enter:**
- Energy Cost: `1200.00`
- Debt: `450.00` ← Don't skip this!
- REA Levy: `72.00`
- VAT: `180.00`
- Total: `1902.00` (system validates sum)

**Understanding:**
- Your total cost is higher due to outstanding debt
- Future purchases should have lower/no debt if you paid it off
- System tracks debt trends over time

**Scenario 2: Receipt Token Doesn't Match Purchase**

```
Purchase Record:
   kWh: 200.00
   Token: (not entered)

Receipt:
   kWh: 203.21  ← Slightly different
   Token: 6447 1068 4258 9659 8834
```

**What Happened:**
- Receipt shows actual kWh from power company (203.21)
- Your purchase record has rounded value (200.00)
- This is normal and expected

**How to Handle:**
- Enter receipt kWh exactly as shown: `203.21`
- System allows ±5% difference for matching
- Bulk import will still match with 45 points (±2%)

**Scenario 3: Multiple Purchases Same Day**

```
Oct 16, 2025:
   Purchase 1: 200 kWh at 10:00 AM
   Purchase 2: 150 kWh at 3:00 PM

Receipt:
   Date: 16/10/25 14:02:36
   kWh: 203.21
```

**How Bulk Import Handles This:**
- System finds both purchases on Oct 16
- Checks kWh match: 203.21 ≈ 200 (closer to Purchase 1)
- Chooses Purchase 1 as best match
- Shows warning: "Multiple purchases on same day"

**Manual Entry:**
- Navigate to correct purchase (check time if known)
- Add receipt data to the matching purchase

**Scenario 4: Import Shows "No Match Found"**

```
❌ Row 5: NO MATCH (5%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Receipt Date: Sep 10, 2025
kWh: 175.00

Error: No purchase found within 7 days
       with matching kWh (±5%)
```

**Possible Reasons:**
1. Purchase not yet entered in system
2. Receipt date is wrong (typo in CSV)
3. kWh value too different
4. Purchase was made by different household member

**Solutions:**
1. **Add missing purchase first**:
   - Go to "Purchase Form"
   - Create purchase for Sep 10
   - Then add receipt data manually

2. **Check CSV for typos**:
   - Verify date format (DD/MM/YY HH:mm:ss)
   - Check kWh value matches purchase

3. **Use manual entry**:
   - Skip bulk import for this row
   - Add receipt data manually to correct purchase

---

### Troubleshooting Receipt Data

**Problem 1: "Total Amount doesn't match sum of components"**

```
❌ Validation Error:
   Total Amount (1580.99) ≠
   Energy (1306.60) + Debt (0) + REA (78.40) + VAT (195.00)
   
   Expected: 1579.99
   Actual:   1580.99
```

**Solution:**
- Recalculate: 1306.60 + 0 + 78.40 + 195.00 = 1580.00
- Check receipt for typos
- Adjust VAT to 196.00 (receipt may have rounding)

**Problem 2: "Receipt already exists for this purchase"**

```
❌ Error: Receipt data already exists for purchase clxxx...
```

**Solution:**
1. **Edit existing receipt**:
   - Go to purchase details
   - Click "Edit Receipt Data"
   - Update fields

2. **Delete and re-add**:
   - Click "Delete Receipt Data"
   - Confirm deletion
   - Add new receipt data

**Problem 3: Bulk import shows 0% confidence for all rows**

**Possible Causes:**
- No purchases in system yet
- Date range doesn't match any purchases
- kWh values too different

**Solution:**
1. Check you have purchases entered
2. Verify CSV dates match purchase dates (±7 days)
3. Compare CSV kWh to purchase kWh (should be ±5%)

**Problem 4: Exchange rate seems wrong**

```
Exchange Rate: 2.48 ZWG/USD
(Expected: ~62 ZWG/USD)
```

**Cause:**
- Wrong currency entered (used USD instead of ZWG)
- Decimal point error (1580.99 entered as 1.58099)

**Solution:**
1. Edit receipt data
2. Check all ZWG amounts:
   - Energy Cost: 1,306.60 (not 1.30660)
   - Total Amount: 1,580.99 (not 1.58099)
3. Re-save and verify exchange rate recalculates correctly

---

### Receipt Data Best Practices

**Daily Habits:**

1. **Save receipts immediately**: Don't lose physical receipts
2. **Enter data within 24 hours**: While details are fresh
3. **Double-check totals**: Verify sum matches before saving
4. **Keep receipt photo**: Take phone picture as backup

**Monthly Routines:**

1. **Bulk import historical data**: Add past 3 months of receipts
2. **Review trends**: Check insights card for patterns
3. **Analyze exchange rates**: Identify best times to purchase
4. **Share findings**: Discuss trends with household

**Data Quality:**

1. **Exact values**: Don't round or estimate ZWG amounts
2. **Correct currency**: Always use ZWG from receipt, not USD
3. **Complete data**: Fill in all required fields
4. **Verify calculations**: Check Total = Energy + Debt + REA + VAT

**Security:**

1. **Don't share account numbers**: Keep account info private
2. **Store receipts securely**: Physical copies in safe place
3. **Regular backups**: Export data monthly
4. **Audit periodically**: Review old receipts for accuracy

---

## 🎓 Advanced Tips and Tricks

### Expert-Level Usage Strategies

#### Household Organization Tips

**Establish Routines**:

1. **Weekly meter checks**: Same day, same time
2. **Monthly reviews**: Check reports together
3. **Purchase planning**: Discuss before buying
4. **Cost splitting**: Agree on special situations

**Communication Strategies**:

- **House group chat**: Share meter readings
- **Shared calendar**: Mark purchase dates
- **Monthly meetings**: Review usage and costs
- **Written agreements**: Document special arrangements

#### Cost Optimization Strategies

**Smart Purchase Timing**:

```
Monitor Usage Trends:
- Track when you're at 20% remaining tokens
- Buy before reaching 10% (avoid emergencies)
- Purchase larger amounts for better rates
- Coordinate with household for bulk buying
```

**Usage Monitoring**:

```
Identify High-Usage Periods:
- Winter heating months
- Summer cooling months
- Holiday periods (more people home)
- Work-from-home periods
```

#### Data Analysis Pro Tips

**Excel/Sheets Integration**:

1. **Export data** monthly (CSV format)
2. **Create custom charts** in spreadsheet
3. **Track trends** over longer periods
4. **Budget planning** with historical data

**Pattern Recognition**:

- Look for weekly patterns (weekdays vs weekends)
- Identify seasonal variations
- Track the impact of new appliances
- Monitor efficiency improvements

**💡 Expert Strategies**:

- Set usage goals and track progress
- Create friendly competition with household members
- Use prediction features for budget planning
- Regular system health checks (admins)

---

## 🆘 Quick Reference Cards

### Emergency Procedures

#### System Issues

```
1. Check /api/health endpoint
2. Try different browser/device
3. Clear cache and cookies
4. Contact admin with error details
```

#### Data Discrepancies

```
1. Stop entering new data
2. Document the issue
3. Check meter reading accuracy
4. Contact admin immediately
```

#### Account Locked

```
1. Try password reset
2. Contact household admin
3. Verify email address
4. Wait for admin unlock
```

### Quick Task Reference

| Task             | Navigation Path  | Required Info               |
| ---------------- | ---------------- | --------------------------- |
| Create Purchase  | Purchase Form    | Tokens, cost, meter reading |
| Add Contribution | Contribute       | Current meter reading       |
| Check Balance    | Dashboard        | None                        |
| View Reports     | Reports → [Type] | None                        |
| Manage Users     | Admin → Users    | Admin privileges            |
| Export Data      | Admin → Data     | Date range                  |

### Formula Quick Reference

```
Consumption = Current Reading - Purchase Reading
Fair Share = (Your Tokens ÷ Total Tokens) × Total Cost
Rate = Total Cost ÷ Total Tokens
Your Rate = Your Payment ÷ Your Consumption
Efficiency = Standard Rate ÷ Your Average Rate
```

---

**🎯 Remember**: The key to success with this system is accuracy in meter readings and prompt contributions. When everyone participates fairly, the system provides transparent, equitable cost sharing for electricity usage.

Happy tracking! ⚡📱
