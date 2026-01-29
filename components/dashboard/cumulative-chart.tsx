'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface EntryData {
  date: string;
  completedTodoCount: number;
}

interface CumulativeChartProps {
  entries: EntryData[];
}

export function CumulativeChart({ entries }: CumulativeChartProps) {
  const chartData = useMemo(() => {
    // Sort entries by date
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate cumulative count
    let cumulative = 0;
    return sorted.map((entry) => {
      cumulative += entry.completedTodoCount;
      const date = new Date(entry.date);
      return {
        date: entry.date,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        completed: entry.completedTodoCount,
        cumulative,
      };
    });
  }, [entries]);

  const totalCompleted = chartData.length > 0
    ? chartData[chartData.length - 1].cumulative
    : 0;

  if (chartData.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white p-6">
        <h3 className="text-xs font-medium text-slate-600 uppercase flex items-center gap-2 mb-6">
          <span className="w-3 h-px bg-slate-300" /> 累積達成数
        </h3>
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          データがありません
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-medium text-slate-600 uppercase flex items-center gap-2">
          <span className="w-3 h-px bg-slate-300" /> 累積達成数
        </h3>
        <div className="text-right">
          <p className="text-2xl font-light text-slate-900 tabular-nums">{totalCompleted}</p>
          <p className="text-[10px] text-slate-400 uppercase">Total Completed</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} 個`, '累積達成']}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
