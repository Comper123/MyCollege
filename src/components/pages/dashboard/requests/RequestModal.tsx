"use client";

import { useEffect, useState, useRef } from "react";
import Modal, { ModalField } from "@/components/ui/Modal";
import { inputCls } from "@/components/ui/forms/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Search, Camera, X, Loader2, AlertCircle } from "lucide-react";
import { FullEquipment } from "@/types/equipment";
import { RequestWithRelations } from "@/types/request";


interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: RequestWithRelations;
  equipment?: FullEquipment;
  onSuccess: () => void;
}

const typeOptions = [
  { value: "repair", label: "Ремонт", icon: "🔧", description: "Неисправность оборудования" },
  { value: "maintenance", label: "Обслуживание", icon: "⚙️", description: "Плановое техобслуживание" },
  { value: "replacement", label: "Замена", icon: "🔄", description: "Замена на новое" },
  { value: "transfer", label: "Перемещение", icon: "📦", description: "Перемещение в другой кабинет" },
  { value: "write_off", label: "Списание", icon: "🗑️", description: "Списание оборудования" },
  { value: "other", label: "Другое", icon: "📝", description: "Прочие вопросы" },
];

const priorityOptions = [
  { value: "low", label: "Низкий", color: "text-gray-500", bg: "bg-gray-100" },
  { value: "medium", label: "Средний", color: "text-blue-500", bg: "bg-blue-100" },
  { value: "high", label: "Высокий", color: "text-orange-500", bg: "bg-orange-100" },
  { value: "urgent", label: "Срочный", color: "text-red-500", bg: "bg-red-100" },
];

