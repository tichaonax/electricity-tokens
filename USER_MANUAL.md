# Electricity Tokens Tracker - User Manual

## 📱 Welcome to Electricity Tokens Tracker

Electricity Tokens Tracker is a modern web application designed to help households and organizations track electricity usage through a token-based system. Each token represents 1 kWh (kilowatt-hour) of electricity, making it easy to understand and manage your energy consumption.

### What is the Token System?

- **1 Token = 1 kWh** of electricity
- **Purchase tokens** in bulk when needed
- **Track individual consumption** using meter readings
- **Calculate fair shares** based on actual usage
- **Monitor costs** and optimize usage patterns

---

## 🚀 Getting Started

### Creating Your Account

1. **Visit the registration page**: Click "Sign Up" or go to `/auth/register`
2. **Fill in your details**:
   - Full name
   - Email address (will be your username)
   - Secure password (minimum 8 characters)
3. **Click "Create Account"**
4. **Verify your email** if required
5. **Log in** with your new credentials

### First Login

After logging in, you'll see your **Dashboard** with:

- Quick overview of recent activity
- Current contribution status
- System notifications
- Navigation to all features

---

## 🏠 Understanding Your Dashboard

### Main Dashboard Sections

#### **Recent Activity**

- Shows your latest contributions and purchases
- Quick links to add new contributions
- Status indicators for pending actions

#### **Current Status**

- Total tokens consumed this month
- Amount contributed vs. expected
- Balance (overpaid/underpaid) - _Requires permission from admin_
- Progressive Token Consumption Widget - _Requires permission from admin_
- Maximum Daily Consumption Widget - _Requires permission from admin_
- Usage trends

> **Note**: The account balance information, progressive token consumption widget, and maximum daily consumption widget are now restricted by default for regular users. If you don't see these features on your dashboard, ask an administrator to grant you the respective permissions.

#### **Dashboard Features (Special Permissions Required)**

The main dashboard includes several core sections that require special permissions:

- **Purchase History** - _Special Permission Required_ - View and manage all electricity token purchases with advanced filtering and sorting
- **New Purchase** - _Special Permission Required_ - Create new token purchases 
- **User Contributions** - _Special Permission Required_ - Track usage and manage your contributions to purchases
- **Usage Reports** - _Special Permission Required_ - Access usage analytics and trend reports
- **Financial Reports** - _Special Permission Required_ - View financial summaries and balance analysis
- **Efficiency Reports** - _Special Permission Required_ - Access efficiency analysis and optimization reports
- **Cost Analysis** - _Special Permission Required_ - Access cost analysis features and insights

> **Important**: These are special dashboard permissions that are not granted to regular users by default. Most users will see a "Limited Dashboard Access" notice explaining how to request these permissions. Contact your administrator to request access to these core features if needed for your role.

#### **Anticipated Payment Predictions**

- **Smart Token Purchase Estimation**: Based on current usage and historical patterns
- **Your Next Payment**: Predicted amount you'll need to contribute
- **Others' Expected Payment**: Estimated contribution from other household members
- **Total Token Purchase**: Recommended purchase amount for the household

#### **Quick Actions**

- Add contribution to recent purchase
- View purchase history
- Access reports and analytics
- Dark mode toggle

### Navigation Menu

**For Regular Users:**

- 🏠 **Dashboard**: Main overview
- 💰 **Purchase Form**: Create new token purchases _(Special Permission Required)_
- 📝 **Contribute**: Add your meter readings and payments _(Special Permission Required)_
- 📊 **Reports**: View usage and cost analytics _(Special Permission Required)_
- 👤 **Profile**: Manage your account

**For Admin Users (Additional):**

- 👥 **Admin Panel**: User and system management
- 🔧 **Settings**: System configuration
- 📋 **Audit Logs**: Complete activity history
- 💾 **Data Management**: Export, import, backup & restore
- 🔒 **Security Dashboard**: System monitoring and threat detection
- 📊 **System Reports**: Performance and usage analytics
- 🗄️ **Database Performance**: Monitor and optimize database indexes

---

## ⚡ Creating Token Purchases

### When to Create a Purchase

Create a new purchase when:

- You buy electricity tokens from your utility provider
- The household needs to reload the meter
- Planning for upcoming electricity needs

### Step-by-Step Purchase Creation

