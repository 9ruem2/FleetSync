import React from 'react';
import { ShiftStatus } from '../../models/schedule.model';
import { ContractType } from '../../models/driver.model';

interface Props {
  status: ShiftStatus | ContractType;
  backupAssigned?: boolean;
  backupDriverName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({
  status,
  backupAssigned,
  backupDriverName,
  size = 'md'
}) => {
  let badgeStyle = '';
  let dotStyle = '';

  switch (status) {
    case '고정':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      dotStyle = 'bg-blue-500';
      break;
    case '용차':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotStyle = 'bg-emerald-500';
      break;
    case '백업':
      badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
      dotStyle = 'bg-purple-500';
      break;
    case '휴무':
      if (backupAssigned) {
        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
        dotStyle = 'bg-amber-500';
      } else {
        badgeStyle = 'bg-red-50 text-red-700 border-red-200';
        dotStyle = 'bg-red-500';
      }
      break;
    default:
      badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';
      dotStyle = 'bg-gray-400';
  }

  const sizePadding = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${badgeStyle} ${sizePadding} transition-all duration-150`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      <span>{status}</span>
      {status === '휴무' && backupAssigned && backupDriverName && (
        <span className="text-[11px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold ml-1">
          대차: {backupDriverName}
        </span>
      )}
    </span>
  );
};
