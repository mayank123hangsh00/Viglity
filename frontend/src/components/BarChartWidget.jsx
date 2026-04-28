import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FEATURE_COLORS = {
  date_filter:      'rgba(124, 58, 237, 0.85)',
  age_filter:       'rgba(6, 182, 212, 0.85)',
  gender_filter:    'rgba(16, 185, 129, 0.85)',
  bar_chart_click:  'rgba(245, 158, 11, 0.85)',
  line_chart_view:  'rgba(244, 63, 94, 0.85)',
};

const FEATURE_COLORS_SELECTED = {
  date_filter:      'rgba(124, 58, 237, 1)',
  age_filter:       'rgba(6, 182, 212, 1)',
  gender_filter:    'rgba(16, 185, 129, 1)',
  bar_chart_click:  'rgba(245, 158, 11, 1)',
  line_chart_view:  'rgba(244, 63, 94, 1)',
};

function getColor(name, selected, isSelected) {
  const palette = isSelected ? FEATURE_COLORS_SELECTED : FEATURE_COLORS;
  const base = palette[name] || (isSelected ? 'rgba(124,58,237,1)' : 'rgba(124,58,237,0.6)');
  // Dim unselected bars when something is selected
  if (selected && name !== selected) return base.replace(/[\d.]+\)$/, '0.25)');
  return base;
}

export default function BarChartWidget({ data, selectedFeature, onBarClick }) {
  const chartRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No data for the selected filters
      </div>
    );
  }

  const labels = data.map((d) => d.featureName);
  const counts = data.map((d) => d.count);
  const bgColors = data.map((d) => getColor(d.featureName, selectedFeature, d.featureName === selectedFeature));
  const borderColors = data.map((d) =>
    d.featureName === selectedFeature
      ? (FEATURE_COLORS_SELECTED[d.featureName] || 'rgba(124,58,237,1)')
      : 'transparent'
  );

  const chartData = {
    labels,
    datasets: [{
      label: 'Total Clicks',
      data: counts,
      backgroundColor: bgColors,
      borderColor: borderColors,
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        onBarClick(data[idx].featureName);
      }
    },
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
          label: (ctx) => `  ${ctx.raw.toLocaleString()} clicks`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
        border: { color: 'rgba(255,255,255,0.08)' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#f1f5f9', font: { family: 'Inter', size: 12, weight: '500' } },
        border: { color: 'rgba(255,255,255,0.08)' },
      },
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
  };

  return <Bar ref={chartRef} data={chartData} options={options} id="bar-chart" />;
}
