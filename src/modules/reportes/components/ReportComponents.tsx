import React from 'react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart, PieChart, Pie, Legend, LabelList
} from 'recharts';
import { type TopProduct, type MonthlyRevenue } from '../Service';
import { useTheme } from '../../../shared/contexts/ThemeContext';

interface ChartProps {
  data: MonthlyRevenue[];
  isPrint?: boolean;
}

export const RendimientoChart: React.FC<ChartProps> = ({ data, isPrint }) => {
  const { theme } = useTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={isPrint ? "#e2e8f0" : (theme === 'dark' ? '#27272a' : '#f1f5f9')}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: isPrint ? 10 : 11, fontWeight: 600, fill: '#94a3b8' }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: isPrint ? 10 : 11, fontWeight: 600, fill: '#94a3b8' }}
        />
        {!isPrint && (
          <Tooltip
            cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              backgroundColor: theme === 'dark' ? '#181922' : '#ffffff',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}
            itemStyle={{ fontWeight: 'bold' }}
            labelStyle={{ color: theme === 'dark' ? '#9ca3af' : '#4b5563', fontWeight: 'bold', marginBottom: '8px' }}
            formatter={(value: any, name: any) => [`S/ ${Number(value).toFixed(2)}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
          />
        )}
        <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }} />
        <Bar dataKey="ventas" name="Ventas" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={isPrint ? 20 : 30}>
          {isPrint && <LabelList dataKey="ventas" position="top" fill="#6366f1" fontSize={9} fontWeight="bold" formatter={(val: any) => val > 0 ? Number(val).toFixed(2) : ''} />}
        </Bar>
        <Bar dataKey="compras" name="Compras" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={isPrint ? 20 : 30}>
          {isPrint && <LabelList dataKey="compras" position="top" fill="#f59e0b" fontSize={9} fontWeight="bold" formatter={(val: any) => val > 0 ? Number(val).toFixed(2) : ''} />}
        </Bar>
        <Line type="monotone" dataKey="ganancias" name="Ganancias Neta" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }}>
          {isPrint && <LabelList dataKey="ganancias" position="bottom" fill="#0ea5e9" fontSize={9} fontWeight="bold" formatter={(val: any) => val > 0 ? Number(val).toFixed(2) : ''} />}
        </Line>
      </ComposedChart>
    </ResponsiveContainer>
  );
};

interface CategoryProps {
  data: any[];
  isPrint?: boolean;
}

const COLORS = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f43f5e',
  '#14b8a6', '#84cc16', '#eab308', '#f97316', '#06b6d4', '#a855f7'
];

export const CategoryChart: React.FC<CategoryProps> = ({ data, isPrint }) => {
  const { theme } = useTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={isPrint ? 35 : 60}
          outerRadius={isPrint ? 60 : 80}
          paddingAngle={5}
          dataKey="revenue"
          nameKey="category"
          label={isPrint
            ? (props: any) => {
              const { cx, cy, midAngle, outerRadius, percent } = props;
              const RADIAN = Math.PI / 180;
              const radius = outerRadius + 15;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text x={x} y={y} fill="#3f3f46" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={9} fontWeight="bold">
                  {`${((percent || 0) * 100).toFixed(2)}%`}
                </text>
              );
            }
            : (props: any) => `${props.category || props.name} ${((props.percent || 0) * 100).toFixed(2)}%`
          }
          labelLine={isPrint ? { stroke: '#a1a1aa', strokeWidth: 1 } : true}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: isPrint ? '9px' : '12px', fontWeight: 'bold' }} />
        {!isPrint && (
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              backgroundColor: theme === 'dark' ? '#181922' : '#ffffff',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}
            itemStyle={{ fontWeight: 'bold' }}
            formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

interface RankingProps {
  products: TopProduct[];
  isPrint?: boolean;
}

export const RankingProductos: React.FC<RankingProps> = ({ products, isPrint }) => (
  <div className="space-y-5">
    {products.length > 0 ? products.map((p, i) => {
      const maxSales = Math.max(...products.map(tp => tp.sales)) || 1;
      const pct = Math.round((p.sales / maxSales) * 100);

      return (
        <div key={p.name} className="group">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500 text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700'}`}>
                {i + 1}
              </div>
              <span className={`text-sm font-bold ${isPrint ? 'text-zinc-800' : 'text-zinc-700 dark:text-zinc-200'} transition-colors`}>
                {p.name}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-black ${isPrint ? 'text-zinc-900' : 'text-zinc-800 dark:text-white'} block`}>{p.sales} {p.unit?.toLowerCase() || 'UND.'}</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">S/ {p.revenue.toFixed(2)}</span>
            </div>
          </div>
          <div className={`h-2 ${isPrint ? 'bg-zinc-100' : 'bg-zinc-50 dark:bg-zinc-700/50'} rounded-full overflow-hidden`}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-blue-500' : 'bg-blue-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    }) : (
      <div className="text-center py-10 opacity-50">
        <p className="text-sm font-medium">No hay ventas registradas aún</p>
      </div>
    )}
  </div>
);
