import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#F97316', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#EF4444', '#9CA3AF'];

export const StatsChart: React.FC<Props> = ({ transactions }) => {
  const data = React.useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      const current = map.get(t.category) || 0;
      map.set(t.category, current + t.amount);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        暂无数据
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};