1. **Navigate to Purchase Form**
   - Click "Purchase Form" in the main menu
   - Or use the "+" button on the dashboard

2. **Enter Purchase Details**:

   **Total Tokens**: Number of tokens purchased (kWh)
   - Example: 100 (for 100 kWh)
   - Must be a positive number

   **Total Payment**: Amount paid in dollars
   - Example: 150.50
   - Include any taxes or fees

   **Meter Reading**: Current meter reading when purchase was made
   - Example: 5000
   - This is the starting point for consumption calculation

   **Purchase Date**: When the purchase was made
   - Use the date picker
   - Defaults to today

   **Emergency Purchase**: Check if this was an emergency purchase
   - Emergency purchases typically cost more
   - Used for cost analysis and optimization

3. **Submit the Purchase**
   - Click "Create Purchase"
   - System will validate the information
   - You'll see a success message

### Purchase Validation Rules

The system enforces these rules:

- **Sequential meter readings**: Each new purchase must have a higher meter reading than the previous one
- **Positive values**: All amounts must be greater than zero
- **Reasonable limits**: Maximum 100,000 tokens and $1,000,000 payment
- **Future dates**: Purchase dates cannot be in the future

---

## 📝 Contributing to Purchases

### Understanding Contributions

After someone creates a purchase, each household member needs to:

1. **Record their meter reading** when they check it
2. **Calculate their fair share** based on actual consumption
3. **Pay their contribution** to the person who made the purchase

### How to Contribute

1. **Go to Contribute Page**
   - Click "Contribute" in the main menu
   - Or click "Add Contribution" on dashboard

2. **Select a Purchase**
   - Choose from the dropdown list
   - Recent purchases appear first
   - Purchases with existing contributions are highlighted

3. **Enter Your Information**:

   **Current Meter Reading**: The meter reading you see now
   - Example: 5025 (if purchase was at 5000, you used 25 kWh)
   - Must be higher than the purchase meter reading

   **Your Contribution Amount**: How much you're paying
   - System calculates suggested amount based on usage
   - You can adjust if there are special arrangements
   - Example: If you used 25 tokens out of 100, and total cost was $150, your fair share is about $37.50

4. **Review the Calculation**
   - **Tokens Consumed**: Automatically calculated (your reading - purchase reading)
   - **Your Share**: Based on proportional usage
   - **Rate per kWh**: Your effective electricity rate

5. **Submit Contribution**
   - Click "Submit Contribution"
   - Payment details will be logged
   - Original purchaser will be notified

### Important Contribution Rules

**One-to-One Relationship**: Each token purchase must have exactly one user contribution. This ensures:
- Clear accountability for each purchase
- Accurate cost tracking and fair share calculations
- Data integrity and consistent financial reporting

**Constraint Enforcement**: The system prevents:
- Multiple contributions to the same purchase
- Orphaned contributions without corresponding purchases
- Deletion of purchases that have linked contributions

### Contribution Tips

- **Be accurate with meter readings**: Small errors can affect fair cost distribution
- **Contribute promptly**: Don't wait too long after purchases
- **Check suggested amounts**: The system calculates fair shares automatically
- **Communicate with household**: Discuss any special arrangements

---

## 🔮 Anticipated Payment Predictions

### Understanding Payment Predictions

The Electricity Tokens Tracker includes smart prediction functionality that helps you plan future token purchases based on current usage and historical patterns. This feature appears in the **Account Balance** widget on your dashboard.

### How Predictions Work

The system uses a **proportional scaling algorithm** based on:

1. **Your current usage** since the last token purchase
2. **Your historical consumption patterns**
3. **Others' historical usage patterns** in the household
4. **Your current account balance** (credit or debt)

### The Three Prediction Sections

#### **🔵 Anticipated Next Payment**

- **What it shows**: How much you'll likely need to contribute to the next token purchase
- **Calculation**: Your current balance + your estimated usage cost
- **Example**: If you owe $4.75 and have used $6.97 worth of electricity, your anticipated payment is $11.72
- **Use it for**: Planning your personal budget for electricity costs

#### **🟣 Anticipated Others Payment**

- **What it shows**: How much other household members will likely contribute
- **Calculation**: Based on proportional scaling of their historical usage vs. your current usage
- **Formula**: `Your current cost × (Others' historical usage ÷ Your historical fair share)`
- **Example**: If your usage is $6.97 and others historically used 1.48× your amount, they'll contribute $10.33
- **Use it for**: Estimating how much others should contribute when planning purchases

