/**
 * Derived metrics are calculated from base metrics and other derived metrics.
 * This file defines the formulas and dependencies for each derived metric.
 */

import { BASE_METRICS } from './base-metrics';

// Define the type for a metric calculation function
export type MetricCalculator = (data: Record<string, number>) => number;

// Interface for derived metric definitions
export interface DerivedMetricDefinition {
  name: string;
  dependencies: string[];
  calculator: MetricCalculator;
  description?: string;
}

/**
 * Derived metrics definitions with their calculation formulas and dependencies
 */
export const DERIVED_METRICS: DerivedMetricDefinition[] = [
  // Cost of Goods Metrics
  {
    name: 'Total COGS',
    dependencies: [
      'Process Labor',
      'Raw Material',
      'Packaging',
      'Maintenance',
      'Waste',
      'Inventory',
      'Utilities',
      'Shipping'
    ],
    calculator: (data) => {
      return (
        (data['Process Labor'] || 0) +
        (data['Raw Material'] || 0) +
        (data['Packaging'] || 0) +
        (data['Maintenance'] || 0) +
        (data['Waste'] || 0) +
        (data['Inventory'] || 0) +
        (data['Utilities'] || 0) +
        (data['Shipping'] || 0)
      );
    },
    description: 'Sum of all cost of goods sold components'
  },
  
  // Unit Metrics
  {
    name: 'Unit Process Labor',
    dependencies: ['Process Labor', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Process Labor'] || 0) / data['Tons'] : 0;
    },
    description: 'Process labor cost per ton'
  },
  {
    name: 'Unit Raw Material',
    dependencies: ['Raw Material', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Raw Material'] || 0) / data['Tons'] : 0;
    },
    description: 'Raw material cost per ton'
  },
  {
    name: 'Unit Packaging',
    dependencies: ['Packaging', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Packaging'] || 0) / data['Tons'] : 0;
    },
    description: 'Packaging cost per ton'
  },
  {
    name: 'Unit Maintenance',
    dependencies: ['Maintenance', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Maintenance'] || 0) / data['Tons'] : 0;
    },
    description: 'Maintenance cost per ton'
  },
  {
    name: 'Unit Waste',
    dependencies: ['Waste', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Waste'] || 0) / data['Tons'] : 0;
    },
    description: 'Waste cost per ton'
  },
  {
    name: 'Unit Inventory',
    dependencies: ['Inventory', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Inventory'] || 0) / data['Tons'] : 0;
    },
    description: 'Inventory cost per ton'
  },
  {
    name: 'Unit Utilities',
    dependencies: ['Utilities', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Utilities'] || 0) / data['Tons'] : 0;
    },
    description: 'Utilities cost per ton'
  },
  {
    name: 'Unit Shipping',
    dependencies: ['Shipping', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Shipping'] || 0) / data['Tons'] : 0;
    },
    description: 'Shipping cost per ton'
  },
  {
    name: 'Total Unit COGS',
    dependencies: ['Total COGS', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? (data['Total COGS'] || 0) / data['Tons'] : 0;
    },
    description: 'Total cost of goods sold per ton'
  },
  
  // SG&A Expenses
  {
    name: 'Total Expenses',
    dependencies: [
      'Professional Fees',
      'Sales & Marketing',
      'Overhead Labor',
      'Benefits',
      'Accounting',
      'Equipment Rental',
      'Tax',
      'Insurance',
      'Office',
      'Banking',
      'R&D',
      'Warehouse',
      'Misc',
      'Legal'
    ],
    calculator: (data) => {
      return (
        (data['Professional Fees'] || 0) +
        (data['Sales & Marketing'] || 0) +
        (data['Overhead Labor'] || 0) +
        (data['Benefits'] || 0) +
        (data['Accounting'] || 0) +
        (data['Equipment Rental'] || 0) +
        (data['Tax'] || 0) +
        (data['Insurance'] || 0) +
        (data['Office'] || 0) +
        (data['Banking'] || 0) +
        (data['R&D'] || 0) +
        (data['Warehouse'] || 0) +
        (data['Misc'] || 0) +
        (data['Legal'] || 0)
      );
    },
    description: 'Sum of all SG&A expenses'
  },
  
  // Business Performance Metrics
  {
    name: 'Tons/Order',
    dependencies: ['Tons', 'Total Orders'],
    calculator: (data) => {
      return data['Total Orders'] > 0 ? data['Tons'] / data['Total Orders'] : 0;
    },
    description: 'Average tons per order'
  },
  {
    name: 'Revenue/Order',
    dependencies: ['Product Revenue', 'Total Orders'],
    calculator: (data) => {
      return data['Total Orders'] > 0 ? data['Product Revenue'] / data['Total Orders'] : 0;
    },
    description: 'Average revenue per order'
  },
  {
    name: 'Average Price',
    dependencies: ['Product Revenue', 'Tons'],
    calculator: (data) => {
      return data['Tons'] > 0 ? data['Product Revenue'] / data['Tons'] : 0;
    },
    description: 'Average price per ton'
  },
  {
    name: 'Average GM',
    dependencies: ['Average Price', 'Total Unit COGS'],
    calculator: (data) => {
      return (data['Average Price'] || 0) - (data['Total Unit COGS'] || 0);
    },
    description: 'Average gross margin per ton'
  },
  {
    name: 'Average OM',
    dependencies: ['Average GM', 'Total Expenses', 'Tons'],
    calculator: (data) => {
      const unitExpenses = data['Tons'] > 0 ? (data['Total Expenses'] || 0) / data['Tons'] : 0;
      return (data['Average GM'] || 0) - unitExpenses;
    },
    description: 'Average operating margin per ton'
  },
  {
    name: '% Average GM',
    dependencies: ['Average GM', 'Average Price'],
    calculator: (data) => {
      return data['Average Price'] > 0 
        ? ((data['Average GM'] || 0) / data['Average Price']) * 100 
        : 0;
    },
    description: 'Average gross margin as a percentage of price'
  },
  {
    name: '% Average OM',
    dependencies: ['Average OM', 'Average Price'],
    calculator: (data) => {
      return data['Average Price'] > 0 
        ? ((data['Average OM'] || 0) / data['Average Price']) * 100 
        : 0;
    },
    description: 'Average operating margin as a percentage of price'
  }
];

