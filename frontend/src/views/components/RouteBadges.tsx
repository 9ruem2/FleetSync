import React from 'react';

interface Props {
  routes: string[];
  label?: string;
  size?: 'sm' | 'md';
}

export const RouteBadges: React.FC<Props> = ({ routes, label, size = 'sm' }) => {
  if (routes.length === 0) {
    return <span className="text-slate-400 text-[11px]">-</span>;
  }

  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-1 text-xs';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      )}
      <div className="flex flex-wrap gap-1">
        {routes.map(route => (
          <span
            key={route}
            className={`inline-flex items-center rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold ${sizeClass}`}
          >
            {route}
          </span>
        ))}
      </div>
    </div>
  );
};
