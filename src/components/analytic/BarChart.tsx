"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
    }[];
  };
  title?: string;
  height?: number;
}

export default function BarChart({ data, title, height = 250 }: BarChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const defaultColors = ["#603EF9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    const datasets = data.datasets.map((ds, idx) => ({
      ...ds,
      backgroundColor: ds.backgroundColor || defaultColors[idx % defaultColors.length],
      borderRadius: 8,
    }));

    chartInstance.current = new Chart(chartRef.current, {
      type: "bar",
      data: { labels: data.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: "top", labels: { font: { size: 11 }, usePointStyle: true } },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "#e5e7eb" }, ticks: { stepSize: 1 } },
          x: { grid: { display: false } },
        },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [data]);

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>}
      <canvas ref={chartRef} height={height} />
    </div>
  );
}