'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Plus, Trash2, Dumbbell, Save, Loader2, X,
  Search, Layout, Edit3,
  Hash, Video,
  Eye, EyeOff, CheckCircle2, Timer as TimerIcon,
  ChevronUp, ChevronDown, Copy
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { savePlanStructure, toggleWeekStatus, updateBlockDescription, createExerciseQuick } from '../../actions'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { SortableMovement } from './SortableMovement'
import { SortableBlock } from './SortableBlock'
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
  })
  
  const [activeWeek, setActiveWeek] = useState<string>('1')
  const [libSearch, setLibSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editingBlocks, setEditingBlocks] = useState<Record<string, boolean>>({})
  const [blockPickerOpen, setBlockPickerOpen] = useState<string | null>(null)
  const [blockPickerSearch, setBlockPickerSearch] = useState('')
  const [localExercises, setLocalExercises] = useState<Exercise[]>([])
  const [creatingExercise, setCreatingExercise] = useState(false)
  const [pickerSelectedIds, setPickerSelectedIds] = useState<Set<string>>(new Set())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createFormData, setCreateFormData] = useState({ tracking_type: 'weight_reps', video_url: '', description: '' })

  // Block wizard state — null = closed, else stores { dayId, step, blockData }
  const [blockWizard, setBlockWizard] = useState<{
    dayId: string
    step: 1 | 2
    blockType: string
    blockName: string
    timerType: string | null
  } | null>(null)

  useEffect(() => {
    routineDraftsRef.current = routineDrafts
  }, [routineDrafts])

  // Track changes to planMeta
  useEffect(() => {
    if (planMeta.title !== (initialPlan?.title || '') ||
        planMeta.description !== (initialPlan?.description || '')) {
      setHasUnsavedChanges(true)
    }
  }, [planMeta, initialPlan])

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

  const moveWeek = (weekNum: number, direction: 'up' | 'down') => {
    const sortedWeeks = Array.from(new Set(days.map(d => d.week_number || 1))).sort((a, b) => a - b)
    const idx = sortedWeeks.indexOf(weekNum)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sortedWeeks.length) return
    const newOrder = [...sortedWeeks]
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    const mapping: Record<number, number> = {}
    newOrder.forEach((originalWeek, newIdx) => { mapping[originalWeek] = newIdx + 1 })
    updateDays(prev => prev.map(d => ({ ...d, week_number: mapping[d.week_number] ?? d.week_number })))
    setActiveWeek((swapIdx + 1).toString())
  }

  const duplicateWeek = (weekNum: number) => {
    const newWeekNum = Math.max(0, ...days.map(d => d.week_number || 1)) + 1
    const weekDays = days.filter(d => d.week_number === weekNum)
    const newDays = weekDays.map(d => ({
      ...JSON.parse(JSON.stringify(d)),
      id: genId(),
      week_number: newWeekNum,
      is_published: true,
      workout_blocks: d.workout_blocks.map((b: Block) => ({
        ...JSON.parse(JSON.stringify(b)),
        id: genId(),
        workout_movements: b.workout_movements.map((m: Movement) => ({ ...JSON.parse(JSON.stringify(m)), id: genId() }))
      }))
    }))
    updateDays([...days, ...newDays])
    setActiveWeek(newWeekNum.toString())
  }

  const duplicateDay = (dayId: string) => {
    const day = days.find(d => d.id === dayId)
    if (!day) return
    const newDay = {
      ...JSON.parse(JSON.stringify(day)),
      id: genId(),
      title: `${day.title} (copia)`,
      workout_blocks: day.workout_blocks.map((b: Block) => ({
        ...JSON.parse(JSON.stringify(b)),
        id: genId(),
        workout_movements: b.workout_movements.map((m: Movement) => ({ ...JSON.parse(JSON.stringify(m)), id: genId() }))
      }))
    }
    updateDays([...days, newDay])
  }

  const openBlockWizard = (dayId: string) => {
    setBlockWizard({ dayId, step: 1, blockType: 'strength', blockName: '', timerType: null })
  }

  const confirmBlockWizard = () => {
    if (!blockWizard) return
    const { dayId, blockType, blockName, timerType } = blockWizard
    updateDays((prev: Day[]) => {
      const n: Day[] = JSON.parse(JSON.stringify(prev))
      const idx = n.findIndex((d: Day) => d.id === dayId)
      if (idx === -1) return prev
      const blockCount = n[idx].workout_blocks.length
      const defaultName = blockName.trim() || `Bloque ${String.fromCharCode(65 + blockCount)}`
      n[idx].workout_blocks.push({
        id: genId(),
        name: defaultName,
        type: blockType,
        timer_type: timerType ?? undefined,
        timer_config: timerType === 'amrap' ? { minutes: 15 } : timerType === 'emom' ? { rounds: 10 } : timerType === 'tabata' ? { rounds: 8, work: 20, rest: 10 } : {},
        description: '',
        workout_movements: [],
      })
      return n
    })
    setBlockWizard(null)
  }

  // kept for internal programmatic use (duplicate, etc.)
  const addBlock = (dayId: string) => openBlockWizard(dayId)

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

  const openBlockPicker = (blockId: string) => {
    setBlockPickerOpen(blockId)
    setBlockPickerSearch('')
    setCreatingExercise(false)
    setPickerSelectedIds(new Set())
    setShowCreateForm(false)
    setCreateFormData({ tracking_type: 'weight_reps', video_url: '', description: '' })
  }

  const closeBlockPicker = () => {
    setBlockPickerOpen(null)
    setBlockPickerSearch('')
    setCreatingExercise(false)
    setPickerSelectedIds(new Set())
    setShowCreateForm(false)
  }

  const togglePickerSelection = (id: string) => {
    setPickerSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const addSelectedExercises = (dIdx: number, bIdx: number) => {
    pickerSelectedIds.forEach(id => {
      const ex = allExercises.find(e => e.id === id)
      if (ex) addMovement(dIdx, bIdx, ex)
    })
    closeBlockPicker()
  }

  const handleQuickCreateExercise = async (dIdx: number, bIdx: number) => {
    const name = blockPickerSearch.trim()
    if (!name) return
    setCreatingExercise(true)
    try {
      const result = await createExerciseQuick(name, 'General', {
        tracking_type: createFormData.tracking_type,
        video_url: createFormData.video_url || undefined,
        description: createFormData.description || undefined,
      })
      if (result.exercise) {
        setLocalExercises(prev => [...prev, result.exercise!])
        addMovement(dIdx, bIdx, result.exercise!)
        closeBlockPicker()
      } else {
        alert(result.error || 'Error al crear ejercicio')
      }
    } finally {
      setCreatingExercise(false)
    }
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

  const allExercises = [...library, ...localExercises]
  const filteredLibrary = allExercises.filter(ex =>
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
    <>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 xl:grid-cols-[20rem_minmax(0,1fr)] gap-4 items-start overflow-visible">
        
        {/* ── Sidebar: Library ── */}
        <aside className="w-full xl:w-80 xl:max-w-80 flex flex-col ios-panel shrink-0 overflow-hidden relative z-20 h-[320px] xl:sticky xl:top-4 xl:h-[calc(100dvh-2rem)] xl:min-h-[400px]">
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
                <span className="text-[8px] font-black border border-border/70 text-muted-foreground px-2 py-1 rounded-full">{library.length}</span>
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
            </div>

            {/* Plan overview: weeks × weekdays grid */}
            {totalWeeks.length > 0 && (
              <div className="pt-4 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vista general del plan</span>
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-primary inline-block" /> Con ejercicios</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500/60 inline-block" /> Vacío</span>
                  </div>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'minmax(60px, auto) repeat(7, minmax(0, 1fr))' }}>
                  <div />
                  {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d, i) => (
                    <div key={i} className="text-[9px] font-black uppercase text-center text-muted-foreground/50">{d}</div>
                  ))}
                  {totalWeeks.map(w => (
                    <div key={w} className="contents">
                      <button
                        type="button"
                        onClick={() => setActiveWeek(w.toString())}
                        className={cn(
                          'text-[10px] font-black uppercase tracking-widest text-left transition-colors px-1 py-1 rounded-lg',
                          parseInt(activeWeek) === w ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        S{w}
                      </button>
                      {[1,2,3,4,5,6,7].map(dow => {
                        const dayObj = days.find(d => d.week_number === w && d.day_of_week === dow)
                        const hasBlocks = dayObj && dayObj.workout_blocks.length > 0
                        const isEmpty = dayObj && !hasBlocks
                        return (
                          <button
                            key={dow}
                            type="button"
                            onClick={() => {
                              setActiveWeek(w.toString())
                              if (dayObj) {
                                setTimeout(() => {
                                  document.getElementById(`day-${dayObj.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }, 50)
                              }
                            }}
                            title={dayObj ? `${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][dow-1]} · ${dayObj.workout_blocks.length} bloques` : 'Sin día'}
                            className={cn(
                              'h-6 rounded transition-all',
                              hasBlocks && 'bg-primary hover:opacity-80',
                              isEmpty && 'bg-amber-500/40 hover:bg-amber-500/60',
                              !dayObj && 'bg-secondary/40 border border-border/30 hover:bg-secondary'
                            )}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Week tabs + management row */}
            <div className="flex flex-col gap-3 w-full pt-4 border-t border-border/60">
              <div className="flex flex-wrap gap-2 items-center">
                {totalWeeks.map(w => {
                  const isWPublished = days.filter(d => d.week_number === w).every(d => d.is_published)
                  const isActive = parseInt(activeWeek) === w
                  return (
                    <div key={w} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveWeek(w.toString())}
                        className={cn(
                          'h-9 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 whitespace-nowrap transition-all border',
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                            : 'bg-background/55 text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        Semana {w}
                        {!isWPublished && (
                          <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[8px] h-4 px-1.5 rounded font-black uppercase leading-none flex items-center">Oculta</span>
                        )}
                      </button>
                      {totalWeeks.length > 1 && (
                        <button
                          type="button"
                          title={`Eliminar Semana ${w}`}
                          onClick={() => { if (confirm(`¿Eliminar Semana ${w} y todos sus días? Esta acción no se puede deshacer.`)) removeWeek(w) }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border border-border/50 hover:border-destructive/30 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={addWeek}
                  className="h-9 px-3 rounded-xl border border-dashed border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Semana
                </button>
              </div>

              {/* Active week controls */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">Sem {activeWeek}:</span>
                <button
                  type="button"
                  title="Mover semana hacia arriba"
                  disabled={parseInt(activeWeek) === totalWeeks[0]}
                  onClick={() => moveWeek(parseInt(activeWeek), 'up')}
                  className="h-7 px-2.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <ChevronUp className="w-3 h-3" /> Subir
                </button>
                <button
                  type="button"
                  title="Mover semana hacia abajo"
                  disabled={parseInt(activeWeek) === totalWeeks[totalWeeks.length - 1]}
                  onClick={() => moveWeek(parseInt(activeWeek), 'down')}
                  className="h-7 px-2.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <ChevronDown className="w-3 h-3" /> Bajar
                </button>
                <button
                  type="button"
                  title="Duplicar esta semana"
                  onClick={() => duplicateWeek(parseInt(activeWeek))}
                  className="h-7 px-2.5 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <Copy className="w-3 h-3" /> Duplicar
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isWeekPublished ? "text-primary" : "text-amber-500"
                  )}>
                    {isWeekPublished ? 'Visible para atletas' : 'Oculta para atletas'}
                  </span>
                  <Button
                    onClick={handleToggleWeekPublish}
                    variant={isWeekPublished ? "outline" : "default"}
                    size="sm"
                    className={cn(
                      "h-7 rounded-xl px-3 font-black uppercase tracking-widest text-[9px] gap-2 transition-all",
                      isWeekPublished ? "border-border/70 hover:bg-secondary" : "bg-amber-500 hover:bg-amber-600 text-white"
                    )}
                  >
                    {isWeekPublished ? <><EyeOff className="w-3 h-3" /> Ocultar</> : <><Eye className="w-3 h-3" /> Publicar</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="overflow-visible pr-1 xl:pr-2">
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 pb-24">
              {currentWeekDays.map((day) => {
                const globalDIdx = days.findIndex(d => d.id === day.id)
                return (
                  <div key={day.id} id={`day-${day.id}`} className="flex flex-col gap-5 ios-panel p-4 md:p-5 hover:border-primary/30 transition-all group/day relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)] opacity-75" />
                    
                    {/* Day Header */}
                    <div className="flex flex-col gap-3 pb-4 border-b border-border/60">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={day.day_of_week}
                          onChange={(e) => {
                            const n: Day[] = JSON.parse(JSON.stringify(days))
                            n[globalDIdx].day_of_week = parseInt(e.target.value)
                            updateDays(n)
                          }}
                          className="h-9 px-3 bg-primary/10 border border-primary/20 text-primary font-black rounded-xl text-[11px] shrink-0 uppercase tracking-[0.12em] focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                        >
                          {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((name, i) => (
                            <option key={i + 1} value={i + 1} className="bg-background text-foreground normal-case">{name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            title="Añadir bloque"
                            onClick={() => addBlock(day.id)}
                            className="w-7 h-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Duplicar día"
                            onClick={() => duplicateDay(day.id)}
                            className="w-7 h-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Eliminar día"
                            onClick={() => { if (confirm('¿Eliminar este día?')) updateDays(days.filter(d => d.id !== day.id)) }}
                            className="w-7 h-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <Input
                        placeholder="Ej: Tren superior, WOD largo, Descanso activo..."
                        className="bg-background/55 border-border/70 h-10 focus:border-primary/40 font-black text-sm tracking-tight truncate w-full rounded-xl"
                        value={day.title}
                        onChange={(e) => {
                          const n = [...days]; n[globalDIdx].title = e.target.value; updateDays(n)
                        }}
                      />
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
                              
                              {/* Empty state */}
                              {block.workout_movements.length === 0 && blockPickerOpen !== block.id && (
                                <div className="py-5 flex flex-col items-center justify-center border border-dashed border-border/60 m-2 rounded-2xl bg-background/25 gap-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Arrastra o añade ejercicios</p>
                                  <button
                                    onClick={() => openBlockPicker(block.id)}
                                    className="text-[9px] font-black uppercase tracking-widest text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" /> Añadir ejercicio
                                  </button>
                                </div>
                              )}

                              {/* Inline exercise picker */}
                              {blockPickerOpen === block.id ? (
                                <div className="mt-2 mx-1 border border-primary/25 rounded-2xl p-3 space-y-2 bg-primary/5">
                                  {/* Search bar */}
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                      <Input
                                        autoFocus
                                        placeholder="Buscar ejercicio..."
                                        value={blockPickerSearch}
                                        onChange={e => { setBlockPickerSearch(e.target.value); setShowCreateForm(false) }}
                                        onKeyDown={e => { if (e.key === 'Escape') closeBlockPicker() }}
                                        className="h-8 pl-8 text-xs rounded-xl bg-background/70 border-border/60"
                                      />
                                    </div>
                                    <button onClick={closeBlockPicker} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Exercise list with multi-select */}
                                  {!showCreateForm && (
                                    <div className="max-h-52 overflow-y-auto overscroll-contain space-y-0.5 [scrollbar-width:thin]">
                                      {allExercises
                                        .filter(ex => !blockPickerSearch || ex.name.toLowerCase().includes(blockPickerSearch.toLowerCase()) || (ex.category || '').toLowerCase().includes(blockPickerSearch.toLowerCase()))
                                        .map(ex => {
                                          const selected = pickerSelectedIds.has(ex.id)
                                          return (
                                            <button
                                              key={ex.id}
                                              onClick={() => togglePickerSelection(ex.id)}
                                              className={cn(
                                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors",
                                                selected ? "bg-primary/20 text-primary" : "hover:bg-primary/10 hover:text-primary"
                                              )}
                                            >
                                              <div className={cn(
                                                "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                                                selected ? "bg-primary border-primary" : "border-border/60"
                                              )}>
                                                {selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                                              </div>
                                              <span className="text-xs font-semibold flex-1 truncate">{ex.name}</span>
                                              {ex.category && <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider shrink-0">{ex.category}</span>}
                                            </button>
                                          )
                                        })}
                                      {blockPickerSearch && allExercises.filter(ex => ex.name.toLowerCase().includes(blockPickerSearch.toLowerCase()) || (ex.category || '').toLowerCase().includes(blockPickerSearch.toLowerCase())).length === 0 && (
                                        <div className="py-3 text-center space-y-2">
                                          <p className="text-xs text-muted-foreground">No encontrado en la biblioteca</p>
                                          <button
                                            onClick={() => setShowCreateForm(true)}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5 mx-auto"
                                          >
                                            <Plus className="w-3 h-3" /> Crear &quot;{blockPickerSearch}&quot;
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Inline create form */}
                                  {showCreateForm && (
                                    <div className="space-y-2.5 py-1">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Nuevo ejercicio</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Tracking</label>
                                          <select
                                            value={createFormData.tracking_type}
                                            onChange={e => setCreateFormData(p => ({ ...p, tracking_type: e.target.value }))}
                                            className="w-full h-8 px-2 rounded-xl bg-background/70 border border-border/60 text-xs font-bold"
                                          >
                                            <option value="weight_reps">Peso + Reps</option>
                                            <option value="reps_only">Solo Reps</option>
                                            <option value="distance_time">Distancia/Tiempo</option>
                                            <option value="time_only">Solo Tiempo</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Video URL</label>
                                          <Input
                                            placeholder="youtube.com/..."
                                            value={createFormData.video_url}
                                            onChange={e => setCreateFormData(p => ({ ...p, video_url: e.target.value }))}
                                            className="h-8 text-xs rounded-xl bg-background/70 border-border/60"
                                          />
                                        </div>
                                      </div>
                                      <Input
                                        placeholder="Descripción / instrucciones (opcional)"
                                        value={createFormData.description}
                                        onChange={e => setCreateFormData(p => ({ ...p, description: e.target.value }))}
                                        className="h-8 text-xs rounded-xl bg-background/70 border-border/60"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setShowCreateForm(false)}
                                          className="flex-1 h-8 rounded-xl border border-border/60 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={() => handleQuickCreateExercise(globalDIdx, bIdx)}
                                          disabled={creatingExercise || !blockPickerSearch.trim()}
                                          className="flex-1 h-8 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                        >
                                          {creatingExercise ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                          Crear
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Multi-select footer */}
                                  {pickerSelectedIds.size > 0 && !showCreateForm && (
                                    <button
                                      onClick={() => addSelectedExercises(globalDIdx, bIdx)}
                                      className="w-full h-8 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Añadir {pickerSelectedIds.size} ejercicio{pickerSelectedIds.size !== 1 ? 's' : ''}
                                    </button>
                                  )}
                                </div>
                              ) : block.workout_movements.length > 0 && (
                                <button
                                  onClick={() => openBlockPicker(block.id)}
                                  className="w-full mt-1 h-7 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors rounded-xl hover:bg-primary/5"
                                >
                                  <Plus className="w-3 h-3" /> Añadir ejercicio
                                </button>
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

    {/* ── Block Wizard Modal ── */}

    {blockWizard && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setBlockWizard(null)}>
        <div className="w-full max-w-sm bg-card border border-border/60 rounded-[28px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)]" />
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {blockWizard.step === 1 ? 'Paso 1 de 2' : 'Paso 2 de 2'}
                </p>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {blockWizard.step === 1 ? 'Tipo de bloque' : 'Formato de trabajo'}
                </h3>
              </div>
              <button onClick={() => setBlockWizard(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {blockWizard.step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del bloque (opcional)</label>
                  <input
                    autoFocus
                    placeholder="Ej: WOD principal, Fuerza olímpica..."
                    value={blockWizard.blockName}
                    onChange={e => setBlockWizard(p => p ? { ...p, blockName: e.target.value } : p)}
                    className="w-full h-11 px-4 rounded-2xl border border-border/70 bg-background/55 text-sm font-bold outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'warmup',     label: 'Calentamiento',  color: 'var(--warmup)' },
                      { id: 'strength',   label: 'Fuerza',         color: 'var(--strength)' },
                      { id: 'metcon',     label: 'Acondic. / WOD', color: 'var(--metcon)' },
                      { id: 'gymnastics', label: 'Skills / Gimn.', color: 'var(--gymnastics)' },
                      { id: 'wod',        label: 'Core / Técnica', color: 'var(--metcon)' },
                      { id: 'cooldown',   label: 'Vuelta a calma', color: 'var(--cooldown)' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setBlockWizard(p => p ? { ...p, blockType: t.id } : p)}
                        className={cn(
                          'h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all border',
                          blockWizard.blockType === t.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                            : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setBlockWizard(p => p ? { ...p, step: 2 } : p)}
                  className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                >
                  Siguiente →
                </button>
              </div>
            )}

            {blockWizard.step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {['strength','wod'].includes(blockWizard.blockType) ? 'Formato de trabajo' : 'Cronómetro (opcional)'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: null,       label: 'Sin crono / Libre' },
                      { id: 'for_time', label: 'For Time' },
                      { id: 'amrap',    label: 'AMRAP' },
                      { id: 'emom',     label: 'EMOM' },
                      { id: 'tabata',   label: 'Tabata' },
                    ].map(t => (
                      <button
                        key={t.id ?? 'none'}
                        onClick={() => setBlockWizard(p => p ? { ...p, timerType: t.id } : p)}
                        className={cn(
                          'h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all border',
                          blockWizard.timerType === t.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                            : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBlockWizard(p => p ? { ...p, step: 1 } : p)}
                    className="h-11 px-5 rounded-2xl border border-border/60 font-black uppercase tracking-widest text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={confirmBlockWizard}
                    className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Crear bloque
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
