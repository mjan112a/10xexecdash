'use client';

import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DEFAULT_ADJUSTMENT_RANGES } from '../metrics-relationships/base-metrics';

interface MetricSliderProps {
  metric: string;
  originalValue: number;
  value: number | undefined;
  onChange: (value: number | undefined, type: 'percentage' | 'absolute') => void;
  adjustmentType: 'percentage' | 'absolute';
  onAdjustmentTypeChange: (type: 'percentage' | 'absolute') => void;
}

export default function MetricSlider({
  metric,
  originalValue,
  value,
  onChange,
  adjustmentType,
  onAdjustmentTypeChange
}: MetricSliderProps) {
  // Get the default adjustment range for this metric
  const [min, max] = DEFAULT_ADJUSTMENT_RANGES[metric] || [-50, 50];
  
  // Calculate the current percentage change
  const percentageChange = originalValue !== 0
    ? ((value || originalValue) - originalValue) / Math.abs(originalValue) * 100
    : 0;
  
  // State for the slider value
  const [sliderValue, setSliderValue] = useState<number>(percentageChange);
  
  // Update the slider value when the percentage change changes
  useEffect(() => {
    if (adjustmentType === 'percentage') {
      setSliderValue(percentageChange);
    } else {
      setSliderValue(value || originalValue);
    }
  }, [percentageChange, value, originalValue, adjustmentType]);
  
  // Handle slider change
  const handleSliderChange = (newValue: number[]) => {
    const value = newValue[0];
    setSliderValue(value);
    
    if (adjustmentType === 'percentage') {
      // Calculate the new absolute value based on the percentage
      const newAbsoluteValue = originalValue * (1 + value / 100);
      onChange(newAbsoluteValue, 'percentage');
    } else {
      // Use the absolute value directly
      onChange(value, 'absolute');
    }
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();
    
    if (inputValue === '') {
      // Reset to original value if input is empty
      onChange(undefined, adjustmentType);
      return;
    }
    
    const numericValue = parseFloat(inputValue);
    
    if (!isNaN(numericValue)) {
      if (adjustmentType === 'percentage') {
        // Calculate the new absolute value based on the percentage
        const newAbsoluteValue = originalValue * (1 + numericValue / 100);
        onChange(newAbsoluteValue, 'percentage');
      } else {
        // Use the absolute value directly
        onChange(numericValue, 'absolute');
      }
    }
  };
  
  // Handle adjustment type change
  const handleAdjustmentTypeChange = (checked: boolean) => {
    onAdjustmentTypeChange(checked ? 'absolute' : 'percentage');
  };
  
  // Format the display value
  const formatDisplayValue = () => {
    if (adjustmentType === 'percentage') {
      return `${sliderValue.toFixed(1)}%`;
    } else {
      const valueToDisplay = value !== undefined ? value : originalValue;
      
      // Format based on metric type
      if (metric.includes('Price') || metric.includes('Revenue') || metric.includes('GM') || metric.includes('OM')) {
        return valueToDisplay.toFixed(2);
      } else if (metric.includes('%')) {
        return valueToDisplay.toFixed(1);
      } else if (metric.includes('Unit')) {
        return valueToDisplay.toFixed(2);
      } else {
        return valueToDisplay.toFixed(0);
      }
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{metric}</Label>
        <div className="flex items-center space-x-2">
          <Label className="text-xs text-gray-500">
            {adjustmentType === 'percentage' ? 'Percentage' : 'Absolute'}
          </Label>
          <Switch
            checked={adjustmentType === 'absolute'}
            onCheckedChange={handleAdjustmentTypeChange}
            aria-label="Toggle adjustment type"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Slider
          value={[sliderValue]}
          min={adjustmentType === 'percentage' ? min : originalValue * 0.5}
          max={adjustmentType === 'percentage' ? max : originalValue * 1.5}
          step={adjustmentType === 'percentage' ? 1 : (originalValue > 100 ? 10 : 1)}
          onValueChange={handleSliderChange}
          className="flex-1"
        />
        <Input
          type="text"
          value={formatDisplayValue()}
          onChange={handleInputChange}
          className="w-20 text-right"
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>Original: {originalValue.toLocaleString()}</span>
        <span>
          New: {(value || originalValue).toLocaleString()}
          {adjustmentType === 'percentage' && percentageChange !== 0 && (
            <span className={percentageChange > 0 ? 'text-green-600' : 'text-red-600'}>
              {' '}({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
