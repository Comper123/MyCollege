"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }[];
  };
  title?: string;
  height?: number;
}

export default function LineChart({ data, title, height = 250 }: LineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const defaultColors = ["#603EF9", "#10B981", "#F59E0B", "#EF4444"];

    const datasets = data.datasets.map((ds, idx) => ({
      ...ds,
      borderColor: ds.borderColor || defaultColors[idx % defaultColors.length],
      backgroundColor: ds.backgroundColor || "transparent",
      tension: 0.3,
      fill: idx === 0,
    }));

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: data.labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "top",
            labels: { font: { size: 11 }, usePointStyle: true },
          },
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