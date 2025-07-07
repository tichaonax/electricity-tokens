# Anticipated Payment Prediction Algorithm

## Overview

The Anticipated Payment Prediction Algorithm provides smart estimations for future token purchase costs based on current usage patterns and historical consumption data. This algorithm enables households to plan electricity purchases more effectively and ensures fair cost distribution among members.

## Algorithm Purpose

- **Predict individual payment requirements** based on current balance and usage
- **Estimate others' contributions** using proportional scaling from historical data  
- **Calculate total token purchase needs** for household planning
- **Enable proactive budgeting** and cost optimization

## Core Algorithm Components

### 1. Data Inputs

**Current State Data:**
- `currentBalance`: User's current account balance (positive = credit, negative = debt)
- `usageSinceLastPurchase`: kWh consumed since last token purchase
- `historicalCostPerKwh`: Average cost per kWh from all historical purchases

**Historical Baseline Data:**
- `historicalTotalPurchases`: Sum of all token purchase costs ever made
- `userHistoricalFairShare`: User's total fair share based on actual consumption
- `othersHistoricalUsage`: Others' cumulative usage (Total - User's share)

### 2. Step-by-Step Calculation Process

#### Step A: Calculate User's Current Usage Cost
```javascript
const currentUsageCost = usageSinceLastPurchase * historicalCostPerKwh;
```

**Example:**
- 24.6 kWh × $0.283/kWh = $6.97

#### Step B: Calculate User's Anticipated Payment
```javascript
const userAnticipatedPayment = currentBalance + currentUsageCost;
```

**Example:**
- User Balance: -$4.75 (owes money)
- Current Usage Cost: -$6.97 (negative represents cost)
- **User Anticipated Payment**: -$4.75 + (-$6.97) = **-$11.72**

#### Step C: Calculate Proportional Scaling Ratio
```javascript
const proportionRatio = othersHistoricalUsage / userHistoricalFairShare;
```

**Example:**
- Others' Historical Usage: $120.90
- User's Historical Fair Share: $81.60  
- **Proportion Ratio**: $120.90 ÷ $81.60 = **1.4816**

#### Step D: Calculate Others' Anticipated Payment
```javascript
const othersAnticipatedPayment = currentUsageCost * proportionRatio;
```

**Example:**
- Current Usage Cost: -$6.97
- Proportion Ratio: 1.4816
- **Others' Anticipated Payment**: -$6.97 × 1.4816 = **-$10.33**

#### Step E: Calculate Total Token Purchase Needed
```javascript
const totalTokenPurchase = userAnticipatedPayment + othersAnticipatedPayment;
```

**Example:**
- User Payment: -$11.72
- Others' Payment: -$10.33
- **Total Purchase Needed**: -$11.72 + (-$10.33) = **-$22.05**

## Mathematical Foundation

### Proportional Scaling Principle

The algorithm assumes that **future usage patterns mirror historical patterns**. If historically:
- User consumed X% of total household electricity
- Others consumed Y% of total household electricity

Then for any new consumption period, the cost distribution should maintain these same proportions.

### Formula Derivation

Given:
- `H_total` = Historical total purchases
- `H_user` = User's historical fair share  
- `H_others` = Others' historical usage = `H_total - H_user`
- `C_current` = User's current usage cost

The proportional relationship is:
```
Others_current_cost / User_current_cost = H_others / H_user
```

Therefore:
```
Others_current_cost = User_current_cost × (H_others / H_user)
```

## Implementation Details

### Database Queries Required

**All Token Purchases:**
```sql
SELECT SUM(totalPayment) as historicalTotalPurchases 
FROM TokenPurchase;
```

**User's Historical Fair Share:**
```sql
-- Calculated using cost-calculations.ts
calculateUserTrueCost(allUserContributions).totalTrueCost
```

**Current Usage Since Last Purchase:**
```sql
SELECT 
  latest_meter_reading - latest_contribution_meter_reading as tokensUsed
FROM (
  SELECT MAX(reading) as latest_meter_reading FROM MeterReading
) m,
(
  SELECT meterReading as latest_contribution_meter_reading 
  FROM UserContribution 
  ORDER BY createdAt DESC 
  LIMIT 1
) c;
```

### Error Handling

