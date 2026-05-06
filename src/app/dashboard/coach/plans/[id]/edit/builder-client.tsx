'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Plus, Trash2, Dumbbell, Save, Loader2, X,
  Search, Layout, Edit3,
  Hash, Video,
  Eye, EyeOff, CheckCircle2, Timer as TimerIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { savePlanStructure, toggleWeekStatus, updateBlockDescription } from '../../actions'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  TouchSensor,
  useDraggable
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { SortableMovement } from './SortableMovement'
import { SortableBlock } from './SortableBlock'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { SmartRoutineText } from '@/components/workout/smart-routine-text'

// Types
type Exercise = { id: string, name: string, category?: string | null, difficulty_level?: string | null, video_url?: string | null, tracking_type?: string | null }
type Movement = { id: string, exercise_id: string, exercise?: Exercise, sets: number, reps: string, weight_percentage: string, notes: string }
type Block = { id: string, name: string, type: string, description?: string, workout_movements: Movement[], timer_type?: string, timer_config?: any }
type Day = { id: string, day_of_week: number, title: string, week_number: number, is_published: boolean, workout_blocks: Block[] }

const genId = () => Math.random().toString(36).substr(2, 9)

// Sidebar Exercise Item with Drag & Copy Tag Support
function LibraryItem({ exercise }: { exercise: Exercise }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib-${exercise.id}`,
    data: { type: 'library-item', exercise }
  })
  
  const [copied, setCopied] = useState(false)

  const handleCopyTag = (e: React.MouseEvent) => {
    e.stopPropagation()
    const tag = `[${exercise.name}]`
    navigator.clipboard.writeText(tag)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999
  } : undefined

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={cn(
        "group relative p-3 mb-2 rounded-2xl bg-card/80 border border-border/70 hover:border-primary/40 cursor-grab active:cursor-grabbing transition-all hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)]",
        isDragging && "opacity-50 ring-2 ring-primary ring-offset-4 ring-offset-background"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary/20 transition-colors">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase truncate text-foreground tracking-tight">{exercise.name}</p>
            <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">{exercise.category || 'General'}</p>
          </div>
        </div>

        <button
          onClick={handleCopyTag}
          className={cn(
            "h-8 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all",
            copied 
              ? "bg-green-500/20 text-green-500 border border-green-500/30" 
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
          )}
        >
          {copied ? <CheckCircle2 className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Etiqueta'}
        </button>
      </div>
      
      {/* Visual Indicator of Draggable */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
    </div>
  )
}

import { useDroppable } from '@dnd-kit/core'

function DroppableBlock({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div 
      ref={setNodeRef} 
      className={`${className} transition-colors duration-200 ${isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''}`}
    >
      {children}
    </div>
  )
}

export function BuilderClient({ 
  planId, 
  initialPlan, 
  initialDays, 
  library 
}: { 
  planId: string, 
  initialPlan: any, 
  initialDays: any[], 
  library: Exercise[] 
}) {
  // Ensure all entities have IDs and normalized exercise relation
  const processInitialDays = (rawDays: any[]): Day[] => {
    return rawDays.map(d => ({
      ...d,
      id: d.id || genId(),
      is_published: d.is_published ?? true,
      workout_blocks: (d.workout_blocks || []).map((b: any) => ({
        ...b,
        id: b.id || genId(),
        timer_type: b.timer_type || null,
        timer_config: b.timer_config || {},
        workout_movements: (b.workout_movements || []).map((m: any) => {
          const ex = m.exercises || m.exercise
          return {
            ...m,
            id: m.id || genId(),
            exercise: Array.isArray(ex) ? ex[0] : ex
          }
        })
      }))
    }))
  }

  const [days, setDays] = useState<Day[]>(processInitialDays(initialDays))
  const daysRef = useRef<Day[]>(processInitialDays(initialDays))
  const [routineDrafts, setRoutineDrafts] = useState<Record<string, string>>(() => {
    const drafts: Record<string, string> = {}
    daysRef.current.forEach(day => {
      day.workout_blocks.forEach(block => {
        drafts[block.id] = block.description || ''
      })
    })
    return drafts
  })
  const routineDraftsRef = useRef<Record<string, string>>(routineDrafts)
  const [planMeta, setPlanMeta] = useState({
    title: initialPlan?.title || '',
    description: initialPlan?.description || '',
    is_community_enabled: initialPlan?.is_community_enabled ?? true
  })
  
  const [activeWeek, setActiveWeek] = useState<string>('1')
  const [libSearch, setLibSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editingBlocks, setEditingBlocks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    routineDraftsRef.current = routineDrafts
  }, [routineDrafts])

  // Track changes to planMeta
  useEffect(() => {
    if (planMeta.title !== (initialPlan?.title || '') || 
        planMeta.description !== (initialPlan?.description || '') ||
        planMeta.is_community_enabled !== (initialPlan?.is_community_enabled ?? true)) {
      setHasUnsavedChanges(true)
    }
  }, [planMeta, initialPlan])

  // Immutable state update helper
  // Immutable state update helper with deep cloning safety
  const updateDays = (updater: Day[] | ((prev: Day[]) => Day[])) => {
    setDays(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // Deep clone to ensure React detects changes in nested objects
      const clonedNext = JSON.parse(JSON.stringify(next))
      daysRef.current = clonedNext
      setHasUnsavedChanges(true)
      return clonedNext
    })
  }

  const rebuildRoutineDrafts = (nextDays: Day[]) => {
    const drafts: Record<string, string> = {}
    nextDays.forEach(day => {
      day.workout_blocks.forEach(block => {
        drafts[block.id] = block.description || ''
      })
    })
    routineDraftsRef.current = drafts
    setRoutineDrafts(drafts)
  }

  const mergeRoutineDraftsIntoDays = (sourceDays: Day[]) => {
    const drafts = routineDraftsRef.current
    return JSON.parse(JSON.stringify(sourceDays)).map((day: Day) => ({
      ...day,
      workout_blocks: day.workout_blocks.map((block: Block) => ({
        ...block,
        description: drafts[block.id] ?? block.description ?? ''
      }))
    }))
  }

  const updateRoutineDraft = (blockId: string, value: string) => {
    const nextDrafts = { ...routineDraftsRef.current, [blockId]: value }
    routineDraftsRef.current = nextDrafts
    setRoutineDrafts(nextDrafts)
    setHasUnsavedChanges(true)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // 1. Handle Block Reordering
    if (active.data.current?.type === 'block') {
      const activeDIdx = active.data.current.dIdx
      if (activeId !== overId) {
        updateDays(prev => {
          const next = JSON.parse(JSON.stringify(prev))
          const blockIds = next[activeDIdx].workout_blocks.map((b: any) => b.id)
          const oldIndex = blockIds.indexOf(activeId)
          
          let newIndex = blockIds.indexOf(overId)
          if (newIndex === -1 && overId.startsWith('block-')) {
             newIndex = parseInt(overId.split('-')[2])
          }
          
          if (oldIndex !== -1 && newIndex !== -1) {
            next[activeDIdx].workout_blocks = arrayMove(next[activeDIdx].workout_blocks, oldIndex, newIndex)
          }
          return next
        })
      }
      return
    }

    // 2. Handle Library Item Drop
    if (active.data.current?.type === 'library-item') {
      let overDIdx = -1, overBIdx = -1, overMIdx = -1
      if (overId.startsWith('block-')) {
        const parts = overId.split('-')
        overDIdx = parseInt(parts[1])
        overBIdx = parseInt(parts[2])
        overMIdx = days[overDIdx].workout_blocks[overBIdx].workout_movements.length
      } else {
        days.forEach((d, di) => {
          d.workout_blocks.forEach((b, bi) => {
            const mi = b.workout_movements.findIndex(m => m.id === overId)
            if (mi !== -1) { overDIdx = di; overBIdx = bi; overMIdx = mi; }
          })
        })
      }
      if (overDIdx !== -1) {
        const exercise = active.data.current.exercise
        addMovement(overDIdx, overBIdx, exercise, overMIdx)
      }
      return
    }

    // 3. Handle Movement Sorting/Moving
    let activeDIdx = -1, activeBIdx = -1, activeMIdx = -1
    days.forEach((d, di) => {
      d.workout_blocks.forEach((b, bi) => {
        const mi = b.workout_movements.findIndex(m => m.id === activeId)
        if (mi !== -1) { activeDIdx = di; activeBIdx = bi; activeMIdx = mi; }
      })
    })

    if (activeDIdx !== -1) {
      let overDIdx = -1, overBIdx = -1, overMIdx = -1
      if (overId.startsWith('block-')) {
        const parts = overId.split('-')
        overDIdx = parseInt(parts[1])
        overBIdx = parseInt(parts[2])
        overMIdx = days[overDIdx].workout_blocks[overBIdx].workout_movements.length
      } else {
        days.forEach((d, di) => {
          d.workout_blocks.forEach((b, bi) => {
            const mi = b.workout_movements.findIndex(m => m.id === overId)
            if (mi !== -1) { overDIdx = di; overBIdx = bi; overMIdx = mi; }
          })
        })
      }

      if (overDIdx !== -1) {
        updateDays(prev => {
          const next = JSON.parse(JSON.stringify(prev))
          const [moved] = next[activeDIdx].workout_blocks[activeBIdx].workout_movements.splice(activeMIdx, 1)
          next[overDIdx].workout_blocks[overBIdx].workout_movements.splice(overMIdx, 0, moved)
          return next
        })
      }
    }
  }

  const removeWeek = (weekNum: number) => {
    const remaining = days.filter(d => d.week_number !== weekNum)
    // Renumber remaining weeks to keep 1,2,3... sequential
    const weeks = Array.from(new Set(remaining.map(d => d.week_number || 1))).sort((a, b) => a - b)
    const renumbered = remaining.map(d => ({
      ...d,
      week_number: weeks.indexOf(d.week_number) + 1,
    }))
    updateDays(renumbered)
    const next = weeks.find(w => w !== weekNum) ?? weeks[0]
    setActiveWeek((next ? (weeks.indexOf(next) + 1) : 1).toString())
  }

  const addDay = (weekNum: number) => {
    const weekDays = days.filter(d => d.week_number === weekNum)
    const nextDayNum = weekDays.length + 1
    const newDay: Day = { 
      id: genId(), 
      week_number: weekNum, 
      day_of_week: nextDayNum, 
      title: `Entrenamiento ${nextDayNum}`, 
      is_published: true,
      workout_blocks: [] 
    }
    updateDays([...days, newDay])
  }

  const addWeek = () => {
    const nextWeek = Math.max(0, ...days.map(d => d.week_number || 1)) + 1
    updateDays([...days, { 
      id: genId(), 
      week_number: nextWeek, 
      day_of_week: 1, 
      title: 'Entrenamiento 1', 
      is_published: true,
      workout_blocks: [] 
    }])
    setActiveWeek(nextWeek.toString())
  }

  const addBlock = (dayId: string) => {
    updateDays((prev: Day[]) => {
      const n: Day[] = JSON.parse(JSON.stringify(prev))
      const idx = n.findIndex((d: Day) => d.id === dayId)
      if (idx === -1) return prev
      const blockCount = n[idx].workout_blocks.length
      const blockLetter = String.fromCharCode(65 + blockCount)
      n[idx].workout_blocks.push({ 
        id: genId(), 
        name: `Bloque ${blockLetter}`, 
        type: 'strength', 
        description: '',
        workout_movements: [] 
      })
      return n
    })
  }

  const addMovement = (dIdx: number, bIdx: number, exercise: Exercise, atIdx?: number, sets: number = 3) => {
    updateDays((prev: Day[]) => {
      const n: Day[] = JSON.parse(JSON.stringify(prev))
      const block = n[dIdx].workout_blocks[bIdx]
      const newMov = {
        id: genId(),
        exercise_id: exercise.id,
        sets,
        reps: '10',
        weight_percentage: '',
        notes: '',
        order_index: block.workout_movements.length,
        exercise: exercise
      }
      if (typeof atIdx === 'number') {
        block.workout_movements.splice(atIdx, 0, newMov)
      } else {
        block.workout_movements.push(newMov)
      }
      return n
    })
  }

  const removeBlock = (dayId: string, bIdx: number) => {
    updateDays((prev: Day[]) => {
      const n: Day[] = JSON.parse(JSON.stringify(prev))
      const idx = n.findIndex((d: Day) => d.id === dayId)
      if (idx !== -1) {
        n[idx].workout_blocks.splice(bIdx, 1)
      }
      return n
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const daysToSave = mergeRoutineDraftsIntoDays(daysRef.current)
      daysRef.current = daysToSave
      const res = await savePlanStructure(planId, daysToSave, planMeta)
      if (res.success && res.days) {
        const processedDays = processInitialDays(res.days)
        const hydratedDays = mergeRoutineDraftsIntoDays(processedDays)
        daysRef.current = hydratedDays
        setDays(hydratedDays)
        rebuildRoutineDrafts(hydratedDays)
        setHasUnsavedChanges(false)
        alert('¡Planificación guardada con éxito!')
      } else {
        throw new Error(res.error || 'No se recibió la estructura actualizada')
      }
    } catch (e: any) {
      console.error(e)
      alert(`Error al guardar: ${e.message || 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredLibrary = library.filter(ex => 
    ex.name.toLowerCase().includes(libSearch.toLowerCase()) ||
    (ex.category || '').toLowerCase().includes(libSearch.toLowerCase())
  )

  const confirmBlockDescription = async (blockId: string, description: string) => {
    setEditingBlocks(prev => ({ ...prev, [blockId]: false }))

    if (blockId.length < 15) return

    const latestDescription = routineDraftsRef.current[blockId] ?? description ?? ''
    updateRoutineDraft(blockId, latestDescription)

    try {
      const res = await updateBlockDescription(blockId, latestDescription)
      if (!res.success) throw new Error(res.error || 'No se pudo guardar el texto')
      if (typeof res.description === 'string') updateRoutineDraft(blockId, res.description)
    } catch (e: any) {
      console.error(e)
      setEditingBlocks(prev => ({ ...prev, [blockId]: true }))
      alert(`Error al guardar el texto de la rutina: ${e.message || 'Error desconocido'}`)
    }
  }

  const currentWeekDays = days.filter(d => d.week_number === parseInt(activeWeek))
  const isWeekPublished = currentWeekDays.every(d => d.is_published)
  const totalWeeks = Array.from(new Set(days.map(d => d.week_number || 1))).sort((a,b) => a-b)

  const handleToggleWeekPublish = async () => {
    const newStatus = !isWeekPublished
    // Optimistic update
    const n = days.map(d => d.week_number === parseInt(activeWeek) ? { ...d, is_published: newStatus } : d)
    daysRef.current = n
    setDays(n)
    
    try {
      await toggleWeekStatus(planId, parseInt(activeWeek), newStatus)
    } catch (e) {
      console.error(e)
      alert('Error al actualizar estado de la semana')
      // Rollback
      daysRef.current = days
      setDays(days)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 xl:grid-cols-[20rem_minmax(0,1fr)] gap-4 items-start overflow-visible">
        
        {/* ── Sidebar: Library ── */}
        <aside className="w-full xl:w-80 xl:max-w-80 flex flex-col ios-panel shrink-0 overflow-hidden relative z-20 h-[360px] xl:h-[calc(100dvh-11rem)] xl:min-h-[460px]">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-4 p-4 border-b border-border/60">
            <div>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className={`w-full gap-3 font-black uppercase tracking-[0.16em] text-[10px] h-12 rounded-2xl transition-all relative ${
                  hasUnsavedChanges 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_16px_34px_rgba(147,213,0,0.20)] ring-2 ring-primary/30 ring-offset-2 ring-offset-background' 
                    : 'bg-secondary/70 hover:bg-secondary text-muted-foreground shadow-none border border-border/70'
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Guardando...' : 'Guardar Planificación'}
                {hasUnsavedChanges && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-black"></span>
                  </div>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase text-foreground">Biblioteca</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Arrastra o copia etiquetas</p>
                </div>
                <Badge variant="outline" className="text-[8px] font-black border-border/70 text-muted-foreground">{library.length} items</Badge>
              </div>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar ejercicio..." 
                className="h-11 bg-background/55 border-border/70 rounded-2xl pl-10 text-sm focus:ring-primary/20 transition-all"
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 relative z-10 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            <div className="p-4 space-y-2">
              {filteredLibrary.map((ex) => (
                <LibraryItem key={ex.id} exercise={ex} />
              ))}
              {filteredLibrary.length === 0 && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/60 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 text-muted-foreground/20" />
                  </div>
                  <p className="text-xs text-muted-foreground/40 font-medium italic">No se encontraron resultados</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative z-10 p-3 bg-background/35 border-t border-border/60">
            <p className="text-[9px] text-center text-muted-foreground uppercase font-bold">{filteredLibrary.length} ejercicios disponibles</p>
          </div>
        </aside>

        {/* ── Main Workspace ── */}
        <main className="flex flex-col gap-4 overflow-visible min-w-0">
          
          {/* Header & Week Tabs */}
          <div className="ios-panel p-4 md:p-5 space-y-5 shrink-0 overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)]" />
            
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Layout className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-3 w-full min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                  <div className="space-y-1.5 flex-1 group/title relative">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Título del Programa</Label>
                    <Input 
                      className="bg-background/55 border-border/70 hover:border-primary/40 focus:border-primary h-11 rounded-xl text-base md:text-lg font-black tracking-tight transition-all"
                      value={planMeta.title}
                      placeholder="Ej: Programa de Fuerza Pro..."
                      onChange={(e) => setPlanMeta({...planMeta, title: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-background/55 p-3 rounded-2xl border border-border/70 self-start lg:self-auto shrink-0">
                    <Switch 
                      id="community-mode" 
                      checked={planMeta.is_community_enabled}
                      onCheckedChange={(checked) => setPlanMeta({...planMeta, is_community_enabled: checked})}
                    />
                    <Label htmlFor="community-mode" className="text-[9px] font-black uppercase tracking-widest cursor-pointer select-none whitespace-nowrap">
                      Feed comunitario {planMeta.is_community_enabled ? 'ON' : 'OFF'}
                    </Label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Descripción y Objetivos</Label>
                  <Input 
                    className="bg-background/45 border-border/60 hover:border-primary/30 focus:border-primary/50 h-10 rounded-xl text-sm font-medium transition-all"
                    value={planMeta.description}
                    placeholder="Añade una descripción corta del programa..."
                    onChange={(e) => setPlanMeta({...planMeta, description: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={addWeek} className="gap-2 font-black uppercase tracking-widest text-[10px] h-11 rounded-2xl px-5 shrink-0">
                <Plus className="w-4 h-4" /> Nueva Semana
              </Button>
            </div>

            {/* Plan overview: weeks × weekdays grid (at-a-glance) */}
            {totalWeeks.length > 0 && (
              <div className="pt-4 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vista general del plan</span>
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-primary" /> Con ejercicios</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500/60" /> Vacío</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-secondary border border-border/50" /> Sin día</span>
                  </div>
                </div>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: 'minmax(70px, auto) repeat(7, minmax(0, 1fr))' }}>
                  <div />
                  {['L','M','X','J','V','S','D'].map((d, i) => (
                    <div key={i} className="text-[9px] font-black uppercase text-center text-muted-foreground/60">{d}</div>
                  ))}
                  {totalWeeks.map(w => (
                    <div key={w} className="contents">
                      <button
                        type="button"
                        onClick={() => setActiveWeek(w.toString())}
                        className={cn(
                          'text-[10px] font-black uppercase tracking-widest text-left transition-colors px-2 py-1.5 rounded-lg',
                          parseInt(activeWeek) === w ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Sem {w}
                      </button>
                      {[1,2,3,4,5,6,7].map(dow => {
                        const dayObj = days.find(d => d.week_number === w && d.day_of_week === dow)
                        const hasBlocks = dayObj && dayObj.workout_blocks.length > 0
                        const isEmpty = dayObj && !hasBlocks
                        return (
                          <button
                            key={dow}
                            type="button"
                            onClick={() => setActiveWeek(w.toString())}
                            title={dayObj ? `${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][dow-1]} · ${dayObj.workout_blocks.length} bloques` : 'Sin día'}
                            className={cn(
                              'h-7 rounded-md transition-all',
                              hasBlocks && 'bg-primary hover:opacity-90',
                              isEmpty && 'bg-amber-500/40 hover:bg-amber-500/60',
                              !dayObj && 'bg-secondary/50 border border-border/50 hover:bg-secondary'
                            )}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between w-full pt-4 border-t border-border/60">
              <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full lg:w-auto min-w-0">
                <TabsList className="bg-background/55 p-1.5 rounded-2xl h-auto min-h-12 border border-border/70 w-full lg:w-auto justify-start overflow-x-auto overflow-y-hidden">
                  {totalWeeks.map(w => {
                    const isWPublished = days.filter(d => d.week_number === w).every(d => d.is_published)
                    return (
                      <div key={w} className="flex items-center gap-0.5 group/weektab">
                        <TabsTrigger
                          value={w.toString()}
                          className="rounded-xl font-black uppercase tracking-widest text-[10px] px-4 md:px-5 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                          Semana {w}
                          {!isWPublished && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] h-5 px-2 rounded-lg font-black uppercase">Draft</Badge>
                          )}
                        </TabsTrigger>
                        {totalWeeks.length > 1 && (
                          <button
                            type="button"
                            title={`Eliminar Semana ${w}`}
                            onClick={() => { if (confirm(`¿Eliminar Semana ${w} y todos sus días?`)) removeWeek(w) }}
                            className="w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover/weektab:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </TabsList>
              </Tabs>

              <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:items-center gap-3 bg-background/45 p-3 rounded-2xl border border-border/70">
                <div className="flex flex-col sm:items-end px-1 sm:px-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Visibilidad semana {activeWeek}</span>
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-widest mt-0.5",
                    isWeekPublished ? "text-primary" : "text-amber-500"
                  )}>
                    {isWeekPublished ? 'Pública para Atletas' : 'Borrador Privado'}
                  </span>
                </div>
                <Button 
                  onClick={handleToggleWeekPublish}
                  variant={isWeekPublished ? "outline" : "default"}
                  className={cn(
                    "h-11 rounded-2xl px-5 font-black uppercase tracking-widest text-[10px] gap-3 transition-all sm:ml-auto",
                    isWeekPublished ? "border-border/70 hover:bg-secondary" : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                  )}
                >
                  {isWeekPublished ? (
                    <><EyeOff className="w-4 h-4" /> Ocultar Semana</>
                  ) : (
                    <><Eye className="w-4 h-4" /> Publicar Semana</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="overflow-visible pr-1 xl:pr-2">
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 pb-24">
              {currentWeekDays.map((day) => {
                const globalDIdx = days.findIndex(d => d.id === day.id)
                return (
                  <div key={day.id} className="flex flex-col gap-5 ios-panel p-4 md:p-5 hover:border-primary/30 transition-all group/day relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)] opacity-75" />
                    
                    {/* Day Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
                        <select
                          value={day.day_of_week}
                          onChange={(e) => {
                            const n: Day[] = JSON.parse(JSON.stringify(days))
                            n[globalDIdx].day_of_week = parseInt(e.target.value)
                            updateDays(n)
                          }}
                          className="h-9 px-3 bg-primary/10 border border-primary/20 text-primary font-black rounded-2xl text-[11px] shrink-0 uppercase tracking-[0.12em] focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                        >
                          {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((name, i) => (
                            <option key={i + 1} value={i + 1} className="bg-background text-foreground normal-case">{name}</option>
                          ))}
                        </select>
                        <div className="flex-1 space-y-1 min-w-0">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Título visible del entrenamiento</Label>
                          <Input 
                            placeholder="Ej: Tren superior, WOD largo, Descanso activo..."
                            className="bg-background/55 border-border/70 h-10 focus:border-primary/40 font-black text-sm tracking-tight truncate w-full rounded-xl"
                            value={day.title}
                            onChange={(e) => {
                              const n = [...days]; n[globalDIdx].title = e.target.value; updateDays(n);
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => addBlock(day.id)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="rounded-xl hover:text-destructive" onClick={() => updateDays(days.filter(d => d.id !== day.id))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Blocks in Day */}
                    <SortableContext items={day.workout_blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {day.workout_blocks.map((block, bIdx) => (
                          <SortableBlock 
                            key={block.id} 
                            id={block.id} 
                            block={block} 
                            onRemove={() => removeBlock(day.id, bIdx)}
                            onRename={(val: string) => {
                              updateDays((prev: Day[]) => {
                                const n = JSON.parse(JSON.stringify(prev))
                                const dIdx = n.findIndex((d: Day) => d.id === day.id)
                                const bIdx = n[dIdx].workout_blocks.findIndex((b: any) => b.id === block.id)
                                if (dIdx !== -1 && bIdx !== -1) {
                                  n[dIdx].workout_blocks[bIdx].name = val
                                }
                                return n
                              })
                            }}
                            onTypeChange={(val: string) => {
                              updateDays((prev: Day[]) => {
                                const n = JSON.parse(JSON.stringify(prev))
                                const dIdx = n.findIndex((d: Day) => d.id === day.id)
                                const bIdx = n[dIdx].workout_blocks.findIndex((b: any) => b.id === block.id)
                                if (dIdx !== -1 && bIdx !== -1) {
                                  n[dIdx].workout_blocks[bIdx].type = val
                                }
                                return n
                              })
                            }}
                          >
                            <DroppableBlock id={`block-${globalDIdx}-${bIdx}`} className="min-h-[60px] p-1 md:p-2">
                              {/* Routine Description Area */}
                              <div className="mb-4 space-y-3 rounded-2xl border border-[var(--gymnastics)]/20 bg-[var(--gymnastics)]/5 p-3 md:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--gymnastics)] flex items-center gap-2">
                                      <Edit3 className="w-3 h-3" /> Rutina libre del WOD
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground font-semibold mt-1 leading-relaxed max-w-2xl">
                                      Usa este cuadro para partes variables: rounds, formatos, notas del coach o listas tipo "10 pull ups, 20 wall balls". Al insertar un ejercicio de la biblioteca queda como etiqueta con video para el alumno.
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Popover>
                                      <PopoverTrigger render={
                                        <Button variant="ghost" size="sm" className={cn(
                                          "h-7 px-3 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl transition-all",
                                          block.timer_type ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-primary"
                                        )}>
                                          <TimerIcon className="w-3 h-3" /> {block.timer_type ? block.timer_type.replace('_', ' ') : 'Sin Crono'}
                                        </Button>
                                      } />
                                      <PopoverContent className="w-64 p-4 rounded-2xl border-border/40 shadow-2xl" align="end">
                                        <div className="space-y-4">
                                          <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Cronómetro</Label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                              {[
                                                { id: null, label: 'Ninguno' },
                                                { id: 'amrap', label: 'AMRAP' },
                                                { id: 'for_time', label: 'For Time' },
                                                { id: 'emom', label: 'EMOM' },
                                                { id: 'tabata', label: 'Tabata' }
                                              ].map(t => (
                                                <Button
                                                  key={t.id || 'none'}
                                                  variant={block.timer_type === t.id ? 'default' : 'secondary'}
                                                  size="sm"
                                                  className="h-8 text-[9px] font-bold uppercase rounded-xl"
                                                  onClick={() => {
                                                    const n = JSON.parse(JSON.stringify(days))
                                                    n[globalDIdx].workout_blocks[bIdx].timer_type = t.id
                                                    // Default configs
                                                    if (t.id === 'amrap') n[globalDIdx].workout_blocks[bIdx].timer_config = { minutes: 15 }
                                                    if (t.id === 'emom') n[globalDIdx].workout_blocks[bIdx].timer_config = { rounds: 10 }
                                                    if (t.id === 'tabata') n[globalDIdx].workout_blocks[bIdx].timer_config = { rounds: 8, work: 20, rest: 10 }
                                                    updateDays(n)
                                                  }}
                                                >
                                                  {t.label}
                                                </Button>
                                              ))}
                                            </div>
                                          </div>

                                          {block.timer_type && (
                                            <div className="space-y-3 pt-3 border-t border-border/10">
                                              {block.timer_type === 'amrap' && (
                                                <div className="space-y-1.5">
                                                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Tiempo (Minutos)</Label>
                                                  <Input 
                                                    type="number" 
                                                    className="h-9 text-xs rounded-xl" 
                                                    value={block.timer_config?.minutes || 15}
                                                    onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, minutes: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }}
                                                  />
                                                </div>
                                              )}
                                              {block.timer_type === 'emom' && (
                                                <div className="space-y-1.5">
                                                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Minutos Totales</Label>
                                                  <Input 
                                                    type="number" 
                                                    className="h-9 text-xs rounded-xl" 
                                                    value={block.timer_config?.rounds || 10}
                                                    onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, rounds: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }}
                                                  />
                                                </div>
                                              )}
                                              {block.timer_type === 'tabata' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                  <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Rondas</Label>
                                                    <Input type="number" className="h-9 text-xs rounded-xl" value={block.timer_config?.rounds || 8} onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, rounds: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }} />
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Trabajo (seg)</Label>
                                                    <Input type="number" className="h-9 text-xs rounded-xl" value={block.timer_config?.work || 20} onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, work: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }} />
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Descanso (seg)</Label>
                                                    <Input type="number" className="h-9 text-xs rounded-xl" value={block.timer_config?.rest || 10} onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, rest: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }} />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    <Popover open={openPopoverId === block.id} onOpenChange={(open) => setOpenPopoverId(open ? block.id : null)}>
                                      <PopoverTrigger render={
                                        <Button variant="outline" size="sm" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl border-[var(--gymnastics)]/25 text-[var(--gymnastics)] hover:bg-[var(--gymnastics)]/10 transition-all">
                                          <Video className="w-3 h-3" /> Añadir Ejercicio
                                        </Button>
                                      } />
                                      <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0 rounded-2xl overflow-hidden border-border/70 shadow-2xl bg-card" align="end">
                                        <div className="p-4 border-b border-border/60 bg-background/35">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Inserta una etiqueta con video</p>
                                          <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <Input
                                              placeholder="Buscar ejercicio..."
                                              className="h-10 text-xs pl-9 bg-background/55 border-border/70 rounded-xl"
                                              onChange={(e) => setLibSearch(e.target.value)}
                                              value={libSearch}
                                              autoFocus
                                            />
                                          </div>
                                        </div>
                                        <div className="h-72 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                                          <div className="p-2 space-y-1">
                                            {filteredLibrary.map(ex => (
                                              <button
                                                key={ex.id}
                                                type="button"
                                                className="w-full text-left px-3 py-3 text-[10px] font-bold hover:bg-[var(--gymnastics)]/10 rounded-xl transition-all flex items-center justify-between gap-3 group"
                                                onClick={() => {
                                                  const tagName = `[${ex.name}]`
                                                  const currentDesc = routineDraftsRef.current[block.id] ?? block.description ?? ''
                                                  updateRoutineDraft(block.id, currentDesc + (currentDesc ? '\n' : '') + tagName)
                                                  setOpenPopoverId(null)
                                                  setEditingBlocks(prev => ({ ...prev, [block.id]: true }))
                                                }}
                                              >
                                                <div className="min-w-0">
                                                  <span className="block uppercase tracking-tight text-foreground truncate">{ex.name}</span>
                                                  <span className="block text-[8px] opacity-40 font-black uppercase tracking-widest">{ex.category || 'General'}</span>
                                                </div>
                                                <div className="w-7 h-7 rounded-lg bg-[var(--gymnastics)]/10 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                                                  <Plus className="w-3.5 h-3.5 text-[var(--gymnastics)]" />
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    {editingBlocks[block.id] === false && (routineDrafts[block.id] || block.description) && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-3 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl text-muted-foreground hover:text-primary transition-all"
                                        onClick={() => setEditingBlocks(prev => ({ ...prev, [block.id]: true }))}
                                      >
                                        <Edit3 className="w-3 h-3" /> Editar rutina
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {((editingBlocks[block.id] ?? true) || !(routineDrafts[block.id] || block.description)) ? (
                                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="relative group">
                                      <Textarea 
                                        placeholder={"Ejemplo:\nAMRAP 12'\n10 [Pull Up]\n20 [Wall Ball]\n30 DU\n\nNotas: mantener ritmo sostenible y grabar última ronda si hay dudas técnicas."}
                                        className="min-h-[180px] bg-background/55 border border-border/70 focus:border-primary/40 text-[15px] font-semibold leading-relaxed resize-y rounded-2xl p-4 transition-all"
                                        value={routineDrafts[block.id] ?? block.description ?? ''}
                                        onFocus={() => setEditingBlocks(prev => ({ ...prev, [block.id]: true }))}
                                        onChange={(e) => updateRoutineDraft(block.id, e.target.value)}
                                      />
                                      <div className="absolute top-4 right-4 flex gap-2">
                                         <div className="px-2 py-1 bg-primary/10 border border-primary/20 rounded-md text-[8px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                           Rutina libre
                                         </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-1">
                                      <p className="text-[10px] text-muted-foreground font-medium italic">Puedes escribir sin confirmar. Usa vista previa solo para revisar etiquetas y videos; Guardar planificación persiste todo.</p>
                                      <Button 
                                        size="sm" 
                                        variant="default" 
                                        className="h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest px-5 gap-2"
                                        onClick={() => confirmBlockDescription(block.id, routineDraftsRef.current[block.id] ?? block.description ?? '')}
                                      >
                                        <CheckCircle2 className="w-4 h-4" /> Ver preview
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group relative">
                                    <div className="p-4 bg-background/55 border border-border/70 rounded-2xl hover:border-primary/30 transition-all cursor-pointer"
                                         onClick={() => setEditingBlocks(prev => ({ ...prev, [block.id]: true }))}>
                                      <SmartRoutineText 
                                        text={routineDrafts[block.id] ?? block.description ?? ''} 
                                        exercises={library} 
                                        blockExercises={block.workout_movements.map((m: any) => m.exercise)}
                                        onVideoClick={(url) => window.open(url, '_blank')}
                                      />
                                      
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-background/45 rounded-2xl backdrop-blur-[1px]">
                                         <div className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                                            <Edit3 className="w-3 h-3" /> Editar rutina
                                         </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <p className="text-[8px] text-muted-foreground font-medium italic px-1">
                                  Este texto es para rutinas libres y formatos variables. Los movimientos estructurados de abajo son opcionales y sirven para series, reps y cargas medibles.
                                </p>
                              </div>

                              <div className="border-t border-border/60 pt-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Movimientos estructurados</Label>
                                <span className="text-[8px] font-medium text-muted-foreground/30 italic">(Opcional: Series/Reps)</span>
                              </div>

                              <SortableContext items={block.workout_movements.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                  {block.workout_movements.map((mov, mIdx) => (
                                    <SortableMovement 
                                      key={mov.id} 
                                      id={mov.id} 
                                      mov={mov} 
                                      mIdx={mIdx}
                                      updateSets={(val: string) => {
                                        updateDays((prev: Day[]) => {
                                          const n = JSON.parse(JSON.stringify(prev))
                                          const dIdx = n.findIndex((d: Day) => d.id === day.id)
                                          const bIdx = n[dIdx].workout_blocks.findIndex((b: any) => b.id === block.id)
                                          if (dIdx !== -1 && bIdx !== -1) {
                                            n[dIdx].workout_blocks[bIdx].workout_movements[mIdx].sets = parseInt(val) || 0
                                          }
                                          return n
                                        })
                                      }}
                                      updateReps={(val: string) => {
                                        updateDays((prev: Day[]) => {
                                          const n = JSON.parse(JSON.stringify(prev))
                                          const dIdx = n.findIndex((d: Day) => d.id === day.id)
                                          const bIdx = n[dIdx].workout_blocks.findIndex((b: any) => b.id === block.id)
                                          if (dIdx !== -1 && bIdx !== -1) {
                                            n[dIdx].workout_blocks[bIdx].workout_movements[mIdx].reps = val
                                          }
                                          return n
                                        })
                                      }}
                                      updateWeight={(val: string) => {
                                        updateDays((prev: Day[]) => {
                                          const n = JSON.parse(JSON.stringify(prev))
                                          const dIdx = n.findIndex((d: Day) => d.id === day.id)
                                          const bIdx = n[dIdx].workout_blocks.findIndex((b: any) => b.id === block.id)
                                          if (dIdx !== -1 && bIdx !== -1) {
                                            n[dIdx].workout_blocks[bIdx].workout_movements[mIdx].weight_percentage = val
                                          }
                                          return n
                                        })
                                      }}
                                      removeMov={() => {
                                        updateDays((prev: Day[]) => {
                                          const n = JSON.parse(JSON.stringify(prev))
                                          const dIdx = n.findIndex((d: Day) => d.id === day.id)
                                          const bIdx = n[dIdx].workout_blocks.findIndex((b: any) => b.id === block.id)
                                          if (dIdx !== -1 && bIdx !== -1) {
                                            n[dIdx].workout_blocks[bIdx].workout_movements.splice(mIdx, 1)
                                          }
                                          return n
                                        })
                                      }}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                              
                              {/* Visual Drop Zone for Library Items */}
                              {block.workout_movements.length === 0 && (
                                <div className="py-6 flex flex-col items-center justify-center border border-dashed border-border/60 m-2 rounded-2xl pointer-events-none bg-background/25">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Arrastra ejercicios aquí</p>
                                </div>
                              )}
                            </DroppableBlock>
                          </SortableBlock>
                        ))}
                      </div>
                    </SortableContext>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full h-10 border border-dashed border-border/70 rounded-2xl hover:bg-primary/5 hover:text-primary hover:border-primary/30 text-[9px] font-black uppercase tracking-[0.16em] transition-all text-muted-foreground"
                      onClick={() => addBlock(day.id)}
                    >
                      <Plus className="w-3 h-3 mr-2" /> Añadir Bloque
                    </Button>
                  </div>
                )
              })}
              
              {/* Add Day Button Placeholder */}
              <Button 
                variant="ghost" 
                className="h-[180px] border border-dashed border-border/70 rounded-[28px] hover:bg-primary/5 hover:text-primary hover:border-primary/30 group flex flex-col gap-3 transition-all ios-panel"
                onClick={() => addDay(parseInt(activeWeek))}
              >
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-primary">Añadir Día {currentWeekDays.length + 1}</span>
              </Button>
            </div>
          </div>
        </main>
      </div>

    </DndContext>
  )
}
