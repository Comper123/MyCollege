// src/app/dashboard/page.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "urgent" | "medium" | "ok";

interface Task {
  id: string;
  title: string;
  priority: Priority;
}

interface Room {
  id: string;
  num: string;
  name: string;
  lab: string;
  equipment: number;
  x: number;
  y: number;
  w: number;
  h: number;
  tasks: Task[];
}

interface Floor {
  id: number;
  label: string;
  rooms: Room[];
}

type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface DragState {
  type: "move" | "resize";
  roomId: string;
  dir?: HandleDir;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VB_W = 1000;
const VB_H = 560;
const MIN_SIZE = 50;
const WALL = 8;
const CORRIDOR_Y = 228;
const CORRIDOR_H = 60;

const HANDLES: { dir: HandleDir; cx: (r: Room) => number; cy: (r: Room) => number }[] = [
  { dir: "nw", cx: r => r.x,         cy: r => r.y },
  { dir: "n",  cx: r => r.x + r.w/2, cy: r => r.y },
  { dir: "ne", cx: r => r.x + r.w,   cy: r => r.y },
  { dir: "e",  cx: r => r.x + r.w,   cy: r => r.y + r.h/2 },
  { dir: "se", cx: r => r.x + r.w,   cy: r => r.y + r.h },
  { dir: "s",  cx: r => r.x + r.w/2, cy: r => r.y + r.h },
  { dir: "sw", cx: r => r.x,         cy: r => r.y + r.h },
  { dir: "w",  cx: r => r.x,         cy: r => r.y + r.h/2 },
];

const CURSOR_MAP: Record<HandleDir, string> = {
  nw: "nw-resize", n: "n-resize", ne: "ne-resize",
  e: "e-resize",  se: "se-resize", s: "s-resize",
  sw: "sw-resize", w: "w-resize",
};

function getRoomFill(room: Room, selected: boolean, dimmed: boolean): string {
  if (dimmed)   return "#b0aaa0";
  if (selected) return "#603EF9";
  if (room.tasks.some(t => t.priority === "urgent")) return "#D85A30";
  if (room.tasks.some(t => t.priority === "medium")) return "#BA7517";
  return "#3B6D11";
}

// ─── Floor data ───────────────────────────────────────────────────────────────

const INITIAL_FLOORS: Floor[] = [
  {
    id: 1, label: "1 этаж",
    rooms: [
      { id:"101", num:"101", name:"Лаб. программирования",  lab:"Иванов И.И.",  equipment:12, x:18,  y:18, w:176, h:200, tasks:[{id:"t1",title:"Замена ОЗУ ПК №4",priority:"urgent"},{id:"t2",title:"Плановое ТО",priority:"medium"}] },
      { id:"102", num:"102", name:"Кабинет информатики",    lab:"Петрова М.С.", equipment:20, x:202, y:18, w:176, h:200, tasks:[] },
      { id:"103", num:"103", name:"Лаб. компьютерных сетей",lab:"Иванов И.И.",  equipment:8,  x:386, y:18, w:176, h:200, tasks:[{id:"t3",title:"Коммутатор не отвечает",priority:"urgent"}] },
      { id:"104", num:"104", name:"Серверная",              lab:"Сидоров К.В.", equipment:5,  x:570, y:18, w:120, h:200, tasks:[{id:"t4",title:"Замена HDD сервера",priority:"medium"}] },
      { id:"105", num:"105", name:"Кабинет математики",     lab:"Петрова М.С.", equipment:6,  x:698, y:18, w:144, h:200, tasks:[] },
      { id:"106", num:"106", name:"Кабинет физики",         lab:"Иванов И.И.",  equipment:10, x:850, y:18, w:132, h:200, tasks:[] },
      { id:"107", num:"107", name:"Лекционный зал А",       lab:"Петрова М.С.", equipment:30, x:18,  y:296, w:260, h:200, tasks:[] },
      { id:"108", num:"108", name:"Лаб. электроники",       lab:"Сидоров К.В.", equipment:18, x:286, y:296, w:176, h:200, tasks:[{id:"t5",title:"Проектор без лампы",priority:"urgent"}] },
      { id:"109", num:"109", name:"Кабинет химии",          lab:"Иванов И.И.",  equipment:22, x:470, y:296, w:176, h:200, tasks:[{id:"t6",title:"Замена вытяжки",priority:"medium"}] },
      { id:"110", num:"110", name:"Кабинет биологии",       lab:"Петрова М.С.", equipment:15, x:654, y:296, w:176, h:200, tasks:[] },
      { id:"111", num:"111", name:"Кабинет истории",        lab:"Сидоров К.В.", equipment:8,  x:838, y:296, w:144, h:200, tasks:[] },
    ],
  },
  {
    id: 2, label: "2 этаж",
    rooms: [
      { id:"201", num:"201", name:"Кабинет математики",     lab:"Иванов И.И.",  equipment:5,  x:18,  y:18, w:176, h:200, tasks:[] },
      { id:"202", num:"202", name:"Лаб. робототехники",     lab:"Петрова М.С.", equipment:14, x:202, y:18, w:176, h:200, tasks:[{id:"t7",title:"Замена акб робота №3",priority:"urgent"}] },
      { id:"203", num:"203", name:"Медиацентр",             lab:"Сидоров К.В.", equipment:10, x:386, y:18, w:176, h:200, tasks:[{id:"t8",title:"Обновить ПО камер",priority:"medium"}] },
      { id:"204", num:"204", name:"Кабинет экономики",      lab:"Иванов И.И.",  equipment:7,  x:570, y:18, w:144, h:200, tasks:[] },
      { id:"205", num:"205", name:"Кабинет права",          lab:"Петрова М.С.", equipment:4,  x:722, y:18, w:144, h:200, tasks:[] },
      { id:"206", num:"206", name:"Кабинет иностр. языков", lab:"Сидоров К.В.", equipment:11, x:874, y:18, w:108, h:200, tasks:[] },
      { id:"207", num:"207", name:"Актовый зал",            lab:"Иванов И.И.",  equipment:25, x:18,  y:296, w:340, h:200, tasks:[{id:"t9",title:"Ремонт звука",priority:"urgent"}] },
      { id:"208", num:"208", name:"Библиотека",             lab:"Петрова М.С.", equipment:9,  x:366, y:296, w:260, h:200, tasks:[] },
      { id:"209", num:"209", name:"Кабинет психологии",     lab:"Сидоров К.В.", equipment:6,  x:634, y:296, w:176, h:200, tasks:[] },
      { id:"210", num:"210", name:"Кабинет географии",      lab:"Иванов И.И.",  equipment:8,  x:818, y:296, w:164, h:200, tasks:[] },
    ],
  },
  {
    id: 3, label: "3 этаж",
    rooms: [
      { id:"301", num:"301", name:"Дизайн-студия",          lab:"Иванов И.И.",  equipment:16, x:18,  y:18, w:196, h:200, tasks:[{id:"t10",title:"Калибровка мониторов",priority:"medium"}] },
      { id:"302", num:"302", name:"Лаб. 3D-печати",         lab:"Сидоров К.В.", equipment:7,  x:222, y:18, w:176, h:200, tasks:[{id:"t11",title:"Засор экструдера",priority:"urgent"}] },
      { id:"303", num:"303", name:"Конференц-зал",          lab:"Петрова М.С.", equipment:8,  x:406, y:18, w:196, h:200, tasks:[] },
      { id:"304", num:"304", name:"Кабинет директора",      lab:"Сидоров К.В.", equipment:3,  x:610, y:18, w:144, h:200, tasks:[] },
      { id:"305", num:"305", name:"Учительская",            lab:"Иванов И.И.",  equipment:9,  x:762, y:18, w:220, h:200, tasks:[] },
      { id:"306", num:"306", name:"Лаборатория ИИ",         lab:"Сидоров К.В.", equipment:20, x:18,  y:296, w:220, h:200, tasks:[{id:"t12",title:"Настройка GPU-кластера",priority:"medium"}] },
      { id:"307", num:"307", name:"Склад оборудования",     lab:"Петрова М.С.", equipment:50, x:246, y:296, w:176, h:200, tasks:[] },
      { id:"308", num:"308", name:"Кабинет менеджмента",    lab:"Иванов И.И.",  equipment:6,  x:430, y:296, w:176, h:200, tasks:[] },
      { id:"309", num:"309", name:"Кабинет литературы",     lab:"Петрова М.С.", equipment:7,  x:614, y:296, w:176, h:200, tasks:[] },
      { id:"310", num:"310", name:"Методический кабинет",   lab:"Сидоров К.В.", equipment:5,  x:798, y:296, w:184, h:200, tasks:[] },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [floors, setFloors]           = useState<Floor[]>(INITIAL_FLOORS);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [editMode, setEditMode]       = useState(false);
  const [editPanel, setEditPanel]     = useState<Room | null>(null);
  const [viewBox, setViewBox]         = useState({ x: 0, y: 0, w: VB_W, h: VB_H });
  const [animating, setAnimating]     = useState(false);

  const svgRef  = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const floor        = floors.find(f => f.id === currentFloor)!;
  const selectedRoom = floor.rooms.find(r => r.id === selectedId) ?? null;
  const zoomed       = viewBox.w < VB_W - 10;

  // ── SVG coords ──
  const toSVG = useCallback((cx: number, cy: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const r = pt.matrixTransform(ctm.inverse());
    return { x: r.x, y: r.y };
  }, []);

  // ── Animate viewBox ──
  const animateTo = useCallback((x: number, y: number, w: number, h: number) => {
    setAnimating(true);
    setViewBox({ x, y, w, h });
    setTimeout(() => setAnimating(false), 480);
  }, []);

  const focusRoom = useCallback((room: Room) => {
    const PAD = 100;
    const x = Math.max(0, room.x - PAD);
    const y = Math.max(0, room.y - PAD);
    const w = room.w + PAD * 2;
    const h = room.h + PAD * 2;
    const svg = svgRef.current;
    const aspect = svg ? svg.clientWidth / svg.clientHeight : VB_W / VB_H;
    const adjH = w / aspect;
    animateTo(x, Math.max(0, y + (h - adjH) / 2), w, Math.max(adjH, h));
  }, [animateTo]);

  const resetView = useCallback(() => animateTo(0, 0, VB_W, VB_H), [animateTo]);

  // ── Update room ──
  const updateRoom = useCallback((roomId: string, patch: Partial<Room>) => {
    setFloors(prev => prev.map(f =>
      f.id !== currentFloor ? f : {
        ...f, rooms: f.rooms.map(r => r.id !== roomId ? r : { ...r, ...patch })
      }
    ));
  }, [currentFloor]);

  // ── Pointer events ──
  const onRoomPointerDown = useCallback((e: React.PointerEvent, room: Room) => {
    e.stopPropagation();
    setSelectedId(room.id);
    if (editMode) {
      const p = toSVG(e.clientX, e.clientY);
      dragRef.current = { type:"move", roomId:room.id, startX:p.x, startY:p.y, origX:room.x, origY:room.y, origW:room.w, origH:room.h };
      (e.target as Element).setPointerCapture(e.pointerId);
    } else {
      focusRoom(room);
    }
  }, [editMode, toSVG, focusRoom]);

  const onHandlePointerDown = useCallback((e: React.PointerEvent, room: Room, dir: HandleDir) => {
    e.stopPropagation();
    if (!editMode) return;
    const p = toSVG(e.clientX, e.clientY);
    dragRef.current = { type:"resize", roomId:room.id, dir, startX:p.x, startY:p.y, origX:room.x, origY:room.y, origW:room.w, origH:room.h };
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [editMode, toSVG]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toSVG(e.clientX, e.clientY);
    const dx = p.x - d.startX, dy = p.y - d.startY;
    if (d.type === "move") {
      updateRoom(d.roomId, {
        x: Math.max(0, Math.min(VB_W - d.origW, d.origX + dx)),
        y: Math.max(0, Math.min(VB_H - d.origH, d.origY + dy)),
      });
    } else {
      const dir = d.dir!;
      let nx=d.origX, ny=d.origY, nw=d.origW, nh=d.origH;
      if (dir.includes("e")) nw=Math.max(MIN_SIZE,d.origW+dx);
      if (dir.includes("s")) nh=Math.max(MIN_SIZE,d.origH+dy);
      if (dir.includes("w")){ const w2=Math.max(MIN_SIZE,d.origW-dx); nx=d.origX+d.origW-w2; nw=w2; }
      if (dir.includes("n")){ const h2=Math.max(MIN_SIZE,d.origH-dy); ny=d.origY+d.origH-h2; nh=h2; }
      updateRoom(d.roomId, {x:nx,y:ny,w:nw,h:nh});
    }
  }, [toSVG, updateRoom]);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  // ── Helpers ──
  const addRoom = () => {
    const id = `new-${Date.now()}`;
    const r: Room = { id, num:"000", name:"Новый кабинет", lab:"—", equipment:0, x:40, y:40, w:160, h:160, tasks:[] };
    setFloors(prev => prev.map(f => f.id!==currentFloor ? f : {...f, rooms:[...f.rooms, r]}));
    setSelectedId(id); setEditPanel({...r});
  };
  const deleteRoom = (id: string) => {
    setFloors(prev => prev.map(f => f.id!==currentFloor ? f : {...f, rooms:f.rooms.filter(r=>r.id!==id)}));
    setSelectedId(null); setEditPanel(null);
  };
  const savePanel = () => { if(!editPanel) return; updateRoom(editPanel.id, editPanel); setEditPanel(null); };

  const switchFloor = (id: number) => { setCurrentFloor(id); setSelectedId(null); setEditPanel(null); resetView(); };
  const toggleEdit = () => { if(editMode){ setSelectedId(null); resetView(); } setEditMode(v=>!v); };

  // ── Stats ──
  const urgentCount = floor.rooms.filter(r => r.tasks.some(t => t.priority==="urgent")).length;
  const mediumCount = floor.rooms.filter(r => r.tasks.some(t => t.priority==="medium")).length;
  const okCount     = floor.rooms.filter(r => r.tasks.length===0).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0e1c] shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Карта колледжа</span>
          <div className="flex gap-1 ml-2">
            {floors.map(f => (
              <button key={f.id} onClick={() => switchFloor(f.id)}
                className={`px-3 py-1 rounded-md text-sm transition-all ${currentFloor===f.id ? "bg-[#603EF9] text-white font-medium" : "text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-2">
            {[
              {label:`${urgentCount} срочных`, bg:"#FCEBEB", tc:"#A32D2D", dot:"#D85A30"},
              {label:`${mediumCount} плановых`,bg:"#FAEEDA", tc:"#854F0B", dot:"#BA7517"},
              {label:`${okCount} в норме`,     bg:"#EAF3DE", tc:"#3B6D11", dot:"#3B6D11"},
            ].map(s=>(
              <span key={s.label} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{background:s.bg,color:s.tc}}>
                <span className="w-2 h-2 rounded-full inline-block" style={{background:s.dot}}/>
                {s.label}
              </span>
            ))}
          </div>

          {zoomed && !editMode && (
            <button onClick={resetView} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Весь план
            </button>
          )}

          {isAdmin && editMode && (
            <button onClick={addRoom} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{background:"#EEEDFE",color:"#534AB7"}}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Добавить кабинет
            </button>
          )}

          {isAdmin && (
            <button onClick={toggleEdit}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${editMode ? "bg-[#603EF9] text-white hover:bg-[#4A2ED6]" : "border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10"}`}>
              {editMode
                ? <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Готово</>
                : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Редактировать план</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">

        {/* Map area */}
        <div className="flex-1 flex flex-col min-w-0 p-3 overflow-hidden" style={{background:"#e8e4dd"}}>
          {editMode && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg text-xs border shrink-0"
              style={{background:"#EEEDFE",borderColor:"#AFA9EC",color:"#3C3489"}}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Режим редактирования — перетаскивайте кабинеты, тяните ручки по краям для изменения размера
            </div>
          )}

          <div className="flex-1 relative rounded-xl overflow-hidden shadow-md" style={{borderWidth:"1px",borderStyle:"solid",borderColor:"rgba(0,0,0,0.15)"}}>
            <svg
              ref={svgRef}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              width="100%" height="100%"
              style={{
                display:"block", touchAction:"none",
                cursor: editMode ? "crosshair" : "default",
                transition: animating ? "all 0.45s cubic-bezier(0.4,0,0.2,1)" : "none",
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onClick={e => {
                if ((e.target as SVGElement).tagName === "svg" && !editMode) {
                  setSelectedId(null);
                  resetView();
                }
              }}
            >
              <defs>
                <filter id="fshadow" x="-15%" y="-15%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.22"/>
                </filter>
                <filter id="fglow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#603EF9" floodOpacity="0.55"/>
                </filter>
                <pattern id="tiles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill="#ddd8d0"/>
                  <rect x="0.5" y="0.5" width="19" height="19" fill="none" stroke="#ccc8c0" strokeWidth="0.3"/>
                </pattern>
                <pattern id="corrtile" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <rect width="30" height="30" fill="#d0ccc4"/>
                  <rect x="0.5" y="0.5" width="29" height="29" fill="none" stroke="#c4c0b8" strokeWidth="0.4"/>
                </pattern>
              </defs>

              {/* ── Building background ── */}
              <rect x="0" y="0" width={VB_W} height={VB_H} fill="#c0bab0"/>

              {/* Interior floor */}
              <rect x={WALL} y={WALL} width={VB_W-WALL*2} height={VB_H-WALL*2} fill="url(#tiles)"/>

              {/* Outer walls */}
              <rect x="0"           y="0"           width={VB_W}  height={WALL} fill="#2c2824"/>
              <rect x="0"           y={VB_H-WALL}   width={VB_W}  height={WALL} fill="#2c2824"/>
              <rect x="0"           y="0"           width={WALL}  height={VB_H} fill="#2c2824"/>
              <rect x={VB_W-WALL}   y="0"           width={WALL}  height={VB_H} fill="#2c2824"/>

              {/* Wall top highlight */}
              <rect x="0" y="0" width={VB_W} height="2" fill="#5a5450" opacity="0.5"/>
              <rect x="0" y="0" width="2"    height={VB_H} fill="#5a5450" opacity="0.5"/>

              {/* ── Corridor ── */}
              <rect x={WALL} y={CORRIDOR_Y} width={VB_W-WALL*2} height={CORRIDOR_H} fill="url(#corrtile)"/>
              {/* Corridor walls (top + bottom lines) */}
              <rect x={WALL} y={CORRIDOR_Y}              width={VB_W-WALL*2} height={3} fill="#2c2824" opacity="0.7"/>
              <rect x={WALL} y={CORRIDOR_Y+CORRIDOR_H-3} width={VB_W-WALL*2} height={3} fill="#2c2824" opacity="0.7"/>

              <text x={VB_W/2} y={CORRIDOR_Y+CORRIDOR_H/2+5} textAnchor="middle"
                fontSize="11" fill="#9a9590" fontFamily="system-ui" letterSpacing="0.15em" fontWeight="500">
                К О Р И Д О Р
              </text>

              {/* ── Stairwells ── */}
              {[
                { x: WALL,         label:"ЛЕС" },
                { x: VB_W-WALL-44, label:"ЛЕС" },
              ].map((s, i) => (
                <g key={i}>
                  <rect x={s.x} y={CORRIDOR_Y} width={44} height={CORRIDOR_H} fill="#b8b0a4" stroke="#9a9288" strokeWidth="0.5"/>
                  <line x1={s.x}    y1={CORRIDOR_Y}            x2={s.x+44} y2={CORRIDOR_Y+CORRIDOR_H} stroke="#9a9288" strokeWidth="0.7"/>
                  <line x1={s.x+44} y1={CORRIDOR_Y}            x2={s.x}    y2={CORRIDOR_Y+CORRIDOR_H} stroke="#9a9288" strokeWidth="0.7"/>
                  <text x={s.x+22} y={CORRIDOR_Y+CORRIDOR_H/2+4} textAnchor="middle" fontSize="8" fill="#6a6460" fontFamily="system-ui" fontWeight="600">
                    {s.label}
                  </text>
                </g>
              ))}

              {/* ── WC blocks ── */}
              {[
                { x: VB_W-WALL-74, y: WALL,        w:74, h:55 },
                { x: VB_W-WALL-74, y: VB_H-WALL-55,w:74, h:55 },
              ].map((wc, i) => (
                <g key={i}>
                  <rect x={wc.x} y={wc.y} width={wc.w} height={wc.h} fill="#ccc8c0" stroke="#aaa8a0" strokeWidth="0.5"/>
                  <text x={wc.x+wc.w/2} y={wc.y+wc.h/2+5} textAnchor="middle" fontSize="10" fill="#8a8880" fontFamily="system-ui" letterSpacing="0.05em">WC</text>
                </g>
              ))}

              {/* ── Structural walls between rooms (North row) ── */}
              {[202, 386, 570, 698, 850].map(x => (
                <rect key={`nwall-${x}`} x={x} y={WALL} width={3} height={CORRIDOR_Y-WALL} fill="#2c2824" opacity="0.75"/>
              ))}
              {/* South row */}
              {[286, 470, 654, 838].map(x => (
                <rect key={`swall-${x}`} x={x} y={CORRIDOR_Y+CORRIDOR_H} width={3} height={VB_H-WALL-(CORRIDOR_Y+CORRIDOR_H)} fill="#2c2824" opacity="0.75"/>
              ))}

              {/* ── Door gaps on corridor wall ── */}
              {floor.rooms.filter(r => r.y < CORRIDOR_Y).map(room => (
                <rect key={`dgap-n-${room.id}`}
                  x={room.x + room.w/2 - 14} y={CORRIDOR_Y - 4}
                  width={28} height={8} rx={4}
                  fill="#d0ccc4" stroke="#603EF9" strokeWidth="0.8" opacity="0.7"/>
              ))}
              {floor.rooms.filter(r => r.y > CORRIDOR_Y).map(room => (
                <rect key={`dgap-s-${room.id}`}
                  x={room.x + room.w/2 - 14} y={CORRIDOR_Y+CORRIDOR_H - 4}
                  width={28} height={8} rx={4}
                  fill="#d0ccc4" stroke="#603EF9" strokeWidth="0.8" opacity="0.7"/>
              ))}

              {/* ── Rooms ── */}
              {floor.rooms.map(room => {
                const isSelected = room.id === selectedId;
                const isDimmed   = !editMode && !!selectedId && !isSelected;
                const fill       = getRoomFill(room, isSelected, isDimmed);

                return (
                  <g key={room.id}>
                    {/* Shadow for selected */}
                    {isSelected && (
                      <rect x={room.x+1} y={room.y+1} width={room.w-2} height={room.h-2} rx={3}
                        fill={fill} opacity={0.3} filter="url(#fglow)"/>
                    )}

                    {/* Room fill */}
                    <rect
                      x={room.x+1} y={room.y+1} width={room.w-2} height={room.h-2} rx={3}
                      fill={fill}
                      fillOpacity={isDimmed ? 0.35 : isSelected ? 1 : 0.88}
                      stroke={isSelected ? "#fff" : isDimmed ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.25)"}
                      strokeWidth={isSelected ? 2 : 0.5}
                      filter={(!isSelected && !isDimmed) ? "url(#fshadow)" : undefined}
                      style={{ cursor: editMode ? "grab" : "pointer" }}
                      onPointerDown={e => onRoomPointerDown(e, room)}
                    />

                    {/* Room inner label area */}
                    <g pointerEvents="none" opacity={isDimmed ? 0.3 : 1}>
                      {/* Number */}
                      <text
                        x={room.x+room.w/2} y={room.y+room.h/2-12}
                        textAnchor="middle" fontSize="24" fontWeight="700"
                        fill={isSelected?"#fff":"rgba(255,255,255,0.97)"}
                        fontFamily="system-ui" letterSpacing="-0.5">
                        {room.num}
                      </text>
                      {/* Name */}
                      <text
                        x={room.x+room.w/2} y={room.y+room.h/2+8}
                        textAnchor="middle" fontSize="8.5"
                        fill={isSelected?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.7)"}
                        fontFamily="system-ui">
                        {room.name.length>22 ? room.name.slice(0,20)+"…" : room.name}
                      </text>
                      {/* Equipment */}
                      <text
                        x={room.x+room.w/2} y={room.y+room.h/2+22}
                        textAnchor="middle" fontSize="7.5"
                        fill="rgba(255,255,255,0.45)"
                        fontFamily="system-ui">
                        {room.equipment} ед.
                      </text>

                      {/* Task badge (top-right corner) */}
                      {room.tasks.length > 0 && (
                        <g>
                          <circle cx={room.x+room.w-14} cy={room.y+14} r={9}
                            fill={room.tasks.some(t=>t.priority==="urgent")?"#FCEBEB":"#FAEEDA"}
                            stroke={room.tasks.some(t=>t.priority==="urgent")?"#E24B4A":"#EF9F27"}
                            strokeWidth="1.2"/>
                          <text x={room.x+room.w-14} y={room.y+18}
                            textAnchor="middle" fontSize="8" fontWeight="700"
                            fill={room.tasks.some(t=>t.priority==="urgent")?"#A32D2D":"#854F0B"}
                            fontFamily="system-ui">
                            {room.tasks.length}
                          </text>
                        </g>
                      )}

                      {/* Edit mode: position label */}
                      {editMode && isSelected && (
                        <text x={room.x+4} y={room.y+room.h-6} fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="system-ui">
                          {Math.round(room.x)},{Math.round(room.y)} · {Math.round(room.w)}×{Math.round(room.h)}
                        </text>
                      )}
                    </g>

                    {/* Resize handles */}
                    {editMode && isSelected && HANDLES.map(h => (
                      <rect key={h.dir}
                        x={h.cx(room)-5} y={h.cy(room)-5} width={10} height={10} rx={2}
                        fill="#fff" stroke="#603EF9" strokeWidth={1.5}
                        style={{cursor:CURSOR_MAP[h.dir]}}
                        onPointerDown={e=>onHandlePointerDown(e,room,h.dir)}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Compass */}
              <g transform={`translate(${VB_W-28},26)`} opacity="0.35" pointerEvents="none">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#2c2824" strokeWidth="0.8"/>
                <polygon points="0,-10 3,0 0,4 -3,0" fill="#2c2824" opacity="0.7"/>
                <text x="0" y="-13" textAnchor="middle" fontSize="7" fill="#2c2824" fontFamily="system-ui" fontWeight="700">С</text>
              </g>

              {/* Scale */}
              <g transform={`translate(18,${VB_H-18})`} opacity="0.35" pointerEvents="none">
                <line x1="0" y1="0" x2="50" y2="0" stroke="#2c2824" strokeWidth="1"/>
                <line x1="0" y1="-3" x2="0"  y2="3" stroke="#2c2824" strokeWidth="1"/>
                <line x1="50" y1="-3" x2="50" y2="3" stroke="#2c2824" strokeWidth="1"/>
                <text x="25" y="-5" textAnchor="middle" fontSize="7" fill="#2c2824" fontFamily="system-ui">10 м</text>
              </g>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 px-1 shrink-0 flex-wrap">
            {[
              {color:"#D85A30", label:"Срочная задача"},
              {color:"#BA7517", label:"Плановая задача"},
              {color:"#3B6D11", label:"Без задач"},
              {color:"#603EF9", label:"Выбран"},
            ].map(l=>(
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/40">
                <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{background:l.color}}/>
                {l.label}
              </div>
            ))}
            {zoomed && (
              <button onClick={resetView} className="ml-auto text-xs font-medium" style={{color:"#603EF9"}}>
                ← Весь план
              </button>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-64 shrink-0 border-l border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0e1c] flex flex-col overflow-y-auto">
          {selectedRoom ? (
            <div className="p-4 flex flex-col gap-3 flex-1">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0 inline-block"
                      style={{background:getRoomFill(selectedRoom,false,false)}}/>
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      Каб. {selectedRoom.num}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5 leading-snug">{selectedRoom.name}</p>
                </div>
                <button onClick={()=>{setSelectedId(null);resetView();}}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex-shrink-0">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Meta */}
              <div className="text-xs text-gray-400 dark:text-white/40 flex flex-col gap-1.5 pb-3 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {selectedRoom.lab}
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  {selectedRoom.equipment} ед. оборудования
                </div>
              </div>

              {/* Tasks */}
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2 font-medium">Задачи</p>
                {selectedRoom.tasks.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-white/30">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{background:"#EAF3DE"}}>
                      <svg width="9" height="9" fill="none" stroke="#3B6D11" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    Задач нет
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {selectedRoom.tasks.map(task=>(
                      <div key={task.id} className="rounded-lg px-3 py-2 text-sm"
                        style={{
                          background: task.priority==="urgent"?"#FCEBEB":"#FAEEDA",
                          borderLeft:`3px solid ${task.priority==="urgent"?"#D85A30":"#BA7517"}`,
                          color:      task.priority==="urgent"?"#791F1F":"#633806",
                        }}>
                        <div className="font-semibold text-xs mb-0.5">
                          {task.priority==="urgent"?"⚑ Срочно":"○ Плановый"}
                        </div>
                        {task.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-auto pt-3">
                {isAdmin && editMode ? (
                  <>
                    <button onClick={()=>setEditPanel({...selectedRoom})}
                      className="w-full py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                      style={{background:"#603EF9"}}>
                      Редактировать данные
                    </button>
                    <button onClick={()=>deleteRoom(selectedRoom.id)}
                      className="w-full py-2 rounded-lg text-sm border transition-all hover:opacity-90"
                      style={{borderColor:"#FECACA",color:"#D85A30",background:"transparent"}}>
                      Удалить кабинет
                    </button>
                  </>
                ) : (
                  <button className="w-full py-2 rounded-lg text-sm font-medium transition-all"
                    style={{background:"#EEEDFE",color:"#534AB7"}}>
                    Открыть кабинет →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/30 mb-3 font-medium">
                {floor.label} — обзор
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  {label:"Кабинетов", value:floor.rooms.length,  color:undefined},
                  {label:"Срочных",   value:urgentCount,          color:"#A32D2D"},
                  {label:"Плановых",  value:mediumCount,          color:"#854F0B"},
                  {label:"В норме",   value:okCount,              color:"#3B6D11"},
                ].map(s=>(
                  <div key={s.label} className="rounded-lg p-2.5 bg-gray-50 dark:bg-white/5 text-center">
                    <div className="text-xl font-semibold" style={{color:s.color??undefined}}>{s.value}</div>
                    <div className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-white/30 leading-relaxed">
                Нажмите на кабинет — карта приблизится и покажет детали
              </p>
              {isAdmin && !editMode && (
                <div className="mt-4 p-3 rounded-lg text-xs" style={{background:"#EEEDFE",color:"#3C3489"}}>
                  Нажмите «Редактировать план» чтобы перемещать и изменять размеры кабинетов
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit panel modal */}
      {editPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{background:"rgba(0,0,0,0.45)"}}
          onClick={()=>setEditPanel(null)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-white/10 p-6 w-80 shadow-2xl"
            onClick={e=>e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Данные кабинета {editPanel.num}
            </h3>
            {([
              {label:"Номер",             field:"num"},
              {label:"Название",          field:"name"},
              {label:"Ответственный",     field:"lab"},
              {label:"Оборудование (ед.)",field:"equipment",type:"number"},
            ] as {label:string;field:keyof Room;type?:string}[]).map(({label,field,type})=>(
              <div key={field} className="mb-3">
                <label className="text-xs text-gray-500 dark:text-white/50 mb-1 block">{label}</label>
                <input type={type??"text"} value={editPanel[field] as string|number}
                  onChange={e=>setEditPanel(p=>p?{...p,[field]:type==="number"?Number(e.target.value):e.target.value}:p)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none transition-all"
                  style={{outline:"none"}}
                  onFocus={e=>(e.target.style.borderColor="#603EF9")}
                  onBlur={e=>(e.target.style.borderColor="")}
                />
              </div>
            ))}
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setEditPanel(null)}
                className="flex-1 py-2 rounded-lg text-sm border border-gray-200 dark:border-white/15 text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                Отмена
              </button>
              <button onClick={savePanel}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{background:"#603EF9"}}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}