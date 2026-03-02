import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { PollOption } from '@/types/poll';

interface PollChartProps {
  options: PollOption[];
}

export function PollChart({ options }: PollChartProps) {
  const totalVotes = options.reduce((sum, option) => sum + option.vote_count, 0);

  // Truncate labels for display, keep full text for tooltip
  const truncateLabel = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 1) + '…';
  };

  const chartData = options.map((option, index) => ({
    name: truncateLabel(option.text, 15),
    fullName: option.text,
    votes: option.vote_count,
    percentage: totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0,
    index
  }));

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-1))'
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-medium break-words">{data.fullName}</p>
          <p className="text-primary">{data.votes} 票 ({data.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  if (totalVotes === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        <p>尚無投票數據</p>
      </div>
    );
  }

  // Dynamic height based on number of options (min 150px, 40px per option)
  const chartHeight = Math.max(150, options.length * 40);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}