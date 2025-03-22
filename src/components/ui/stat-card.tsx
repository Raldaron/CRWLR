// components/ui/stat-card.tsx
import React from 'react';
import { Tooltip } from '@chakra-ui/react';

interface StatCardProps {
  label: string;
  current: number;
  max: number;
  color: string;
  formula: string;
  breakdown: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  current, 
  max, 
  color, 
  formula, 
  breakdown 
}) => (
  <Tooltip
    label={
      <div className="p-2">
        <div className="font-bold">Formula: {formula}</div>
        <div>{breakdown}</div>
      </div>
    }
    placement="bottom"
  >
    <div className="w-24 h-24">
      <div
        className="h-full w-full rounded-lg shadow-sm flex flex-col items-center justify-center bg-white transition-shadow hover:shadow-md"
        style={{ borderTop: `4px solid ${color}` }}
      >
        <span className="text-sm font-semibold text-gray-600">{label}</span>
        <span className="text-lg font-bold">
          <span style={{ color }}>{current}</span>
          <span className="text-gray-400">/{max}</span>
        </span>
      </div>
    </div>
  </Tooltip>
);

export default StatCard;