import { Html5Qrcode } from "html5-qrcode";
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

/**
 * Возвращает строку JSON, которая кодируется в QR.
 * Именно её нужно хранить в БД и использовать для проверки.
 */
export function buildQRPayload(equipmentId: string): string {
  const data: QRCodeData = {
    type: "equipment",
    version: 1,
    id: equipmentId,
  };
  return JSON.stringify(data);
}
 
/**
 * Генерирует QR-код как data URL (для отображения на странице / печати).
 * В БД лучше хранить payload (buildQRPayload), а не этот data URL.
 */
export async function generateEquipmentQRCode(equipmentId: string): Promise<string> {
  const payload = buildQRPayload(equipmentId);
  console.log(payload);
  const qr = QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
  return qr
}

/**
 * Генерирует QR-код увеличенного размера для печати.
 */
export async function generateEquipmentQRCodeForPrint(equipmentId: string): Promise<string> {
  const payload = buildQRPayload(equipmentId);
  return QRCode.toDataURL(payload, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

/**
 * Парсит текст, считанный сканером с QR-кода.
 * Принимает строку JSON вида {"type":"equipment","version":1,"id":"..."}
 * или старый формат с инвентарным номером INV-XXXX-XXXX.
 */
export function parseQRCodeData(decodedText: string): QRCodeData | null {
  try {
    const data = JSON.parse(decodedText);
    if (data.type === "equipment" && data.version === 1 && data.id) {
      return data as QRCodeData;
    }
    return null;
  } catch {
    // Старый формат — инвентарный номер в тексте
    const invMatch = decodedText.match(/INV-\d{4}-\d+/);
    if (invMatch) {
      return { type: "equipment", version: 1, id: invMatch[0] };
    }
    return null;
  }
}

/**
 * Преобразует base64 строку в File объект
 */
function base64ToFile(base64: string, filename: string = "qrcode.png"): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Извлекает текст из QR-кода, который хранится в base64 формате
 * @param base64Image - base64 строка изображения (из поля qr_code в БД)
 * @returns распарсенные данные из QR-кода или null
 */
export async function extractQRFromBase64(base64Image: string): Promise<QRCodeData | null> {
  if (!base64Image) return null;
  
  try {
    // Создаём временный элемент для сканирования с уникальным ID
    const containerId = `temp-scanner-${Date.now()}`;
    const container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none';
    document.body.appendChild(container);
    
    // Создаём сканер
    const scanner = new Html5Qrcode(containerId);
    
    // Преобразуем base64 в File
    const file = base64ToFile(base64Image);
    
    // Сканируем файл
    const decodedText = await scanner.scanFile(file, true);
    
    // Очищаем
    await scanner.clear();
    document.body.removeChild(container);
    
    // Парсим результат
    return parseQRCodeData(decodedText);
  } catch (error) {
    console.error("Failed to extract QR from base64:", error);
    return null;
  }
}