/**
 * chart-styles.ts - Centralized styling for all charts (ported from Python)
 */

// Brand colors
export const BRAND_COLORS = {
  kinetix: '#1CA2DC',  // KinetiX blue
  dynamix: '#4CB848',  // DynamiX green
  epix: '#FFC20E',     // EpiX yellow
} as const;

// Product-specific colors
export const PRODUCT_COLORS = {
  'KinetiX': BRAND_COLORS.kinetix,
  'DynamiX': BRAND_COLORS.dynamix,
  'EpiX': BRAND_COLORS.epix
} as const;

// Extended color palette for other chart elements
export const EXTENDED_COLORS = {
  blue: '#2196F3',
  orange: '#FF9800',
  red: '#F44336',
  purple: '#9C27B0',
  teal: '#009688',
  gray: '#607D8B'
} as const;

// Combined color palette
export const COLORS = { ...BRAND_COLORS, ...EXTENDED_COLORS };

// Chart theme settings
export const CHART_THEME = {
  font_family: 'Arial, sans-serif',
  background_color: '#FFFFFF',
  grid_color: '#E0E0E0',
  axis_color: '#757575',
  title_font_size: 18,
  axis_font_size: 12,
  legend_font_size: 10,
  title_font_weight: 'bold'
} as const;

// Predefined layouts for different chart types
export const LAYOUTS = {
  default: {
    margin: { l: 50, r: 50, t: 80, b: 50 },
    paper_bgcolor: CHART_THEME.background_color,
    plot_bgcolor: CHART_THEME.background_color,
    font: {
      family: CHART_THEME.font_family,
      color: '#333333',
      size: CHART_THEME.axis_font_size
    },
    yaxis_range: null, // Default to auto-scale
    xaxis: {
      gridcolor: CHART_THEME.grid_color,
      linecolor: CHART_THEME.axis_color,
      showgrid: true,
      gridwidth: 1,
      linewidth: 1
    },
    yaxis: {
      gridcolor: CHART_THEME.grid_color,
      linecolor: CHART_THEME.axis_color,
      showgrid: true,
      gridwidth: 1,
      linewidth: 1
    },
    legend: {
      font: { size: CHART_THEME.legend_font_size },
      bgcolor: 'rgba(255,255,255,0.5)',
      bordercolor: CHART_THEME.grid_color,
      borderwidth: 1
    },
    hoverlabel: {
      font: { family: CHART_THEME.font_family },
      bordercolor: '#FFFFFF'
    }
  },
  stacked: {
    barmode: 'stack',
    showlegend: true,
    hovermode: 'x unified'
  },
  gauge: {
    margin: { l: 20, r: 20, t: 60, b: 20 },
    paper_bgcolor: CHART_THEME.background_color,
    font: {
      family: CHART_THEME.font_family,
      color: '#333333',
      size: CHART_THEME.axis_font_size
    }
  }
} as const;

// Function to get color for a specific product
export function getProductColor(productName: string): string {
  return PRODUCT_COLORS[productName as keyof typeof PRODUCT_COLORS] || EXTENDED_COLORS.blue;
}

// Function to get a list of colors for a set of categories
export function getColorSequence(categories: string[]): string[] {
  const colors: string[] = [];
  const extendedColorValues = Object.values(EXTENDED_COLORS);
  
  for (const category of categories) {
    if (category in PRODUCT_COLORS) {
      colors.push(PRODUCT_COLORS[category as keyof typeof PRODUCT_COLORS]);
    } else {
      // Use extended colors for non-product categories
      const idx = colors.length % extendedColorValues.length;
      colors.push(extendedColorValues[idx]);
    }
  }
  return colors;
}

// Chart-specific configurations
export const CHART_CONFIGS = {
  percentage: {
    yaxis_range: [0, 1], // For percentage charts (0-100%)
    yaxis_tickformat: ',.0%'
  },
  uptime_yield: {
    yaxis_range: [0, 1], // Force 0-100% scale for uptime/yield
    yaxis_tickformat: ',.0%',
    grid_alpha: 0.3
  }
} as const;

// Function to create hover template
export function createHoverTemplate(prefix: string = '', suffix: string = ''): string {
  return (
    "<b>%{fullData.name}</b><br>" +
    "%{x}<br>" +
    `${prefix}%{y:,.0f}${suffix}<br>` +
    "<extra></extra>"
  );
}

// Utility functions for formatting
export function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Chart generation types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  subtitle?: string;
  currency?: boolean;
  stacked?: boolean;
}