#### **🟠 Anticipated Token Purchase**

- **What it shows**: Total recommended token purchase amount for the household
- **Calculation**: Your anticipated payment + Others' anticipated payment
- **Example**: $11.72 + $10.33 = $22.05 total needed
- **Use it for**: Deciding how much electricity to purchase to cover everyone's needs

### Practical Benefits

**📈 Better Planning**:

- Know exactly how much to budget for electricity
- Plan token purchases before running out
- Avoid emergency purchases at higher rates

**⚖️ Fair Cost Sharing**:

- Transparent calculations based on actual usage patterns
- Everyone pays proportional to their consumption
- Clear visibility into expected contributions

**💰 Cost Optimization**:

- Buy the right amount of tokens - not too little, not too much
- Coordinate household purchases more effectively
- Reduce waste from unused tokens

### Reading the Predictions

**Negative Values** (shown in red):

- Represent money that needs to be paid
- Example: -$11.72 means you need to pay $11.72

**Positive Values** (shown in green):

- Represent credit or overpayment
- Example: +$5.00 means you have a $5 credit

**Status Indicators**:

- **Payment due**: You need to contribute money
- **Credit expected**: You have overpaid and have credit
- **Contribution due**: Others need to pay their share

### Example Scenario

**Current Situation**:

- You have a -$4.75 balance (you owe money)
- You've used 24.6 kWh since last purchase (worth $6.97)
- Historical total purchases: $202.50
- Your historical fair share: $81.60
- Others' historical usage: $120.90

**Predictions**:

- **Your Next Payment**: -$4.75 + (-$6.97) = **-$11.72**
- **Others Payment**: -$6.97 × ($120.90 ÷ $81.60) = **-$10.33**
- **Total Purchase Needed**: -$11.72 + (-$10.33) = **-$22.05**

**Action**: Purchase approximately $22 worth of electricity tokens to cover everyone's usage.

### Tips for Using Predictions

**🎯 Plan Ahead**:

- Check predictions weekly to plan purchases
- Coordinate with household members based on predicted contributions
- Use predictions to budget monthly electricity expenses

**📊 Track Accuracy**:

- Compare predictions to actual costs after purchases
- Adjust usage patterns if predictions show concerning trends
- Use historical data to improve future predictions

**💡 Optimize Purchases**:

- Buy tokens when predictions show need approaching
- Avoid emergency purchases by planning with predictions
- Consider bulk purchases when total predictions are high

---

## 📊 Reports and Analytics

### Accessing Reports

Navigate to **Reports** in the main menu to access:

#### **Usage Reports**

- **Monthly Trends**: See your electricity consumption over time
- **Cost Analysis**: Track spending patterns and efficiency
- **Comparison**: How your usage compares to household average
- **Emergency Impact**: Cost of emergency purchases vs. planned ones

#### **Financial Reports**

- **Payment Summary**: What you've paid vs. consumed
- **Balance Analysis**: Are you overpaying or underpaying?
- **Annual Overview**: Yearly spending and usage summary
- **Cost Efficiency**: Rate per kWh trends

#### **Efficiency Metrics**

- **Usage Prediction**: AI-powered forecasting of future consumption
- **Purchase Optimization**: Recommendations for timing and amounts
- **Savings Opportunities**: Potential cost reductions

### Understanding Your Reports

#### **Monthly Usage Chart**

- **Green bars**: Normal consumption months
- **Red bars**: High consumption (check for inefficiencies)
- **Trend line**: Shows whether usage is increasing or decreasing

#### **Cost Per kWh**

- **Lower is better**: More efficient purchasing
- **Spikes indicate**: Emergency purchases or small bulk purchases
- **Baseline rate**: Your utility's standard rate

#### **Balance Tracking**

- **Positive balance**: You've overpaid (others owe you)
- **Negative balance**: You owe money to the group
- **Zero balance**: Perfect contribution matching

---

## 👤 Profile Management

### Updating Your Profile

1. **Click on your name** in the top navigation
2. **Select "Profile"** from the dropdown
3. **Edit your information**:
   - Display name
   - Email address (used for login)
   - Profile picture (optional)

### Security Settings

