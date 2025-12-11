import React from 'react';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const VitalChart = ({ data, color, unit }) => {
  console.log("VitalChart data:", data);
  const isBpType = data.length > 0 && data[0].type === 'bp';
  
  // Transform data for charting
  if(isBpType) {
    //create 2 data charts for systolic and diastolic
    var chartData = data.flatMap(log => {
      const [systolic, diastolic] = log.value.split('/').map(v => parseInt(v, 10));
      return [
        {
          date: new Date(log.recordedAt).toLocaleDateString(),
          systolic: systolic,
          unit: 'mmHg (Diastolic)',
          diastolic: diastolic,
          unit: 'mmHg (Systolic)'
      
        },
      ];
    });
  } else {
    var chartData = data.map(log => ({
      date: new Date(log.recordedAt).toLocaleDateString(),
      value: parseFloat(log.value),
      unit: unit
    }));
  }
  console.log("Transformed chartData:", chartData);

  if (chartData.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-400">No data to chart</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        {isBpType && (
          <div>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={['auto', 'auto']}
            />

            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ color: '#6B7280', marginBottom: '0.25rem' }}
            />

            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />

          </LineChart>
        
</div>
        )}
        {!isBpType && (
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            domain={['auto', 'auto']}
          />

          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ color: '#6B7280', marginBottom: '0.25rem' }}
          />

          <Line
            type="monotone" 
            dataKey="value"
            stroke={color || "#2563eb"}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
            activeDot={{ r: 6, strokeWidth: 0 }} 
          />

        </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default VitalChart;