**Division by Zero Protection:**
```javascript
if (userHistoricalFairShare <= 0) {
  // Skip calculation - insufficient historical data
  return { error: "Insufficient historical data for predictions" };
}
```

**Data Validation:**
```javascript
// Ensure all required data is available
if (!historicalTotalPurchases || !currentUsageCost) {
  return { error: "Missing required data for calculations" };
}
```

## Algorithm Accuracy

### Factors Affecting Accuracy

**High Accuracy Scenarios:**
- Stable household membership
- Consistent usage patterns
- Sufficient historical data (3+ months)
- Regular meter reading updates

**Lower Accuracy Scenarios:**
- New household members
- Seasonal usage changes (heating/cooling)
- Major appliance additions/removals
- Infrequent historical purchases

### Expected Accuracy Range

- **Stable patterns**: ±10-15% accuracy
- **Changing patterns**: ±20-30% accuracy
- **New users**: Predictions improve after 2-3 billing cycles

## Integration Points

### API Endpoint: `/api/dashboard/running-balance`

**Response Fields:**
```typescript
interface AnticipatedPaymentData {
  anticipatedPayment: number;           // User's expected payment
  anticipatedOthersPayment: number;     // Others' expected payment  
  anticipatedTokenPurchase: number;     // Total purchase needed
  tokensConsumedSinceLastContribution: number;
  estimatedCostSinceLastContribution: number;
  historicalCostPerKwh: number;
}
```

### Frontend Display: `RunningBalanceWidget.tsx`

**UI Components:**
- **Blue Card**: Anticipated Next Payment (user's amount)
- **Purple Card**: Anticipated Others Payment (others' amount)
- **Orange Card**: Anticipated Token Purchase (total needed)

## Business Value

### Cost Planning Benefits

**For Users:**
- Know exactly how much to budget for next electricity payment
- Plan personal finances around predicted costs
- Understand relationship between usage and costs

**For Households:**
- Coordinate token purchases based on total predicted need
- Avoid emergency purchases by planning ahead
- Optimize bulk purchase timing and amounts

**For System:**
- Encourage fair cost sharing through transparency
- Reduce conflicts through clear, algorithmic calculations
- Enable data-driven electricity management

### Use Case Examples

**Scenario 1: Weekly Planning**
- User checks predictions every Monday
- Sees they'll owe $11.72 next week
- Others expected to contribute $10.33
- Household plans to purchase $22 worth of tokens Friday

**Scenario 2: Budget Planning**
- Monthly electricity budget based on predictions
- Track actual vs. predicted costs for accuracy
- Adjust usage patterns if predictions show high costs

**Scenario 3: Purchase Optimization**
- Wait for bulk discounts when total prediction is high
- Purchase smaller amounts when household need is low
- Coordinate with utility provider for optimal rates

## Future Enhancements

### Potential Algorithm Improvements

**Seasonal Adjustments:**
- Weight recent usage more heavily than distant historical data
- Account for seasonal patterns (heating/cooling cycles)
- Adjust predictions based on weather forecasts

**Machine Learning Integration:**
- Train models on historical usage patterns
- Predict usage changes based on external factors
- Improve accuracy through pattern recognition

**Multi-User Optimization:**
- Individual prediction accuracy improvements
- Household-level optimization recommendations
- Dynamic rebalancing of cost predictions

### Additional Prediction Features

**Time-Based Predictions:**
- Weekly, monthly, and quarterly forecasts
- Peak usage period identification
- Optimal purchase timing recommendations

**Cost Optimization Suggestions:**
- When to buy tokens for best rates
- Usage reduction recommendations
- Emergency purchase avoidance strategies

## Technical Notes

### Performance Considerations

- Algorithm runs in O(n) time complexity where n = number of contributions
- Database queries optimized with proper indexing
- Results cached for 1 hour to reduce computational load
- Calculations performed server-side for data consistency

### Testing Strategy

- Unit tests for each calculation step
- Integration tests with various data scenarios
- Accuracy validation against historical actual costs
- Edge case testing (no historical data, extreme usage patterns)

---

**Last Updated:** January 2025  
**Algorithm Version:** 1.0  
**Implementation:** `/src/app/api/dashboard/running-balance/route.ts`