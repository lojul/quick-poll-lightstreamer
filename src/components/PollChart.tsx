import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { PollOption } from '@/types/poll';

interface PollChartProps {
  options: PollOption[];
}

export function PollChart({ options }: PollChartProps) {
  const totalVotes = options.reduce((sum, option) => sum + option.vote_count, 0);
  
  const chartData = options.map((option, index) => ({
    name: option.text.length > 20 ? `${option.text.substring(0, 20)}...` : option.text,
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
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fullName}</p>
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

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}