**Change Password**:

1. Go to Profile → Security
2. Enter current password
3. Enter new password (minimum 8 characters)
4. Confirm new password
5. Click "Update Password"

**Session Management**:

- View active sessions
- Log out from other devices
- Set session timeout preferences

---

## 🌙 App Features

### Dark Mode

- **Theme Options**: Light, Dark, or System (follows device preference)
- **Desktop Toggle**: Click the theme icon in the top navigation bar
- **Mobile Toggle**: Access through the mobile menu under "Settings"
- **Cycle Through Options**: Light → Dark → System → Light...
- **Persistent**: Your choice is saved and remembered across sessions
- **Instant Application**: Changes apply immediately across the entire app

### Mobile App Features

- **Add to Home Screen**: Install as PWA on mobile devices
- **Offline Support**: Basic functionality works without internet
- **Touch-Friendly**: Optimized for mobile interactions

### Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with assistive technologies
- **High Contrast**: Available in settings
- **Large Text**: Supports system text size preferences

---

## 🔔 Notifications and Alerts

### Understanding Notifications

**Dashboard Notifications**:

- 🟢 **Success**: Actions completed successfully
- 🟡 **Warning**: Attention needed (unusual meter readings, missing contributions)
- 🔴 **Error**: Problems that need immediate attention
- 🔵 **Info**: General information and tips

**Common Notifications**:

- "New purchase created" - Someone bought tokens
- "Contribution needed" - You haven't contributed to a recent purchase
- "Unusual meter reading" - Reading seems inconsistent
- "Monthly summary available" - New reports generated

### Notification Settings

1. **Go to Profile → Notifications**
2. **Choose your preferences**:
   - Email notifications for new purchases
   - Reminders for pending contributions
   - Monthly usage summaries
   - System maintenance alerts

---

## 💡 Tips for Efficient Usage

### Best Practices

**Regular Monitoring**:

- Check your meter reading weekly
- Contribute to purchases promptly
- Review monthly reports to identify trends

**Cost Optimization**:

- **Buy in bulk**: Larger purchases often have better rates
- **Avoid emergencies**: Plan purchases before running out
- **Monitor usage**: High consumption periods affect everyone's costs

**Household Coordination**:

- **Communicate**: Discuss usage patterns and costs
- **Plan together**: Coordinate purchases for better rates
- **Be fair**: Contribute based on actual consumption

### Understanding Your Electricity Bill

**Rate Calculation**:

```
Your Rate = Total Payment ÷ Tokens Used
Fair Share = (Your Tokens ÷ Total Tokens) × Total Payment
```

**Example**:

- Purchase: 100 tokens for $150
- You used: 25 tokens
- Your fair share: (25 ÷ 100) × $150 = $37.50
- Your rate: $37.50 ÷ 25 = $1.50 per kWh

---

## 💾 Data Management & Backup (Admin Only)

### Accessing Data Management

**For Administrators Only**: Navigate to **Admin Panel** → **Data Management** to access backup and restore tools.

### Creating Backups

**Backup Types Available**:

1. **Full Backup**: Complete database including all users, purchases, contributions, and audit logs
2. **Users Only**: Just user accounts and settings
3. **Purchase Data**: Token purchases with their linked contributions (recommended for regular backups)

**Steps to Create Backup**:

1. **Go to Data Management**: Admin Panel → Data Management → Backup & Restore tab
2. **Select Backup Type**: Choose from Full, Users Only, or Purchase Data
3. **Choose Options**:
   - For Full Backup: Optionally include audit logs (last 10,000 entries)
4. **Click "Create Backup"**: Download will start automatically
5. **Save Securely**: Store backup files in a secure location

**Backup File Format**: JSON files with timestamps (e.g., `backup_full_2025-07-03.json`)

### Restoring from Backup

⚠️ **Warning**: Restoring overwrites existing data and cannot be undone. Always create a current backup before restoring.

**Steps to Restore**:

1. **Go to Backup & Restore tab**
2. **Upload Backup File**: Click "Choose File" and select a JSON backup
3. **Review File Details**: System shows file size and content summary
4. **Confirm Restore**: Click "Restore Data" (requires confirmation)
5. **Monitor Progress**: See detailed results including any errors
6. **Verify Data**: Check that all data restored correctly

### Data Export Options

**Regular Export Features** (Available to all users):

