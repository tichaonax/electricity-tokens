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
