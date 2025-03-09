// Define the structure for metric values
export interface MetricValue {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
}

// Define the hierarchical data structure
export interface HierarchicalData {
  [group: string]: {
    [category: string]: {
      [type: string]: {
        [name: string]: {
          uid: string;
          unit: string;
          values: string[];
        };
      };
    };
  };
}

// Define the message structure for chat
export interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  citations?: string[];
  visualization?: {
    type: 'line' | 'bar' | 'pie' | 'area';
    data: any;
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
  };
}
