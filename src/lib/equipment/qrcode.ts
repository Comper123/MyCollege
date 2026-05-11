import QRCode from "qrcode";

// Формат QR-кода: 
// {
//   "type": "equipment",
//   "version": 1,
//   "id": "uuid-оборудования"
// }

export interface QRCodeData {
  type: "equipment";
  version: number;
  id: string;
}

// Генерация QR-кода для оборудования
export async function generateEquipmentQRCode(equipmentId: string): Promise<string> {
  const data: QRCodeData = {
    type: "equipment",
    version: 1,
    id: equipmentId,
  };
  
  const jsonString = JSON.stringify(data);
  
  return QRCode.toDataURL(jsonString, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

// Генерация QR-кода для печати (большой размер)
export async function generateEquipmentQRCodeForPrint(equipmentId: string): Promise<string> {
  const data: QRCodeData = {
    type: "equipment",
    version: 1,
    id: equipmentId,
  };
  
  const jsonString = JSON.stringify(data);
  
  return QRCode.toDataURL(jsonString, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

// Парсинг QR-кода (для использования в сканере)
export function parseQRCodeData(decodedText: string): QRCodeData | null {
  try {
    const data = JSON.parse(decodedText);
    
    // Проверяем, что это корректный QR-код оборудования
    if (data.type === "equipment" && data.version === 1 && data.id) {
      return data;
    }
    
    return null;
  } catch {
    // Если это не JSON, возможно старый формат (инвентарный номер)
    // Пробуем найти инвентарный номер
    const invMatch = decodedText.match(/INV-\d{4}-\d+/);
    if (invMatch) {
      // Возвращаем специальный объект для старого формата
      return {
        type: "equipment",
        version: 1,
        id: invMatch[0], // временно используем инвентарный номер как id
      };
    }
    return null;
  }
}