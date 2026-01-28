'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ScoreData {
  date: string;
  score: number | null;
}

interface ScoreChartProps {
  data: ScoreData[];
}

export function ScoreChart({ data }: ScoreChartProps) {
  const chartData = data
    .filter((d) => d.score !== null)
    .slice(-30)
    .map((d) => ({
      date: d.date.slice(5),
      score: d.score,
      fullDate: d.date,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-slate-200 rounded-lg bg-slate-50">
        <div className="text-center">
          <span className="material-symbols-outlined text-slate-300 text-4xl mb-3 block">show_chart</span>
          <p className="text-sm text-slate-600">データがありません</p>
          <p className="text-xs text-slate-500 mt-1 text-pretty">ログを記録すると推移が表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-medium text-slate-600 uppercase flex items-center gap-2">
          <span className="w-3 h-px bg-slate-300" /> スコア推移
        </h3>
        <span className="text-xs text-slate-500">過去30日間</span>
      </div>
      <div className="h-64 border border-slate-200 rounded-lg p-4 bg-white">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 5, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#64748b', fontSize: '11px', marginBottom: '2px' }}
              itemStyle={{ color: '#1e293b', fontSize: '13px', fontWeight: 500 }}
              formatter={(value) => [`${value ?? 0}/10`, '満足度']}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#475569"
              strokeWidth={1.5}
              fill="url(#scoreGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#1e293b', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
