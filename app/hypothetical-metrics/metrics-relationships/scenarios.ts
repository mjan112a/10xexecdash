/**
 * Predefined scenarios that users can load and use as starting points.
 * These scenarios represent common business situations and adjustments.
 */

import { MetricAdjustment, Scenario } from './relationship-engine';

// Helper function to create a scenario with adjustments applied to all months
function createScenarioForAllMonths(
  id: string,
  name: string,
  description: string,
  adjustments: MetricAdjustment[],
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
): Scenario {
  const scenarioAdjustments: Record<string, MetricAdjustment[]> = {};
  
  months.forEach(month => {
    scenarioAdjustments[month] = [...adjustments];
  });
  
  return {
    id,
    name,
    description,
    adjustments: scenarioAdjustments,
    createdAt: new Date().toISOString()
  };
}

// Predefined scenarios
export const PREDEFINED_SCENARIOS: Scenario[] = [
  // Cost Reduction Scenario
  createScenarioForAllMonths(
    'cost-reduction',
    'Cost Reduction',
    'Reduce costs across all categories to improve margins',
    [
      { metric: 'Process Labor', type: 'percentage', value: -10 },
      { metric: 'Raw Material', type: 'percentage', value: -5 },
      { metric: 'Packaging', type: 'percentage', value: -8 },
      { metric: 'Maintenance', type: 'percentage', value: -12 },
      { metric: 'Waste', type: 'percentage', value: -20 },
      { metric: 'Inventory', type: 'percentage', value: -15 },
      { metric: 'Utilities', type: 'percentage', value: -7 },
      { metric: 'Shipping', type: 'percentage', value: -6 },
      { metric: 'Professional Fees', type: 'percentage', value: -15 },
      { metric: 'Sales & Marketing', type: 'percentage', value: -10 },
      { metric: 'Overhead Labor', type: 'percentage', value: -8 },
      { metric: 'Benefits', type: 'percentage', value: -5 },
    ]
  ),
  
  // Revenue Growth Scenario
  createScenarioForAllMonths(
    'revenue-growth',
    'Revenue Growth',
    'Increase revenue through higher volume and prices',
    [
      { metric: 'Total Orders', type: 'percentage', value: 15 },
      { metric: 'Tons', type: 'percentage', value: 18 },
      { metric: 'Product Revenue', type: 'percentage', value: 25 },
      // Increased costs due to higher volume
      { metric: 'Process Labor', type: 'percentage', value: 10 },
      { metric: 'Raw Material', type: 'percentage', value: 15 },
      { metric: 'Packaging', type: 'percentage', value: 12 },
      { metric: 'Shipping', type: 'percentage', value: 14 },
      // Increased marketing to drive growth
      { metric: 'Sales & Marketing', type: 'percentage', value: 30 },
    ]
  ),
  
  // Efficiency Improvement Scenario
  createScenarioForAllMonths(
    'efficiency-improvement',
    'Efficiency Improvement',
    'Improve operational efficiency while maintaining output',
    [
      { metric: 'Process Labor', type: 'percentage', value: -15 },
      { metric: 'Raw Material', type: 'percentage', value: -8 },
      { metric: 'Waste', type: 'percentage', value: -30 },
      { metric: 'Utilities', type: 'percentage', value: -12 },
      { metric: 'Maintenance', type: 'percentage', value: 5 }, // Slight increase for better maintenance
      { metric: 'R&D', type: 'percentage', value: 20 }, // Increased R&D to drive efficiency
    ]
  ),
  
  // Market Expansion Scenario
  createScenarioForAllMonths(
    'market-expansion',
    'Market Expansion',
    'Expand into new markets with increased marketing and sales efforts',
    [
      { metric: 'Total Orders', type: 'percentage', value: 25 },
      { metric: 'Tons', type: 'percentage', value: 22 },
      { metric: 'Product Revenue', type: 'percentage', value: 30 },
      { metric: 'Sales & Marketing', type: 'percentage', value: 50 },
      { metric: 'Overhead Labor', type: 'percentage', value: 15 },
      { metric: 'Professional Fees', type: 'percentage', value: 20 },
      { metric: 'Shipping', type: 'percentage', value: 25 },
    ]
  ),
  
  // Economic Downturn Scenario
  createScenarioForAllMonths(
    'economic-downturn',
    'Economic Downturn',
    'Adjust to an economic downturn with reduced demand',
    [
      { metric: 'Total Orders', type: 'percentage', value: -20 },
      { metric: 'Tons', type: 'percentage', value: -18 },
      { metric: 'Product Revenue', type: 'percentage', value: -25 },
      // Cost cutting measures
      { metric: 'Process Labor', type: 'percentage', value: -15 },
      { metric: 'Overhead Labor', type: 'percentage', value: -10 },
      { metric: 'Benefits', type: 'percentage', value: -8 },
      { metric: 'Sales & Marketing', type: 'percentage', value: -30 },
      { metric: 'R&D', type: 'percentage', value: -25 },
      { metric: 'Office', type: 'percentage', value: -20 },
    ]
  ),
  
  // Price Increase Scenario
  createScenarioForAllMonths(
    'price-increase',
    'Price Increase',
    'Increase prices while maintaining volume',
    [
      { metric: 'Product Revenue', type: 'percentage', value: 15 },
      // No change in volume
      { metric: 'Total Orders', type: 'percentage', value: 0 },
      { metric: 'Tons', type: 'percentage', value: 0 },
      // Slight increase in marketing to support price increase
      { metric: 'Sales & Marketing', type: 'percentage', value: 5 },
    ]
  ),
  
  // Raw Material Cost Increase Scenario
  createScenarioForAllMonths(
    'raw-material-cost-increase',
    'Raw Material Cost Increase',
    'Adjust to increased raw material costs',
    [
      { metric: 'Raw Material', type: 'percentage', value: 25 },
      // Partial price increase to offset costs
      { metric: 'Product Revenue', type: 'percentage', value: 10 },
      // Efficiency measures to offset costs
      { metric: 'Process Labor', type: 'percentage', value: -5 },
      { metric: 'Waste', type: 'percentage', value: -10 },
      { metric: 'Utilities', type: 'percentage', value: -3 },
    ]
  ),
  
  // Seasonal Demand Scenario
  createScenarioForAllMonths(
    'seasonal-demand',
    'Seasonal Demand',
    'Model seasonal fluctuations in demand',
    [
      // Q1: Low season
      { metric: 'Total Orders', type: 'percentage', value: -15 },
      { metric: 'Tons', type: 'percentage', value: -15 },
      { metric: 'Product Revenue', type: 'percentage', value: -15 },
      
      // Q2: Moderate season
      { metric: 'Total Orders', type: 'percentage', value: 5 },
      { metric: 'Tons', type: 'percentage', value: 5 },
      { metric: 'Product Revenue', type: 'percentage', value: 5 },
      
      // Q3: Peak season
      { metric: 'Total Orders', type: 'percentage', value: 30 },
      { metric: 'Tons', type: 'percentage', value: 30 },
      { metric: 'Product Revenue', type: 'percentage', value: 35 },
      
      // Q4: Moderate-high season
      { metric: 'Total Orders', type: 'percentage', value: 15 },
      { metric: 'Tons', type: 'percentage', value: 15 },
      { metric: 'Product Revenue', type: 'percentage', value: 18 },
    ],
    // Apply different adjustments to different quarters
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  ),
];

// Function to get a scenario by ID
export function getScenarioById(id: string): Scenario | undefined {
  return PREDEFINED_SCENARIOS.find(scenario => scenario.id === id);
}

// Function to get all scenario IDs and names
export function getScenarioOptions(): { id: string; name: string }[] {
  return PREDEFINED_SCENARIOS.map(scenario => ({
    id: scenario.id,
    name: scenario.name
  }));
}