- **CSV Export**: For spreadsheet analysis
- **JSON Export**: Complete data structure
- **PDF Reports**: Professional formatted reports
- **Date Filtering**: Export specific time periods

**Admin Export Features**:

- **User Data**: Complete user account information
- **System Analytics**: Usage patterns and performance metrics
- **Audit Trail**: Complete activity logs

### Best Practices

**Regular Backup Schedule**:

- **Daily**: Automatic purchase data backups
- **Weekly**: Full system backup
- **Monthly**: Archived backup stored off-site
- **Before Updates**: Always backup before system changes

**Backup Security**:

- Store backups in multiple secure locations
- Encrypt sensitive backup files
- Test restore procedures periodically
- Document backup and recovery procedures

**When to Use Each Backup Type**:

- **Full Backup**: Before major system changes, monthly archives
- **Purchase Data**: Daily operational backups
- **Users Only**: Before user management changes

---

## 🗄️ Database Performance Management (Admin Only)

### Overview

The Database Performance tool helps administrators monitor and optimize the application's database performance by managing indexes that improve query speed.

### Accessing Database Performance

1. **Navigate to Admin Panel**
   - Go to Dashboard → Admin Panel
   - Click on "Database Performance" card

2. **Dashboard Features**
   - **Performance Stats**: View current database metrics
   - **Index Status**: See which performance indexes exist
   - **Quick Actions**: Check status and run optimization

### Using the Database Performance Tool

#### Checking Database Status

1. **Click "Check Status"** to refresh the current database performance information
2. **Review Index Status**:
   - ✅ **EXISTS**: Index is present and optimizing queries
   - ⚠️ **MISSING**: Index should be created for better performance
   - **Impact Level**: High/Medium/Low performance improvement expected

#### Running Database Optimization

1. **Click "Run Optimization"** to create missing indexes
2. **Confirmation Dialog**: 
   - ⚠️ **Warning**: Operation may temporarily affect performance
   - **Recommendation**: Run during low-traffic periods or outside business hours
   - **Options**: Click "OK" to proceed or "Cancel" to abort

3. **Results**:
   - Success message shows how many indexes were created
   - Index status automatically refreshes
   - Activity is logged in audit trail

### Database Indexes Managed

The tool manages these performance-critical indexes:

- **Purchase Date Index**: Optimizes sorting by purchase date (High impact)
- **Creator Name Index**: Improves creator name search performance (Medium impact)
- **Emergency Flag Index**: Optimizes emergency purchase filtering (Low impact)
- **Date Range Index**: Composite index for complex date queries (High impact)
- **Contribution Null Index**: Optimizes sequential contribution logic (Medium impact)
- **Tokens Payment Index**: Improves token and payment sorting (Low impact)

### Best Practices

**When to Run Optimization**:
- After system updates or upgrades
- When experiencing slow query performance
- During scheduled maintenance windows
- After significant data growth

**Safety Considerations**:
- Always run during low-traffic periods
- Monitor system performance after optimization
- Keep regular database backups
- Test in staging environment first if possible

**Monitoring**:
- Check performance stats regularly
- Review audit logs for optimization history
- Monitor query response times
- Watch for slow query alerts

### Troubleshooting

**If optimization fails**:
1. Check database connection
2. Verify admin permissions
3. Review audit logs for error details
4. Contact system administrator if issues persist

**Performance not improving**:
1. Allow time for database to utilize new indexes
2. Check if queries are actually using the indexes
3. Consider additional optimization strategies
4. Review overall system performance

---

## ❓ Frequently Asked Questions

### General Usage

**Q: How often should I check my meter reading?**
A: Weekly is ideal, but at minimum after each purchase and when contributing.

**Q: What if I forget to contribute to a purchase?**
A: You can contribute any time. The system tracks your balance and will show if you owe money.

**Q: Can I contribute more than my fair share?**
A: Yes, you can pay extra if desired. The system tracks overpayments.

**Q: What happens if someone doesn't contribute?**
A: The system tracks balances. Admins can see who owes money and follow up.

### Technical Issues

**Q: Why can't I enter a meter reading?**
A: Check that your reading is higher than the purchase reading and follows chronological order.

**Q: My contribution amount looks wrong**
A: The system calculates based on proportional usage. Check your meter reading accuracy.

