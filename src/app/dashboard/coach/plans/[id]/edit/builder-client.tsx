'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Plus, Trash2, Dumbbell, Save, Loader2, 
  Search, X, Calendar, Layout, Edit3,
  GripHorizontal, ChevronRight, Hash, Info, Video,
  Eye, EyeOff, CheckCircle2, Timer as TimerIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { savePlanStructure, toggleWeekStatus } from '../../actions'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { SmartRoutineText } from '@/components/workout/smart-routine-text'

// Types
type Exercise = { id: string, name: string, category: string, difficulty_level: string }
type Movement = { id: string, exercise_id: string, exercise?: Exercise, sets: number, reps: string, weight_percentage: string, notes: string }
type Block = { id: string, name: string, type: string, description?: string, workout_movements: Movement[], timer_type?: string, timer_config?: any }
type Day = { id: string, day_of_week: number, title: string, week_number: number, is_published: boolean, workout_blocks: Block[] }

const genId = () => Math.random().toString(36).substr(2, 9)

// Draggable Exercise Item for Sidebar
function DraggableExercise({ exercise }: { exercise: Exercise }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `lib-${exercise.id}`,
    data: { type: 'library-item', exercise }
  })
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className="p-3 mb-2 rounded-xl bg-card border border-border/40 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all group shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
          <Dumbbell className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase truncate">{exercise.name}</p>
          <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{exercise.category}</p>
        </div>
      </div>
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
        workout_movements: (b.workout_movements || []).map((m: any) => ({
          ...m,
          id: m.id || genId(),
          exercise: Array.isArray(m.exercises) ? m.exercises[0] : (m.exercises || m.exercise)
        }))
      }))
    }))
  }

  const [days, setDays] = useState<Day[]>(processInitialDays(initialDays))
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

  // Immutable state update helper
  const updateDays = (updater: Day[] | ((prev: Day[]) => Day[])) => {
    setDays(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // Robust debug log to track description persistence
      console.log('DAYS UPDATED - DESC CHECK:', next.map(d => d.workout_blocks.map(b => b.description?.substring(0, 10))))
      return next
    })
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
      const res = await savePlanStructure(planId, days, planMeta)
      if (res.success && res.days) {
        setDays(processInitialDays(res.days))
        setHasUnsavedChanges(false)
        alert('¡Planificación guardada con éxito!')
      } else {
        throw new Error('No se recibió la estructura actualizada')
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
    ex.category.toLowerCase().includes(libSearch.toLowerCase())
  )

  const currentWeekDays = days.filter(d => d.week_number === parseInt(activeWeek))
  const isWeekPublished = currentWeekDays.every(d => d.is_published)
  const totalWeeks = Array.from(new Set(days.map(d => d.week_number || 1))).sort((a,b) => a-b)

  const handleToggleWeekPublish = async () => {
    const newStatus = !isWeekPublished
    // Optimistic update
    const n = days.map(d => d.week_number === parseInt(activeWeek) ? { ...d, is_published: newStatus } : d)
    setDays(n)
    
    try {
      await toggleWeekStatus(planId, parseInt(activeWeek), newStatus)
    } catch (e) {
      console.error(e)
      alert('Error al actualizar estado de la semana')
      // Rollback
      setDays(days)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-6 overflow-hidden">
        
        {/* ── Sidebar: Library ── */}
        <aside className="w-85 flex flex-col gap-4 bg-[#111111] border-r border-white/5 p-5 shrink-0 shadow-2xl relative z-20">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 pb-4 border-b border-white/5">
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className={`w-full gap-2 font-black uppercase tracking-widest text-[10px] h-12 rounded-2xl transition-all relative ${
                hasUnsavedChanges 
                  ? 'bg-white text-black hover:bg-white/90 shadow-xl shadow-white/5 ring-2 ring-primary ring-offset-4 ring-offset-background' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground shadow-none'
              }`}
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Guardando...' : 'Guardar Planificación'}
              {hasUnsavedChanges && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-background animate-pulse" />}
            </Button>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Dumbbell className="w-3 h-3" /> Biblioteca
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium">Arrastra al bloque deseado.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
            <Input 
              placeholder="Buscar ejercicio..." 
              className="h-9 text-xs bg-background/50 border-border/20 pl-9 rounded-xl"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1 -mr-2 pr-2">
            <div className="space-y-1">
              {filteredLibrary.map(ex => (
                <DraggableExercise key={ex.id} exercise={ex} />
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* ── Main Workspace ── */}
        <main className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* Header & Week Tabs */}
          <div className="bg-[#161616] border border-white/5 rounded-[32px] p-8 space-y-8 shrink-0 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -z-10 group-hover:bg-primary/10 transition-colors duration-700" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Layout className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-1">
                  <Input 
                    className="text-xl font-black uppercase tracking-tight bg-transparent border-none p-0 h-auto focus-visible:ring-0 placeholder:opacity-20"
                    value={planMeta.title}
                    placeholder="NOMBRE DEL PLAN..."
                    onChange={(e) => setPlanMeta({...planMeta, title: e.target.value})}
                  />
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-full border border-border/20">
                    <Switch 
                      id="community-mode" 
                      checked={planMeta.is_community_enabled}
                      onCheckedChange={(checked) => setPlanMeta({...planMeta, is_community_enabled: checked})}
                    />
                    <Label htmlFor="community-mode" className="text-[9px] font-black uppercase tracking-widest cursor-pointer select-none">
                      Comunidad {planMeta.is_community_enabled ? 'ON' : 'OFF'}
                    </Label>
                  </div>
                </div>
                <Input 
                  className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-muted-foreground text-sm font-medium placeholder:opacity-20"
                  value={planMeta.description}
                  placeholder="Añade una descripción corta del programa..."
                  onChange={(e) => setPlanMeta({...planMeta, description: e.target.value})}
                />
              </div>
              <Button variant="outline" onClick={addWeek} className="gap-2 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl px-6 border-primary/20 text-primary hover:bg-primary/5">
                <Plus className="w-3.5 h-3.5" /> Nueva Semana
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
              <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full md:w-auto">
                <TabsList className="bg-secondary/20 p-1 rounded-xl h-12 border border-border/10 w-full md:w-auto justify-start overflow-x-auto overflow-y-hidden">
                  {totalWeeks.map(w => {
                    const isWPublished = days.filter(d => d.week_number === w).every(d => d.is_published)
                    return (
                      <TabsTrigger 
                        key={w} 
                        value={w.toString()}
                        className="rounded-lg font-black uppercase tracking-widest text-[10px] px-8 h-full data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all flex items-center gap-2"
                      >
                        Semana {w}
                        {!isWPublished && (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-4 px-1 rounded-md">Borrador</Badge>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-4 bg-secondary/10 p-2 rounded-2xl border border-border/5">
                <div className="flex flex-col items-end px-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">Estado Semana {activeWeek}</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isWeekPublished ? "text-primary" : "text-amber-500"
                  )}>
                    {isWeekPublished ? 'Publicada (Visible)' : 'Borrador (Oculta)'}
                  </span>
                </div>
                <Button 
                  onClick={handleToggleWeekPublish}
                  variant={isWeekPublished ? "outline" : "default"}
                  size="sm"
                  className={cn(
                    "h-10 rounded-xl px-4 font-black uppercase tracking-widest text-[9px] gap-2 transition-all",
                    !isWeekPublished && "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                  )}
                >
                  {isWeekPublished ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Ocultar Semana</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /> Publicar Semana</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <ScrollArea className="flex-1 -mr-4 pr-4 bg-[#0a0a0a]/50 p-6 rounded-[40px] border border-white/5 shadow-inner">
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 pb-12">
              {currentWeekDays.map((day) => {
                const globalDIdx = days.findIndex(d => d.id === day.id)
                return (
                  <div key={day.id} className="flex flex-col gap-6 bg-[#161616] rounded-[32px] p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-primary/20 transition-all group/day relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover/day:bg-primary transition-colors" />
                    
                    {/* Day Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                      <div className="flex items-center gap-5 min-w-0 flex-1">
                        <div className="px-5 py-2.5 bg-primary/10 border border-primary/20 text-primary font-black rounded-xl text-[11px] shrink-0 uppercase tracking-widest shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][(day.day_of_week - 1) % 7]}
                        </div>
                        <Input 
                          placeholder="Añadir subtítulo (ej: Pierna, Descanso...)"
                          className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 font-bold text-sm tracking-tight truncate w-full placeholder:opacity-30"
                          value={day.title}
                          onChange={(e) => {
                            const n = [...days]; n[globalDIdx].title = e.target.value; updateDays(n);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => addBlock(day.id)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:text-destructive" onClick={() => updateDays(days.filter(d => d.id !== day.id))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Blocks in Day */}
                    <SortableContext items={day.workout_blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-6">
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
                            <DroppableBlock id={`block-${globalDIdx}-${bIdx}`} className="min-h-[60px] p-4">
                              {/* Routine Description Area */}
                              <div className="mb-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Edit3 className="w-3 h-3" /> Entrenamiento / WOD
                                  </Label>
                                  <div className="flex items-center gap-2">
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
                                                  className="h-8 text-[9px] font-bold uppercase"
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
                                                    className="h-8 text-xs" 
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
                                                    className="h-8 text-xs" 
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
                                                    <Input type="number" className="h-8 text-xs" value={block.timer_config?.rounds || 8} onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, rounds: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }} />
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Trabajo (seg)</Label>
                                                    <Input type="number" className="h-8 text-xs" value={block.timer_config?.work || 20} onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, work: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }} />
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Descanso (seg)</Label>
                                                    <Input type="number" className="h-8 text-xs" value={block.timer_config?.rest || 10} onChange={e => {
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
                                    {!editingBlocks[block.id] && block.description && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-3 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl text-muted-foreground hover:text-primary transition-all"
                                        onClick={() => setEditingBlocks(prev => ({ ...prev, [block.id]: true }))}
                                      >
                                        <Edit3 className="w-3 h-3" /> Editar Texto
                                      </Button>
                                    )}
                                    {(editingBlocks[block.id] || !block.description) && (
                                      <Popover open={openPopoverId === block.id} onOpenChange={(open) => setOpenPopoverId(open ? block.id : null)}>
                                        <PopoverTrigger render={
                                          <Button variant="outline" size="sm" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl border-primary/20 text-primary hover:bg-primary/5 transition-all">
                                            <Video className="w-3 h-3" /> Vincular Video
                                          </Button>
                                        } />
                                        <PopoverContent className="w-72 p-0 rounded-2xl overflow-hidden border-border/40 shadow-2xl" align="end">
                                          <div className="p-3 border-b border-border/10 bg-secondary/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Busca para insertar link de video</p>
                                            <div className="relative">
                                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                                              <Input 
                                                placeholder="Buscar en biblioteca..." 
                                                className="h-9 text-xs pl-9 bg-background/50 border-border/20 rounded-xl" 
                                                onChange={(e) => setLibSearch(e.target.value)}
                                                value={libSearch}
                                                autoFocus
                                              />
                                            </div>
                                          </div>
                                          <ScrollArea className="h-64">
                                            <div className="p-1.5 space-y-0.5">
                                              {filteredLibrary.slice(0, 50).map(ex => (
                                                <button
                                                  key={ex.id}
                                                  className="w-full text-left px-3 py-2.5 text-[10px] font-bold hover:bg-primary/10 rounded-xl transition-all flex items-center justify-between group"
                                                  onClick={() => {
                                                    const tagName = `[${ex.name}]`
                                                    updateDays((prev: Day[]) => {
                                                      const n: Day[] = JSON.parse(JSON.stringify(prev))
                                                      const dIdx = n.findIndex((d: Day) => d.id === day.id)
                                                      const bIdx = n[dIdx].workout_blocks.findIndex((b: any) => b.id === block.id)
                                                      if (dIdx !== -1 && bIdx !== -1) {
                                                        const currentDesc = n[dIdx].workout_blocks[bIdx].description || ''
                                                        n[dIdx].workout_blocks[bIdx].description = currentDesc + (currentDesc ? '\n' : '') + tagName
                                                      }
                                                      return n
                                                    })
                                                    setOpenPopoverId(null)
                                                    setEditingBlocks(prev => ({ ...prev, [block.id]: true }))
                                                  }}
                                                >
                                                  <div className="flex flex-col">
                                                    <span className="uppercase tracking-tight">{ex.name}</span>
                                                    <span className="text-[8px] opacity-40 font-black">{ex.category}</span>
                                                  </div>
                                                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus className="w-3.5 h-3.5 text-primary" />
                                                  </div>
                                                </button>
                                              ))}
                                            </div>
                                          </ScrollArea>
                                        </PopoverContent>
                                      </Popover>
                                    )}
                                  </div>
                                </div>

                                {(editingBlocks[block.id] || !block.description) ? (
                                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Textarea 
                                      placeholder="Ej: AMRAP 15 min de:
    10 Pull Ups
    5 Snatch
    20 Box Jumps"
                                      className="min-h-[160px] bg-black/40 border border-white/10 text-sm font-medium leading-relaxed resize-none rounded-[16px] focus:ring-primary/20 p-4 shadow-inner text-white placeholder:text-white/10"
                                      value={block.description || ''}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        updateDays((prev: Day[]) => {
                                          const n = [...prev]
                                          const dIdx = n.findIndex(d => d.id === day.id)
                                          if (dIdx === -1) return prev
                                          const nextBlocks = [...n[dIdx].workout_blocks]
                                          const bIdx = nextBlocks.findIndex(b => b.id === block.id)
                                          if (bIdx === -1) return prev
                                          nextBlocks[bIdx] = { ...nextBlocks[bIdx], description: val }
                                          n[dIdx] = { ...n[dIdx], workout_blocks: nextBlocks }
                                          return n
                                        })
                                      }}
                                    />
                                    <div className="flex justify-end">
                                      <Button 
                                        size="sm" 
                                        variant="default" 
                                        className="h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest px-6 gap-2 bg-white text-black hover:bg-white/90 shadow-lg"
                                        onClick={() => setEditingBlocks(prev => ({ ...prev, [block.id]: false }))}
                                      >
                                        <CheckCircle2 className="w-4 h-4" /> Finalizar Edición
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-secondary/5 border border-border/10 rounded-[16px] group relative">
                                    <SmartRoutineText 
                                      text={block.description} 
                                      exercises={library} 
                                      blockExercises={block.workout_movements.map((m: any) => m.exercise)}
                                      onVideoClick={(url, name) => {
                                        // Preview video for coach too
                                        window.open(url, '_blank')
                                      }}
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 rounded-md bg-background/80 shadow-sm"
                                        onClick={() => setEditingBlocks(prev => ({ ...prev, [block.id]: true }))}
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <p className="text-[8px] text-muted-foreground/40 font-medium italic px-1">
                                  El alumno verá un icono de video <Video className="w-2 h-2 inline" /> junto a los nombres de ejercicios vinculados.
                                </p>
                              </div>

                              <div className="border-t border-border/10 pt-4 mb-2 flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Movimientos Estructurados</Label>
                                <span className="text-[8px] font-medium text-muted-foreground/30 italic">(Opcional: Series/Reps)</span>
                              </div>

                              <SortableContext items={block.workout_movements.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                <div className="divide-y divide-border/5">
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
                                <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-border/10 m-3 rounded-xl pointer-events-none">
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
                      className="w-full h-10 border border-dashed border-border/20 rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/30 text-[9px] font-black uppercase tracking-[0.2em] transition-all text-muted-foreground/40"
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
                className="h-[200px] border-2 border-dashed border-border/20 rounded-[32px] hover:bg-primary/5 hover:text-primary hover:border-primary/30 group flex flex-col gap-3 transition-all"
                onClick={() => addDay(parseInt(activeWeek))}
              >
                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-primary">Añadir Día {currentWeekDays.length + 1}</span>
              </Button>
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* Helper info on drag */}
      <div className="fixed bottom-6 right-6 bg-foreground text-background px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
        <Info className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest">Tip: Selecciona una semana y arrastra ejercicios a los bloques.</span>
      </div>
    </DndContext>
  )
}
