"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface PieChartProps {
  data: {
    labels: string[];
    values: number[];
    colors?: string[];
  };
  title?: string;
  height?: number;
}

export default function PieChart({ data, title, height = 200 }: PieChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const defaultColors = [
      "#603EF9", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4"
    ];

    chartInstance.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: data.colors || defaultColors,
            borderWidth: 0,
            borderRadius: 8,
            spacing: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 11 },
              padding: 10,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.raw as number;
                const total = data.values.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
        cutout: "60%",
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
      )}
      <canvas ref={chartRef} height={height} />
    </div>
  );
}