**Q: I can't see certain features**
A: Some features require admin privileges. Contact your household admin.

**Q: The app isn't working on my phone**
A: Try refreshing the page or clearing your browser cache. Ensure you have internet connection.

### Understanding Costs

**Q: Why is my rate different from others?**
A: Rates vary based on when you consume electricity and which purchases you benefit from.

**Q: What's an emergency purchase?**
A: Purchases made when tokens are critically low, often at higher rates or inconvenient times.

**Q: How does the system calculate fair shares?**
A: Based on actual consumption: (Your tokens used ÷ Total tokens) × Total cost.

### Anticipated Payment Predictions

**Q: How accurate are the payment predictions?**
A: Predictions are based on historical usage patterns and current consumption. They're typically accurate within 10-15% for stable usage patterns.

**Q: Why is my anticipated payment different from what I actually paid last time?**
A: Predictions account for your current balance and recent usage changes. If your consumption pattern has changed or you have outstanding balances, predictions will reflect this.

**Q: What does "Others' Payment" mean?**
A: This shows how much other household members are expected to contribute based on their historical usage patterns relative to your current usage.

**Q: Why do the predictions show negative numbers?**
A: Negative numbers represent money that needs to be paid. This is normal - it means there's a cost that needs to be covered.

**Q: Can I use predictions to plan when to buy tokens?**
A: Yes! The "Anticipated Token Purchase" shows the total amount needed by the household. Use this to time purchases and avoid running out of electricity.

**Q: What if my predictions seem wrong?**
A: Predictions are estimates based on historical data. Check that your meter readings are accurate and consider that changing usage patterns will affect predictions.

---

## 🆘 Getting Help

### Self-Help Resources

1. **Check System Status**: Visit `/api/health` to see if systems are operational
2. **Review This Manual**: Most questions are answered here
3. **Try Different Browser**: Some issues are browser-specific
4. **Clear Cache**: Refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### Contacting Support

**For Technical Issues**:

- Note the exact error message
- Include your browser and device type
- Describe what you were trying to do
- Screenshot the problem if possible

**For Account Issues**:

- Contact your household admin first
- Provide your registered email address
- Describe the specific problem

**For Billing Questions**:

- Review your contribution history in Reports
- Check the balance tracking section
- Verify meter readings are accurate
- Discuss with household members if needed

### Emergency Contacts

**System Down**: Check status page or contact admin
**Data Issues**: Stop entering data and contact support immediately
**Security Concerns**: Change password and notify admin

---

## 🎯 Quick Reference

### Common Tasks

| Task            | Navigation         | Key Info                          |
| --------------- | ------------------ | --------------------------------- |
| Add Purchase    | Purchase Form      | Need: tokens, cost, meter reading |
| Contribute      | Contribute         | Need: current meter reading       |
| Check Balance   | Dashboard          | See overview section              |
| View Usage      | Reports → Usage    | Monthly trends and analysis       |
| Change Password | Profile → Security | Requires current password         |
| Contact Admin   | Dashboard          | Look for admin contact info       |

### Important Numbers

- **Maximum Purchase**: 100,000 tokens
- **Maximum Payment**: $1,000,000
- **Token = kWh**: 1:1 ratio
- **Session Timeout**: 30 days (adjustable)

### Key Formulas

**Basic Calculations**:

```
Tokens Consumed = Current Reading - Purchase Reading
Fair Share = (Your Tokens ÷ Total Tokens) × Total Payment
Rate per kWh = Total Payment ÷ Total Tokens
Your Rate = Your Payment ÷ Your Tokens
```

**Anticipated Payment Predictions**:

```
Your Anticipated Payment = Your Current Balance + Your Usage Cost Since Last Purchase
Others' Anticipated Payment = Your Usage Cost × (Others' Historical Usage ÷ Your Historical Fair Share)
Total Token Purchase Needed = Your Anticipated Payment + Others' Anticipated Payment

Where:
- Usage Cost Since Last Purchase = Tokens Used × Historical Rate per kWh
- Historical Rate per kWh = Total Historical True Cost ÷ Total Historical Tokens
- Others' Historical Usage = Total Historical Purchases - Your Historical Fair Share
```

---

**Remember**: This system is designed to make electricity cost sharing fair and transparent. When in doubt, communicate with your household members and check your actual meter readings regularly.

Happy tracking! ⚡
