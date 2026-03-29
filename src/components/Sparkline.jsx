import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const Sparkline = React.memo(function Sparkline({ data, color }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        style={{
          width: 80,
          height: 32,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.04)'
        }}
      />
    );
  }

  const points = data.map((value, index) => ({ index, value }));
  const first = data[0];
  const last = data[data.length - 1];
  const trendColor = color || (last >= first ? '#00C853' : '#FF5252');

  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={points}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={trendColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

export default Sparkline;

