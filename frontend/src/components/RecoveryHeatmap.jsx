import { useMemo } from 'react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RecoveryHeatmap = ({ activityData, darkMode, theme }) => {
  const { rows, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    const startDay = startDate.getDay();
    const offset = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - offset);

    const rows = Array(7).fill(null).map(() => []);
    for (let w = 0; w < 53; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * 7 + d);
        if (cellDate > today) {
          rows[d].push(null);
          continue;
        }
        const dateStr = cellDate.toISOString().split('T')[0];
        const count = activityData[dateStr] || 0;
        rows[d].push({ dateStr, count, isToday: dateStr === today.toISOString().split('T')[0] });
      }
    }

    const maxCount = Math.max(1, ...Object.values(activityData));
    return { rows, maxCount };
  }, [activityData]);

  const getColor = (count) => {
    if (count === 0) return darkMode ? '#27272a' : '#e4e4e7';
    const intensity = Math.min(4, Math.ceil((count / maxCount) * 4));
    const colors = darkMode
      ? ['#166534', '#15803d', '#22c55e', '#4ade80', '#86efac']
      : ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e'];
    return colors[intensity];
  };

  return (
    <div className={`rounded-lg p-4 ${theme.card} border ${theme.border}`}>
      <h3 className={`font-medium ${theme.text} mb-3`}>Recovery Activity</h3>
      <p className={`text-xs ${theme.textSecondary} mb-4`}>
        Track how consistently you're engaging with your recovery. Each square is a day — darker = more activity (craving logs, sleep checks, chat, nutrition).
      </p>
      <div className="flex gap-1 overflow-x-auto pb-2">
        <div className="flex flex-col gap-[3px] justify-around pr-2 flex-shrink-0">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className={`text-[10px] ${theme.textSecondary} h-[14px] leading-none`}>{label}</span>
          ))}
        </div>
        <div className="flex gap-[3px] flex-1 min-w-0">
          {rows[0]?.map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[3px]">
              {rows.map((row, rowIndex) => {
                const cell = row[colIndex];
                if (!cell) return <div key={rowIndex} className="w-[14px] h-[14px]" />;
                return (
                  <div
                    key={rowIndex}
                    className="w-[14px] h-[14px] rounded-[3px] flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: getColor(cell.count),
                      outline: cell.isToday ? `2px solid ${darkMode ? '#22c55e' : '#16a34a'}` : 'none',
                      outlineOffset: '1px'
                    }}
                    title={`${cell.dateStr}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs ${theme.textSecondary}`}>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: level === 0
                  ? (darkMode ? '#27272a' : '#e4e4e7')
                  : darkMode
                    ? ['#166534', '#15803d', '#22c55e', '#4ade80'][level - 1]
                    : ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80'][level - 1]
              }}
            />
          ))}
        </div>
        <span className={`text-xs ${theme.textSecondary}`}>More</span>
      </div>
    </div>
  );
};

export default RecoveryHeatmap;
