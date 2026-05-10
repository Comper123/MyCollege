"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer, RefreshCw, FileJson, FileSpreadsheet } from "lucide-react";
import Button from "@/components/ui/Button";
import { Table, Column } from "@/components/ui/Table";
import { ReportView } from "@/types/report-views";
import { format, formatDate } from "date-fns";
import { ru } from "date-fns/locale";
import BarChart from "@/components/analytic/BarChart";
import PieChart from "@/components/analytic/PieChart";

interface ReportViewerProps {
  report: ReportView;
  onBack: () => void;
}

export default function ReportViewer({ report, onBack }: ReportViewerProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchData();
  }, [report.id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/reports/views?view=${report.id}`);
      if (resp.ok) {
        const result = await resp.json();
        setData(result);
      } else {
        setError("Ошибка загрузки данных");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any, format: string) => {
    if (value === null || value === undefined) return "—";
    
    switch (format) {
      case "number":
        return typeof value === "number" ? value.toLocaleString("ru-RU") : value;
      case "currency":
        const num = typeof value === "number" ? value / 100 : Number(value) / 100;
        return `${num.toLocaleString("ru-RU")} ₽`;
      case "date":
        return formatDate(new Date(value), "dd.MM.yyyy", { locale: ru });
      case "percentage":
        return `${value}%`;
      default:
        return String(value);
    }
  };

  const getColumns = (): Column<any>[] => {
    return report.columns.map((col) => ({
      title: col.title,
      key: col.key,
      render: (value) => (
        <span className={col.format === "currency" ? "font-mono" : ""}>
          {formatValue(value, col.format || "text")}
        </span>
      ),
    }));
  };

  const renderChart = () => {
    if (report.id === "equipment_status_stats" && data.length > 0) {
      return (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800/30 rounded-lg border">
          <h3 className="text-sm font-semibold mb-3">Визуализация</h3>
          <PieChart
            data={{
              labels: data.map((d) => d.status),
              values: data.map((d) => Number(d.count)),
            }}
            height={250}
          />
        </div>
      );
    }

    if (report.id === "requests_daily_trend" && data.length > 0) {
      return (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800/30 rounded-lg border">
          <h3 className="text-sm font-semibold mb-3">Визуализация</h3>
          <BarChart
            data={{
              labels: data.map((d) => format(new Date(d.date), "dd.MM", { locale: ru })),
              datasets: [
                { label: "Создано", data: data.map((d) => Number(d.created_count)) },
                { label: "Выполнено", data: data.map((d) => Number(d.completed_count)) },
              ],
            }}
            height={250}
          />
        </div>
      );
    }

    if (report.id === "equipment_by_room" && data.length > 0) {
      const top5 = [...data].sort((a, b) => b.total_equipment - a.total_equipment).slice(0, 5);
      return (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800/30 rounded-lg border">
          <h3 className="text-sm font-semibold mb-3">Топ-5 кабинетов по оборудованию</h3>
          <BarChart
            data={{
              labels: top5.map((d) => `Каб. ${d.room_number}`),
              datasets: [{ label: "Количество", data: top5.map((d) => Number(d.total_equipment)) }],
            }}
            height={250}
          />
        </div>
      );
    }

    return null;
  };

  const handleExport = (format: "json" | "csv") => {
    let content: string;
    let filename: string;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = `${report.id}_${new Date().toISOString()}.json`;
    } else {
      const headers = report.columns.map(c => c.title).join(",");
      const rows = data.map(row => 
        report.columns.map(col => {
          const value = row[col.key];
          if (col.format === "currency" && typeof value === "number") {
            return `${(value / 100).toLocaleString("ru-RU")} ₽`;
          }
          return `"${String(value || "").replace(/"/g, '""')}"`;
        }).join(",")
      );
      content = [headers, ...rows].join("\n");
      filename = `${report.id}_${new Date().toISOString()}.csv`;
    }

    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-indigo-200 rounded-full animate-spin" />
          <div className="absolute top-0 left-0 w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="ml-3 text-gray-500">Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 mb-2">⚠️ {error}</div>
        <Button variant="secondary" onClick={fetchData}>
          <RefreshCw size={14} />
          Повторить
        </Button>
      </div>
    );
  }

  const summary = {
    totalRows: data.length,
    totalValue: report.id === "equipment_value" 
      ? data.reduce((sum, row) => sum + Number(row.total_value_cents), 0) / 100
      : null,
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={18} />
          <span>Назад к отчетам</span>
        </button>
        
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <RefreshCw size={14} />
            Обновить
          </Button>
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowExportMenu(!showExportMenu)}>
              <Download size={14} />
              Экспорт
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => handleExport("json")}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FileJson size={14} />
                  JSON
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FileSpreadsheet size={14} />
                  CSV
                </button>
              </div>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer size={14} />
            Печать
          </Button>
        </div>
      </div>

      {/* Информация об отчете */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{report.icon}</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{report.name}</h2>
        </div>
        <p className="text-sm text-gray-500">{report.description}</p>
      </div>

      {/* Сводка */}
      {summary.totalRows > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
            <p className="text-xs text-gray-500">Всего записей</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalRows}</p>
          </div>
          {summary.totalValue !== null && (
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500">Общая стоимость</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.totalValue.toLocaleString("ru-RU")} ₽
              </p>
            </div>
          )}
        </div>
      )}

      {/* Визуализация */}
      {renderChart()}

      {/* Таблица данных */}
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <Table columns={getColumns()} data={data} keyExtractor={(row, idx) => String(idx)} />
          <div className="mt-2 text-xs text-gray-400 text-right">
            Обновлено: {new Date().toLocaleString("ru-RU")}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          Нет данных для отображения
        </div>
      )}
    </div>
  );
}