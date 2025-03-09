import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { VisualizationData, ChartType } from '@/utils/metrics-visualization';

// Define colors for charts
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', 
  '#00c49f', '#ffbb28', '#ff8042', '#a4de6c'
];

interface MetricsVisualizationProps {
  data: VisualizationData;
}

export default function MetricsVisualization({ data }: MetricsVisualizationProps) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="h-[300px] bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">No data available for visualization</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium mb-2">{data.title}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(data)}
        </ResponsiveContainer>
      </div>
      {data.xAxisLabel && data.yAxisLabel && (
        <div className="mt-2 text-sm text-gray-500 flex justify-between">
          <span>X-Axis: {data.xAxisLabel}</span>
          <span>Y-Axis: {data.yAxisLabel}</span>
        </div>
      )}
      {data.timePeriod && (
        <div className="mt-1 text-sm text-gray-500">
          <span>Time Period: {data.timePeriod}</span>
        </div>
      )}
    </div>
  );
}

function renderChart(data: VisualizationData) {
  switch (data.chartType) {
    case 'line':
      return renderLineChart(data);
    case 'bar':
      return renderBarChart(data);
    case 'pie':
      return renderPieChart(data);
    case 'area':
      return renderAreaChart(data);
    default:
      return renderLineChart(data); // Default to line chart
  }
}

function renderLineChart(data: VisualizationData) {
  return (
    <LineChart
      data={data.data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      {data.metrics.map((metric, index) => (
        <Line
          key={metric}
          type="monotone"
          dataKey={metric}
          stroke={COLORS[index % COLORS.length]}
          activeDot={{ r: 8 }}
        />
      ))}
    </LineChart>
  );
}

function renderBarChart(data: VisualizationData) {
  return (
    <BarChart
      data={data.data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      {data.metrics.map((metric, index) => (
        <Bar
          key={metric}
          dataKey={metric}
          fill={COLORS[index % COLORS.length]}
        />
      ))}
    </BarChart>
  );
}

function renderPieChart(data: VisualizationData) {
  // For pie charts, we need to transform the data
  // We'll use the last data point for simplicity
  const lastDataPoint = data.data[data.data.length - 1];
  const pieData = data.metrics.map(metric => ({
    name: metric,
    value: lastDataPoint[metric] || 0
  }));

  return (
    <PieChart>
      <Pie
        data={pieData}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {pieData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}

function renderAreaChart(data: VisualizationData) {
  return (
    <AreaChart
      data={data.data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      {data.metrics.map((metric, index) => (
        <Area
          key={metric}
          type="monotone"
          dataKey={metric}
          stackId="1"
          stroke={COLORS[index % COLORS.length]}
          fill={COLORS[index % COLORS.length]}
        />
      ))}
    </AreaChart>
  );
}
