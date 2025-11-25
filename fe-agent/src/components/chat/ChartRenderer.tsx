import React from 'react';
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell,
 BarChart,
 Bar,
 Legend
} from 'recharts';

interface ChartData {
 type: 'line' | 'pie' | 'bar';
 title?: string;
 data: any[];
 dataKey?: string; // For simple charts
 categoryKey?: string; // For X-axis or categories
 series?: { name: string; color: string; dataKey: string }[]; // For multi-series charts
}

interface ChartRendererProps {
 config: ChartData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config }) => {
 const renderChart = () => {
  switch (config.type) {
   case 'line':
    return (
     <ResponsiveContainer width="100%" height={300}>
      <LineChart data={config.data}>
       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
       <XAxis
        dataKey={config.categoryKey || 'name'}
        tick={{ fontSize: 12, fill: '#666' }}
        axisLine={false}
        tickLine={false}
       />
       <YAxis
        tick={{ fontSize: 12, fill: '#666' }}
        axisLine={false}
        tickLine={false}
       />
       <Tooltip
        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
       />
       <Legend />
       {config.series ? (
        config.series.map((s, i) => (
         <Line
          key={s.dataKey}
          type="monotone"
          dataKey={s.dataKey}
          stroke={s.color || COLORS[i % COLORS.length]}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
         />
        ))
       ) : (
        <Line
         type="monotone"
         dataKey={config.dataKey || 'value'}
         stroke="#3b82f6"
         strokeWidth={2}
         dot={{ r: 4 }}
         activeDot={{ r: 6 }}
        />
       )}
      </LineChart>
     </ResponsiveContainer>
    );

   case 'bar':
    return (
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={config.data}>
       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
       <XAxis
        dataKey={config.categoryKey || 'name'}
        tick={{ fontSize: 12, fill: '#666' }}
        axisLine={false}
        tickLine={false}
       />
       <YAxis
        tick={{ fontSize: 12, fill: '#666' }}
        axisLine={false}
        tickLine={false}
       />
       <Tooltip
        cursor={{ fill: '#f8fafc' }}
        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
       />
       <Legend />
       {config.series ? (
        config.series.map((s, i) => (
         <Bar
          key={s.dataKey}
          dataKey={s.dataKey}
          fill={s.color || COLORS[i % COLORS.length]}
          radius={[4, 4, 0, 0]}
         />
        ))
       ) : (
        <Bar
         dataKey={config.dataKey || 'value'}
         fill="#3b82f6"
         radius={[4, 4, 0, 0]}
        />
       )}
      </BarChart>
     </ResponsiveContainer>
    );

   case 'pie':
    return (
     <ResponsiveContainer width="100%" height={300}>
      <PieChart>
       <Pie
        data={config.data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={5}
        dataKey={config.dataKey || 'value'}
       >
        {config.data.map((entry, index) => (
         <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
        ))}
       </Pie>
       <Tooltip
        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
       />
       <Legend verticalAlign="middle" align="right" layout="vertical" />
      </PieChart>
     </ResponsiveContainer>
    );

   default:
    return null;
  }
 };

 return (
  <div className="w-full bg-white rounded-xl border border-gray-100 p-4 my-4 shadow-sm">
   {config.title && (
    <h3 className="text-sm font-semibold text-gray-700 mb-4">{config.title}</h3>
   )}
   {renderChart()}
  </div>
 );
};
