'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navigation = [
  { name: '今日のログ', href: '/dashboard', icon: 'edit_note' },
  { name: '積み重ね', href: '/calendar', icon: 'local_fire_department' },
  { name: '分析レポート', href: '/analytics', icon: 'bar_chart' },
  { name: '設定', href: '/settings', icon: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 lg:w-64 flex-shrink-0 bg-[#fafafa] border-r border-slate-100 flex flex-col transition-all duration-300">
      <div className="p-8 flex flex-col h-full">
        <div className="mb-12 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#2d3436] !text-4xl">radio_button_checked</span>
          <span className="md:text-xl text-base font-medium tracking-[0.2em] hidden lg:block">LIFELOG</span>
        </div>

        <nav className="flex flex-col gap-8">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 transition-colors ${
                  isActive
                    ? 'text-[#2d3436] font-medium'
                    : 'text-slate-400 hover:text-[#2d3436]'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-xs tracking-tight hidden lg:block">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-200/50">
          <div className="hidden lg:block">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Calendar</p>
            <MiniCalendar />
          </div>
        </div>
      </div>
    </aside>
  );
}

function MiniCalendar() {
  const router = useRouter();
  const today = new Date();
  const currentDay = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { day: number; isCurrentMonth: boolean; isToday: boolean; isFuture: boolean; date: string }[] = [];

  // Previous month days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({ day, isCurrentMonth: false, isToday: false, isFuture: false, date: dateStr });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const isFuture = i > currentDay;
    days.push({ day: i, isCurrentMonth: true, isToday: i === currentDay, isFuture, date: dateStr });
  }

  // Next month days to fill the grid (up to 35 or 42 days total for 5-6 rows)
  const totalCells = days.length <= 35 ? 35 : 42;
  const remainingDays = totalCells - days.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let i = 1; i <= remainingDays; i++) {
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ day: i, isCurrentMonth: false, isToday: false, isFuture: true, date: dateStr });
  }

  const handleDayClick = (d: typeof days[0]) => {
    if (d.isFuture) return;
    router.push(`/dashboard?date=${d.date}`);
  };

  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-[9px] text-center text-slate-300 mb-2">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[9px] text-center">
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => handleDayClick(d)}
            disabled={d.isFuture}
            className={`py-0.5 rounded-full transition-colors ${
              d.isToday
                ? 'bg-[#2d3436] text-white font-medium'
                : d.isFuture
                  ? 'text-slate-200 cursor-not-allowed'
                  : d.isCurrentMonth
                    ? 'text-slate-500 hover:bg-slate-200'
                    : 'text-slate-300 hover:bg-slate-100'
            }`}
          >
            {d.day}
          </button>
        ))}
      </div>
    </>
  );
}