// Create a map of derived metrics for easy lookup
export const DERIVED_METRICS_MAP = new Map<string, DerivedMetricDefinition>(
  DERIVED_METRICS.map(metric => [metric.name, metric])
);

// Get all metric names (base and derived)
export const ALL_METRICS = [...BASE_METRICS, ...DERIVED_METRICS.map(m => m.name)];

// Build dependency graph for topological sorting
export const buildDependencyGraph = (): Map<string, Set<string>> => {
  const graph = new Map<string, Set<string>>();
  
  // Initialize graph with all metrics
  ALL_METRICS.forEach(metric => {
    graph.set(metric, new Set<string>());
  });
  
  // Add dependencies
  DERIVED_METRICS.forEach(metric => {
    metric.dependencies.forEach(dependency => {
      const dependents = graph.get(dependency) || new Set<string>();
      dependents.add(metric.name);
      graph.set(dependency, dependents);
    });
  });
  
  return graph;
};

// Topologically sort metrics to ensure they're calculated in the correct order
export const getCalculationOrder = (): string[] => {
  const graph = buildDependencyGraph();
  const visited = new Set<string>();
  const temp = new Set<string>();
  const order: string[] = [];
  
  const visit = (metric: string) => {
    if (temp.has(metric)) {
      throw new Error(`Circular dependency detected involving ${metric}`);
    }
    
    if (!visited.has(metric)) {
      temp.add(metric);
      
      const dependents = graph.get(metric) || new Set<string>();
      dependents.forEach(dependent => {
        visit(dependent);
      });
      
      temp.delete(metric);
      visited.add(metric);
      order.push(metric);
    }
  };
  
  // Start with base metrics
  BASE_METRICS.forEach(metric => {
    if (!visited.has(metric)) {
      visit(metric);
    }
  });
  
  return order;
};
