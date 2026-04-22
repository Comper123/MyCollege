export function formatDateTime(iso: string, mode: "date" | "time" | "full" = "full") {
  const date = new Date(iso)
  switch (mode){
    case "date":
      return date.toLocaleDateString("ru-RU", {day: "2-digit", month: "2-digit",  year: "numeric", timeZone: "UTC"});
    case "time":
      return date.toLocaleTimeString("ru-RU", {hour: "2-digit", minute: "2-digit", timeZone: "UTC"});
    case "full":
      return date.toLocaleString("ru-RU", {day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC"})
  }
}