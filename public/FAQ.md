# Frequently Asked Questions (FAQ)

## 🔍 Quick Find

| **New User Questions**                       | **Usage Questions**             | **Technical Issues**                   | **Cost & Billing**                  | **Admin Questions**                    |
| -------------------------------------------- | ------------------------------- | -------------------------------------- | ----------------------------------- | -------------------------------------- |
| [Getting Started](#-getting-started)         | [Daily Usage](#-daily-usage)    | [Login Problems](#-technical-issues)   | [Cost Calculation](#-cost--billing) | [User Management](#-admin--management) |
| [First Purchase](#-getting-started)          | [Meter Readings](#-daily-usage) | [App Not Working](#-technical-issues)  | [Fair Share](#-cost--billing)       | [Data Export](#-admin--management)     |
| [Understanding Dashboard](#-getting-started) | [Contributions](#-daily-usage)  | [Slow Performance](#-technical-issues) | [Overpayment](#-cost--billing)      | [System Backup](#-admin--management)   |

---

## 🚀 Getting Started

### Q: I'm new to this app. What exactly does it do?

**A:** Electricity Tokens Tracker helps households fairly split electricity costs based on actual usage. Here's how it works:

1. Someone buys electricity tokens (kWh) from the utility company
2. They enter the purchase details (tokens, cost, meter reading) in the app
3. Each household member records their meter reading and pays their fair share
4. The app calculates exactly how much electricity each person used
5. Everyone pays proportionally to their actual consumption

**Example**: If you used 25 kWh out of a 100 kWh purchase that cost $150, you pay (25÷100) × $150 = $37.50.

### Q: Do I need to be tech-savvy to use this?

**A:** Not at all! The app is designed for everyone. You mainly need to:

- Take meter readings (just like reading a car odometer)
- Enter some numbers in simple forms
- Check your usage reports occasionally

The app guides you through each step and calculates everything automatically.

### Q: What's a "token" in this system?

**A:** A token represents 1 kilowatt-hour (kWh) of electricity. It's a simple 1:1 relationship:

- **1 token = 1 kWh**
- If you buy "100 tokens," you bought 100 kWh of electricity
- Your electricity meter measures kWh, so the numbers match directly

### Q: How is this different from just splitting the electricity bill evenly?

**A:** **Fair vs. Equal**:

- **Equal split**: Everyone pays the same amount regardless of usage
- **Fair split (our system)**: Everyone pays based on actual consumption

**Example**:

```
3-person household, $150 electricity bill:
Equal split: $50 each (even if one person used 80% of the electricity)
Fair split: Person A used 60 kWh = $90, Person B used 25 kWh = $37.50, Person C used 15 kWh = $22.50
```

### Q: What if I'm the only one who knows how to buy electricity tokens?

**A:** That's common! You can:

1. Create all the purchases in the app
2. Others just need to contribute (much simpler)
3. The app tracks who owes what to whom
4. You get accurate records of all transactions

Many households have one "electricity manager" who handles purchases while others just contribute.

---

## ⚡ Daily Usage

### Q: How often do I need to check my meter reading?

**A:** **Recommended frequency**:

- **After each purchase**: Essential for accurate tracking
- **Weekly**: Good for monitoring usage patterns
- **When contributing**: Required for fair cost calculation
- **Monthly**: Minimum for basic functionality

**Pro tip**: Set a weekly reminder on your phone. It takes 30 seconds but ensures accurate cost sharing.

### Q: I can't find my electricity meter or don't know how to read it

**A:** **Finding your meter**:

- Usually outside your home/apartment
- Sometimes in a utility room or basement
- May be in a shared meter room (apartments)
- Contact your utility company if you can't locate it

**Reading the meter**:

- Look for a digital display showing kWh
- Write down ALL the numbers before the decimal
- Some meters show extra digits - use the main reading
- Take a photo for reference

**Still confused?** Ask a neighbor, landlord, or utility company for help. Once you know how, it's easy!

### Q: What if my meter reading seems wrong?

**A:** **Common meter reading issues**:

**Reading looks too high**:

- Double-check you're reading the right meter
- Ensure you're reading kWh, not other measurements
- Look for unusual electricity usage (heater left on, etc.)
- Compare with previous readings for reasonableness

**Reading looks too low**:

- Make sure you're reading all digits
- Check if the meter reset (rare, but possible)
- Verify you're reading the current reading, not historical data

**The app says "invalid reading"**:

- Your reading must be higher than the last purchase reading
- Check that you're reading in chronological order
- Contact admin if you're certain your reading is correct

### Q: What happens if I forget to contribute to a purchase?

**A:** **No problem!** You can contribute any time:

1. The app tracks all pending contributions
2. Your dashboard shows what you owe
3. You can contribute weeks or months later
4. The system maintains accurate balance tracking

**However**: Contributing promptly is courteous and helps with household cash flow.

### Q: Can I contribute more than my fair share?

**A:** **Yes!** You might want to:

- Round up for convenience ($37.63 → $40)
- Overpay to simplify future transactions
- Cover someone else who's short on cash

The app tracks overpayments and shows your positive balance. Others owe you money until it balances out.

### Q: What if someone never contributes?

**A:** **The app tracks everything**:

- Admins can see who owes money
- Balance reports show overdue amounts
- Audit logs track all activity (or lack thereof)

**Household solutions**:

- Set up friendly reminders
- Establish house rules about contribution timing
- Use the app's notification features
- Have a monthly "settlement" meeting

---

## 🔧 Technical Issues

### Q: I can't log in - it says "invalid credentials"

**A:** **Step-by-step troubleshooting**:

1. **Check your email and password**:
   - Email must be exactly as registered (check caps, spaces)
   - Password is case-sensitive
   - Try typing instead of copy-pasting

2. **Reset your password**:
   - Click "Forgot Password" on login page
   - Check your email (including spam folder)
   - Follow the reset link

3. **Clear browser data**:
   - Clear cookies and cache for the site
   - Try incognito/private browsing mode
   - Disable browser extensions temporarily

4. **Still not working?**:
   - Try a different browser
   - Contact your household admin
   - Check if your account is locked

### Q: The app is running very slowly

**A:** **Quick fixes**:

1. **Browser optimization**:
   - Close other tabs to free memory
   - Restart your browser
   - Clear cache: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

2. **Check your connection**:
   - Test other websites for speed
   - Try mobile data vs. WiFi
   - Restart your router if needed

3. **Device issues**:
   - Close other apps (mobile)
   - Restart your device
   - Free up storage space

4. **Check system status**:
   - Visit `/api/health` to see if servers are slow
   - Contact admin if widespread issue

### Q: I'm getting error messages I don't understand

**A:** **Common error messages and solutions**:

**"Constraint violation"**:

- You're trying to create duplicate data
- Check if you already contributed to this purchase
- Ensure meter readings are in correct order

**"Unauthorized"**:

- You need to log in again
- Your session may have expired
- Try refreshing the page

**"Forbidden"**:

- You don't have permission for this action
- Admin features require admin role
- Contact admin if you should have access

**"Network error"**:

- Check your internet connection
- Try again in a few minutes
- Switch between WiFi and mobile data

### Q: The mobile app isn't working properly

**A:** **Mobile-specific solutions**:

1. **Installation issues**:
   - Re-add to home screen
   - Clear browser cache before installing
   - Try different browser (Chrome, Safari, Firefox)

2. **Touch/interface problems**:
   - Try landscape mode for complex forms
   - Zoom in if buttons are too small
   - Restart the app completely

3. **Offline issues**:
   - Check internet connection
   - Try refreshing when back online
   - Some features require internet

### Q: My data disappeared or looks wrong

**A:** **Data issues require immediate attention**:

1. **Stop entering new data** immediately
2. **Document what's wrong**: Screenshots, descriptions
3. **Contact admin** with details
4. **Don't try to "fix" it yourself** - you might make it worse

**Common causes**:

- Browser cache issues (try different browser)
- Network problems during data entry
- Account logged into wrong household

---

## 💰 Cost & Billing

### Q: How exactly is my fair share calculated?

**A:** **The formula is simple and transparent**:

```
Your Fair Share = (Your Tokens Used ÷ Total Tokens) × Total Cost

Example:
Purchase: 100 tokens for $150
You used: 25 tokens
Your share: (25 ÷ 100) × $150 = $37.50
Your rate: $37.50 ÷ 25 = $1.50 per kWh
```

**Why this is fair**:

- Based on actual consumption, not estimates
- Proportional to real usage
- Transparent calculation everyone can verify
- No hidden fees or arbitrary splits

### Q: Why is my rate per kWh different from others?

**A:** **Several factors affect individual rates**:

1. **Timing of consumption**:
   - You benefit from purchases made when you were using electricity
   - Someone who uses electricity after their own purchase pays their own rate

2. **Emergency purchases**:
   - If you contribute to an emergency purchase, you pay the higher emergency rate
   - People who don't use emergency tokens pay standard rates

3. **Bulk purchase benefits**:
   - Larger purchases often have better rates
   - If you consume during a bulk purchase, you get the better rate

**Example**:

```
Purchase A: 50 tokens for $80 (rate: $1.60/kWh) - Emergency
Purchase B: 200 tokens for $280 (rate: $1.40/kWh) - Bulk

If you used 25 tokens from Purchase A: Your rate = $1.60/kWh
If you used 25 tokens from Purchase B: Your rate = $1.40/kWh
```

### Q: I think I'm overpaying. How can I check?

**A:** **Use the app's built-in tools**:

1. **Check your balance**: Dashboard shows if you're ahead or behind
2. **Review reports**: Reports → Financial → Balance Analysis
3. **Compare rates**: See if your rate is higher than household average
4. **Audit your contributions**: Review each contribution for accuracy

**Common overpayment causes**:

- Rounding up contributions for convenience
- Contributing to expensive emergency purchases
- Meter reading errors (reading too high)
- Contributing more than calculated fair share

**If you're consistently overpaying**:

- Others in your household owe you money
- You might be reading your meter incorrectly
- There might be an issue with the cost calculations

### Q: What happens if I underpay or don't pay at all?

**A:** **The app tracks everything**:

1. **Immediate effects**:
   - Your balance shows negative amount
   - Dashboard shows what you owe
   - Admins can see unpaid contributions

2. **Household impact**:
   - Others cover your share temporarily
   - Creates imbalance in cost sharing
   - May affect group dynamics

3. **System tracking**:
   - Complete audit trail of missing payments
   - Balance reports show historical underpayments
   - No automatic penalties, but everything is recorded

**Best practice**: Communicate with your household if you can't pay immediately. Most groups are understanding if you're upfront about timing.

### Q: Can I see how much everyone else is paying?

**A:** **Privacy vs. transparency balance**:

**What you CAN see**:

- Your own complete payment history
- Your balance vs. the group
- Your usage compared to household average
- Whether you're above or below average in costs

**What you CAN'T see** (regular users):

- Other people's specific payment amounts
- Individual meter readings
- Personal contribution details

**What ADMINS can see**:

- All user payment details
- Complete household financial overview
- Individual usage patterns
- Balance tracking for all users

This protects privacy while maintaining transparency about fair cost sharing.

---

## 👑 Admin & Management

### Q: How do I become an admin?

**A:** **Admin privileges are granted by**:

1. **Current admin**: Existing admin can promote your account
2. **Initial setup**: First user often becomes admin by default
3. **Household agreement**: Your household decides who should be admin

**To request admin access**:

- Contact current admin through the app or in person
- Explain why you need admin privileges
- Understand the responsibilities involved

**Admin responsibilities**:

- User account management
- Data integrity oversight
- System backup and maintenance
- Resolving disputes and errors

### Q: How do I manage users who aren't contributing?

**A:** **Admin tools for user management**:

1. **Identify non-contributors**:
   - Admin → Users → Filter by balance or activity
   - Look for negative balances or no recent contributions
   - Check audit logs for participation patterns

2. **Communication tools**:
   - Send notifications through the app
   - Use balance reports to show amounts owed
   - Generate summaries for household meetings

3. **Account management options**:
   - Lock accounts temporarily (prevents access)
   - Send automated reminders
   - Generate contribution reports

**Best practices**:

- Communicate before taking action
- Set clear household expectations
- Use the data to facilitate discussions
- Consider temporary solutions before permanent ones

### Q: How do I back up all our data?

**A:** **Built-in backup system**:

1. **Automatic recommendations**:
   - Visit Admin → Backup
   - System recommends backup frequency based on activity
   - High activity = daily backups recommended

2. **Create manual backup**:
   - Choose "Full Backup" (all data) or "Incremental" (recent changes)
   - System creates downloadable backup file
   - Includes all purchases, contributions, user data, audit logs

3. **Verify backup integrity**:
   - Use Admin → Backup → Verify
   - System checks data integrity and completeness
   - Always verify before relying on backups

4. **Store securely**:
   - Download and save to multiple locations
   - Cloud storage (Google Drive, Dropbox, etc.)
   - External hard drives
   - Consider encryption for sensitive data

### Q: Someone made an error. How do I fix it?

**A:** **Error correction procedures**:

**For contributions**:

1. **Delete incorrect contribution**: Admin → Contributions → Delete
2. **User creates new correct contribution**
3. **Verify the correction in audit logs**

**For purchases**:

1. **More complex** - affects all related contributions
2. **Check impact analysis**: Shows who will be affected
3. **Consider editing vs. deleting and recreating**
4. **Communicate changes to all affected users**

**For user accounts**:

1. **Edit user details**: Admin → Users → Edit
2. **Role changes**: Promote/demote carefully
3. **Account unlock**: If user is locked out

**Always**:

- Document what went wrong
- Explain corrections to affected users
- Check audit logs to ensure fix worked
- Learn from errors to prevent recurrence

### Q: How do I export data for tax purposes or external analysis?

**A:** **Data export options**:

**Export formats**:

- **CSV**: Best for Excel, Google Sheets, accounting software
- **JSON**: Technical format for developers or advanced analysis

**Export types**:

- **Purchases only**: All token purchases with dates and amounts
- **Contributions only**: All user contributions and payments
- **Users**: Account information and roles
- **Complete export**: Everything including audit logs

**Steps to export**:

1. **Admin → Data Management → Export**
2. **Select date range** (or "All time")
3. **Choose format and type**
4. **Click Export** - file downloads automatically

**Uses for exported data**:

- Import into accounting software
- Create custom reports in Excel
- Tax preparation and documentation
- Historical analysis and budgeting
- Migration to other systems

---

## 🔒 Privacy & Security

### Q: Is my personal usage data private?

**A:** **Privacy protections built into the system**:

**What's private**:

- Your specific meter readings
- Exact contribution amounts
- Payment details and history
- Personal usage patterns

**What's shared**:

- Whether you've contributed to purchases (yes/no)
- Your participation in household cost sharing
- General activity (when you last used the system)

**Admin access**:

- Admins can see all financial data for management purposes
- This is necessary for resolving disputes and maintaining fairness
- Choose admins you trust with financial information

### Q: How secure is my login information?

**A:** **Security measures**:

**Password protection**:

- Passwords are encrypted and never stored in plain text
- Strong password requirements enforced
- Account lockout after failed login attempts

**Session security**:

- Secure session management with timeouts
- HTTPS encryption for all data transmission
- CSRF protection against cross-site attacks

**Data protection**:

- Database encryption at rest
- Regular security updates
- Access logging and monitoring

**Best practices for users**:

- Use unique, strong passwords
- Log out from shared devices
- Don't share login credentials
- Report suspicious activity immediately

### Q: What happens to our data if we stop using the app?

**A:** **Data retention and deletion**:

**While active**:

- All data retained for historical tracking
- Complete audit trail maintained
- Backup copies for data recovery

**If household stops using**:

- Export all data before discontinuing
- Data remains accessible as long as accounts are active
- Consider downloading final reports for records

**Account deletion**:

- Contact admin to delete accounts
- Consider data retention requirements (taxes, disputes)
- Some data may need to be retained for legal/audit purposes

**Migration to other systems**:

- Complete data export available
- CSV format compatible with most systems
- Historical data can be preserved independently

---

## 🆘 Emergency & Support

### Q: The system is down. What do I do?

**A:** **Emergency troubleshooting steps**:

1. **Check system status**:
   - Try visiting `/api/health`
   - Check if error is local or system-wide
   - Test different devices/browsers

2. **Immediate workarounds**:
   - Continue taking meter readings (write them down)
   - Keep receipts for any electricity purchases
   - Document any urgent issues

3. **Communication**:
   - Contact household admin
   - Check if others are experiencing issues
   - Look for system status updates

4. **When system returns**:
   - Enter any missed data
   - Verify all information is correct
   - Check recent activity for completeness

### Q: I think there's a billing error. What should I do?

**A:** **Error investigation process**:

1. **Document the issue**:
   - Screenshot the problem
   - Note exact error messages
   - Record what you expected vs. what you see

2. **Self-check first**:
   - Verify your meter readings
   - Check your calculation manually
   - Review recent contributions

3. **Gather information**:
   - What purchase is involved?
   - What meter readings were used?
   - What amounts were calculated?

4. **Contact resolution**:
   - Speak with household admin
   - Provide all documentation
   - Be prepared to work through the calculation together

5. **System correction**:
   - Admin can investigate using audit logs
   - Corrections can be made with proper authorization
   - All changes are logged for transparency

### Q: I'm locked out of my account. Help!

**A:** **Account lockout recovery**:

**Common causes**:

- Too many failed login attempts
- Admin locked the account
- Password expired or changed

**Recovery steps**:

1. **Try password reset**: Use "Forgot Password" link
2. **Contact admin**: They can unlock your account
3. **Wait and retry**: Automatic lockouts may be temporary
4. **Verify email**: Make sure you're using the right email address

**Prevention**:

- Use password managers to avoid typos
- Update passwords before they expire
- Communicate with admin before issues arise

### Q: Who do I contact for help?

**A:** **Support hierarchy**:

1. **Self-help first**:
   - Check this FAQ
   - Review user manual
   - Try basic troubleshooting

2. **Household admin**:
   - User account issues
   - Data corrections
   - General questions

3. **Technical support**:
   - System-wide outages
   - Security concerns
   - Data corruption issues

4. **Emergency contact**:
   - Data loss
   - Security breaches
   - System unavailability

**Information to provide when seeking help**:

- Your email address (for account lookup)
- Exact error messages
- What you were trying to do
- Browser and device information
- Screenshots if possible

---

## 📊 Quick Reference

### Essential Formulas

```
Fair Share = (Your Tokens ÷ Total Tokens) × Total Cost
Your Rate = Your Payment ÷ Your Tokens Consumed
Consumption = Current Reading - Purchase Reading
Balance = Total Paid - Fair Share Owed
```

### Common Tasks

| Task                   | Time Required | Difficulty |
| ---------------------- | ------------- | ---------- |
| Take meter reading     | 30 seconds    | Easy       |
| Create purchase        | 2 minutes     | Easy       |
| Add contribution       | 1 minute      | Easy       |
| Check balance          | 10 seconds    | Easy       |
| Review monthly report  | 5 minutes     | Easy       |
| Export data (admin)    | 1 minute      | Medium     |
| Fix user error (admin) | 5 minutes     | Medium     |

### Emergency Contacts Checklist

- [ ] Household admin contact info saved
- [ ] Know how to take meter readings
- [ ] Understand basic troubleshooting
- [ ] Have backup of important data
- [ ] Know system status check URL

---

**Still have questions?** Check the User Manual for detailed tutorials, or contact your household admin for personalized help. The system is designed to be simple and fair - when in doubt, accuracy in meter readings is the most important thing! ⚡
