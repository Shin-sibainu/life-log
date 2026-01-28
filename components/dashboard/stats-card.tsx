interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export function StatsCard({ title, value, description, trend, icon }: StatsCardProps) {
  return (
    <div className="group relative">
      <div className="relative p-5 hover:bg-slate-50 transition-colors">
        <div className="flex items-start justify-between">
          <p className="text-xs text-slate-500 uppercase">{title}</p>
          {icon && (
            <span className="material-symbols-outlined text-slate-300 text-lg">{icon}</span>
          )}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-3xl font-light text-slate-800 tabular-nums">{value}</span>
          {trend && (
            <span
              className={`text-xs font-medium pb-1 ${
                trend === 'up'
                  ? 'text-emerald-600'
                  : trend === 'down'
                    ? 'text-rose-500'
                    : 'text-slate-500'
              }`}
            >
              {trend === 'up' ? '↑ up' : trend === 'down' ? '↓ down' : '→'}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}