export default function RequestModal({ isOpen, onClose, request, equipment, onSuccess }: RequestModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [equipmentList, setEquipmentList] = useState<FullEquipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<FullEquipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const containerId = "qr-scanner-container";

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "repair",
    priority: "medium",
    equipmentId: "",
  });

  const [selectedEquipment, setSelectedEquipment] = useState<FullEquipment | null>(equipment || null);

  // Загрузка оборудования в зависимости от роли
  useEffect(() => {
    const loadEquipment = async () => {
      setLoadingEquipment(true);
      try {
        // Для преподавателя используем API с его оборудованием
        const url = user?.role === "teacher" 
          ? "/api/teacher/equipment"
          : "/api/equipment";
          
        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          setEquipmentList(data);
          setFilteredEquipment(data);
        }
      } catch (error) {
        console.error("Error loading equipment:", error);
      } finally {
        setLoadingEquipment(false);
      }
    };
    
    if (isOpen && !equipment) {
      loadEquipment();
    }
  }, [isOpen, user, equipment]);

  // Фильтрация оборудования при поиске
  useEffect(() => {
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = equipmentList.filter(eq => 
        eq.name.toLowerCase().includes(lowerSearch) ||
        eq.inventoryNumber.toLowerCase().includes(lowerSearch) ||
        eq.equipmentType?.name?.toLowerCase().includes(lowerSearch)
      );
      setFilteredEquipment(filtered);
      setShowDropdown(true);
    } else {
      setFilteredEquipment(equipmentList);
      setShowDropdown(false);
    }
  }, [searchTerm, equipmentList]);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Очистка сканера при закрытии
  useEffect(() => {
    if (!isOpen && scannerRef.current) {
      stopScanner();
    }
  }, [isOpen]);

  useEffect(() => {
    if (request) {
      setForm({
        title: request.title,
        description: request.description,
        type: request.type,
        priority: request.priority || "",
        equipmentId: request.equipmentId || "",
      });
      if (request.equipment) {
        setSelectedEquipment(request.equipment);
        setSearchTerm(request.equipment.name);
      }
    } else if (equipment) {
      setSelectedEquipment(equipment);
      setSearchTerm(equipment.name);
      setForm({
        title: `Ремонт: ${equipment.name}`,
        description: `Оборудование: ${equipment.name}\nИнвентарный номер: ${equipment.inventoryNumber}\n\nОпишите проблему подробнее...`,
        type: "repair",
        priority: "medium",
        equipmentId: equipment.id,
      });
    } else {
      setForm({
        title: "",
        description: "",
        type: "repair",
        priority: "medium",
        equipmentId: "",
      });
      setSelectedEquipment(null);
      setSearchTerm("");
    }
  }, [request, equipment]);

  const handleSelectEquipment = (eq: FullEquipment) => {
    setSelectedEquipment(eq);
    setSearchTerm(`${eq.name} (${eq.inventoryNumber})`);
    setForm(f => ({ ...f, equipmentId: eq.id }));
    setShowDropdown(false);
  };

  const handleClearEquipment = () => {
    setSelectedEquipment(null);
    setSearchTerm("");
    setForm(f => ({ ...f, equipmentId: "" }));
  };

  // QR сканирование
  const startScanner = async () => {
    setScanError(null);
    setShowDropdown(false);
    
    // Ждём, пока DOM обновится
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const container = document.getElementById(containerId);
    if (!container) {
      setScanError("Элемент для сканера не найден");
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      
      scannerRef.current = new Html5Qrcode(containerId);
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText: string) => {
          await stopScanner();
          await handleQRCodeResult(decodedText);
        },
        (errorMessage: string) => {
          console.debug("Scanning:", errorMessage);
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setScanError("Не удалось запустить камеру. Проверьте разрешения.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
    scannerRef.current = null;
  };

  const handleQRCodeResult = async (decodedText: string) => {
    // Извлекаем инвентарный номер
    let inventoryNumber = decodedText;
    const invMatch = decodedText.match(/INV-\d{4}-\d{5,10}/);
    if (invMatch) {
      inventoryNumber = invMatch[0];
    }
    
    setLoadingEquipment(true);
    setScanError(null);
    
    try {
      // Ищем оборудование по инвентарному номеру
      const url = user?.role === "teacher" 
        ? `/api/teacher/equipment/search?inventoryNumber=${inventoryNumber}`
        : `/api/equipment/search?inventoryNumber=${inventoryNumber}`;
        
      const resp = await fetch(url);
      
      if (resp.ok) {
        const eq = await resp.json();
        
        // Проверяем доступ к оборудованию для преподавателя
        if (user?.role === "teacher") {
          const hasAccess = equipmentList.some(e => e.id === eq.id);
          if (!hasAccess) {
            setScanError("Это оборудование не находится в ваших кабинетах");
            return;
          }
        }
        
        handleSelectEquipment(eq);
      } else {
        setScanError(`Оборудование с номером ${inventoryNumber} не найдено`);
      }
    } catch (error) {
      console.error("Error searching equipment:", error);
      setScanError("Ошибка при поиске оборудования");
    } finally {
      setLoadingEquipment(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      alert("Заполните заголовок и описание");
      return;
    }

    setLoading(true);
    const url = request ? `/api/requests/${request.id}` : "/api/requests";
    const method = request ? "PATCH" : "POST";

    const submitData = {
      ...form,
      equipmentId: selectedEquipment?.id || null,
    };

    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    });

    if (resp.ok) {
      onSuccess();
      onClose();
    } else {
      const error = await resp.json();
      alert(error.error || "Ошибка сохранения");
    }
    setLoading(false);
  };

  const selectedType = typeOptions.find(t => t.value === form.type);
  const selectedPriority = priorityOptions.find(p => p.value === form.priority);

  return (
    <Modal
      isOpen={isOpen}
      title={
        <div className="flex items-center gap-2">
          <span>{request ? "Редактировать заявку" : equipment ? "Заявка на ремонт оборудования" : "Новая заявка"}</span>
        </div>
      }
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* QR сканер */}
        {isScanning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
            <div className="relative w-full max-w-md p-4">
              <div 
                id={containerId}
                className="w-full rounded-xl overflow-hidden"
                style={{ aspectRatio: "1/1" }}
              />
              <button
                onClick={stopScanner}
                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30"
              >
                <X size={24} className="text-white" />
              </button>
              <p className="text-center text-white text-sm mt-4">
                Наведите камеру на QR-код оборудования
              </p>
            </div>
          </div>
        )}

        {/* Поиск оборудования */}
        {!equipment && (
          <div className="relative" ref={searchRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Оборудование <span className="text-xs text-gray-400">(необязательно)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Поиск по названию или инвентарному номеру..."
                  className={`${inputCls} pl-9 pr-8`}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearEquipment}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={startScanner}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Сканировать QR-код"
              >
                <Camera size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Выпадающий список оборудования */}
            {showDropdown && filteredEquipment.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredEquipment.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => handleSelectEquipment(eq)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{eq.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono">{eq.inventoryNumber}</span>
                      <span>•</span>
                      <span>{eq.equipmentType?.name || "Без типа"}</span>
                      {eq.room?.number && (
                        <>
                          <span>•</span>
                          <span>Каб. {eq.room.number}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {loadingEquipment && (
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" />
                Загрузка оборудования...
              </div>
            )}

            {scanError && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle size={14} />
                {scanError}
              </div>
            )}

            {/* Выбранное оборудование */}
            {selectedEquipment && (
              <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Выбрано:</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedEquipment.name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{selectedEquipment.inventoryNumber}</p>
                </div>
                <button
                  onClick={handleClearEquipment}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Заголовок */}
        <ModalField title="Заголовок *">
          <input
            type="text"
            className={inputCls}
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Краткое описание проблемы"
          />
        </ModalField>

        {/* Тип и приоритет */}
        <div className="grid grid-cols-2 gap-4">
          <ModalField title="Тип заявки *">
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {selectedType && (
              <p className="text-xs text-gray-400 mt-1">{selectedType.description}</p>
            )}
          </ModalField>

          <ModalField title="Приоритет">
            <select
              className={inputCls}
              value={form.priority}
              onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
            >
              {priorityOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {selectedPriority && (
              <p className="text-xs text-gray-400 mt-1">
                {selectedPriority.value === "urgent" && "Критическая проблема, требуется срочное решение"}
                {selectedPriority.value === "high" && "Проблема требует внимания в ближайшее время"}
                {selectedPriority.value === "medium" && "Желательно решить в ближайшие дни"}
                {selectedPriority.value === "low" && "Не срочно, можно в любое время"}
              </p>
            )}
          </ModalField>
        </div>

        {/* Описание */}
        <ModalField title="Описание *">
          <textarea
            className={inputCls}
            rows={6}
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Подробно опишите проблему или необходимые работы...
Например: 
- Когда возникла проблема
- Какие действия уже предприняты
- Есть ли внешние повреждения
- Частота возникновения проблемы"
          />
        </ModalField>

        {/* Советы */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">💡 Советы по заполнению:</p>
          <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Опишите проблему максимально подробно</li>
            <li>Укажите, когда впервые заметили неисправность</li>
            <li>Приложите фото оборудования (если есть возможность)</li>
            <li>{`Для срочных проблем выберите приоритет "Срочный"`}</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {request ? "Сохранить" : "Отправить заявку"}
        </Button>
      </div>
    </Modal>
  );
}