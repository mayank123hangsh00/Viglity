import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function LineChartWidget({ data, feature }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '0 20px' }}>
        {feature ? 'No time-series data for this feature in the selected range' : 'Click a bar in the chart to see its daily trend'}
      </div>
    );
  }

  const labels = data.map((d) => {
    const [y, m, day] = d.date.split('-');
    return `${day}/${m}/${y.slice(2)}`;
  });

  const chartData = {
    labels,
    datasets: [{
      label: feature || 'Clicks',
      data: data.map((d) => d.count),
      fill: true,
      borderColor: '#7c3aed',
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: canvas, chartArea } = chart;
        if (!chartArea) return 'transparent';
        const gradient = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(124,58,237,0.35)');
        gradient.addColorStop(1, 'rgba(124,58,237,0.01)');
        return gradient;
      },
      borderWidth: 2.5,
      pointBackgroundColor: '#7c3aed',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      pointRadius: data.length > 40 ? 2 : 4,
      pointHoverRadius: 6,
      tension: 0.4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,15,42,0.95)',
        borderColor: 'rgba(124,58,237,0.4)',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          label: (ctx) => `  ${ctx.raw} clicks`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 10 },
          maxTicksLimit: 12,
          maxRotation: 45,
        },
        border: { color: 'rgba(255,255,255,0.08)' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, stepSize: 1 },
        border: { color: 'rgba(255,255,255,0.08)' },
      },
    },
  };

  return <Line data={chartData} options={options} id="line-chart" />;
}
