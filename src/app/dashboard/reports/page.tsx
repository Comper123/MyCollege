"use client";

import { useState } from "react";
import { Block } from "@/components/blocks/Block";
import { reportViews, ReportView } from "@/types/report-views";
import ReportViewer from "@/components/pages/dashboard/reports/ReportViewer";

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportView | null>(null);

  return (
    <main className="w-full h-full">
      <Block>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Аналитические отчеты
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Предварительно агрегированные данные для анализа
          </p>
        </div>

        {!selectedReport ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reportViews.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onSelect={() => setSelectedReport(report)}
              />
            ))}
          </div>
        ) : (
          <ReportViewer
            report={selectedReport}
            onBack={() => setSelectedReport(null)}
          />
        )}
      </Block>
    </main>
  );
}

function ReportCard({ report, onSelect }: { report: ReportView; onSelect: () => void }) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600",
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    purple: "from-purple-500 to-purple-600",
    cyan: "from-cyan-500 to-cyan-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    pink: "from-pink-500 to-pink-600",
    teal: "from-teal-500 to-teal-600",
    red: "from-red-500 to-red-600",
    violet: "from-violet-500 to-violet-600",
  };

  const gradient = colorMap[report.color] || colorMap.indigo;

  return (
    <div
      onClick={onSelect}
      className="group bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="text-3xl">{report.icon}</div>
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {report.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {report.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
            {report.columns.length} колонок
          </span>
        </div>
      </div>
    </div>
  );
}