import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { type TopProduct, type MonthlyRevenue } from '../../services/reporteService';

interface ChartProps {
  data: MonthlyRevenue[];
  isPrint?: boolean;
}

export const VentasBarChart: React.FC<ChartProps> = ({ data, isPrint }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid 
        strokeDasharray="3 3" 
        vertical={false} 
        stroke={isPrint ? "#e2e8f0" : "#f1f5f9"} 
      />
      <XAxis 
        dataKey="month" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: isPrint ? 10 : 11, fontWeight: 600, fill: '#94a3b8' }} 
      />
      <YAxis 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: isPrint ? 10 : 11, fontWeight: 600, fill: '#94a3b8' }} 
      />
      {!isPrint && (
        <Tooltip 
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Ingresos']}
        />
      )}
      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
        <LabelList 
          dataKey="amount" 
          position="center" 
          style={{ 
            fill: '#ffffff', 
            fontSize: isPrint ? '12px' : '14px', 
            fontWeight: 'bold' 
          }} 
          formatter={(v: any) => Number(v) > 0 ? `S/ ${Number(v).toFixed(0)}` : ''} 
        />
        {data.map((_, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={index === data.length - 1 ? '#6366f1' : (isPrint ? '#cbd5e1' : '#e2e8f0')} 
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

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
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                {i + 1}
              </div>
              <span className={`text-sm font-bold ${isPrint ? 'text-gray-800' : 'text-gray-700 dark:text-gray-200'} transition-colors`}>
                {p.name}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-black ${isPrint ? 'text-gray-900' : 'text-gray-800 dark:text-white'} block`}>{p.sales} uds.</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">S/ {p.revenue.toFixed(2)}</span>
            </div>
          </div>
          <div className={`h-2 ${isPrint ? 'bg-gray-100' : 'bg-gray-50 dark:bg-gray-700/50'} rounded-full overflow-hidden`}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-indigo-500' : 'bg-indigo-300'}`}
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
