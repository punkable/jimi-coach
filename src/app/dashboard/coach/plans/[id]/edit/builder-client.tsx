'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Plus, Trash2, Save, Loader2, X,
  Search, Layout, Edit3,
  Video,
  Eye, EyeOff, CheckCircle2, Timer as TimerIcon,
  Copy, Zap
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
type Block = { id: string, name: string, type: string, description?: string, description_footer?: string | null, workout_movements: Movement[], timer_type?: string, timer_config?: any }
type Day = { id: string, day_of_week: number, title: string, week_number: number, is_published: boolean, workout_blocks: Block[] }

const genId = () => Math.random().toString(36).substr(2, 9)

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
  // Footer text — free text shown AFTER structured movements
  const [routineFooters, setRoutineFooters] = useState<Record<string, string>>(() => {
    const drafts: Record<string, string> = {}
    daysRef.current.forEach(day => {
      day.workout_blocks.forEach(block => {
        drafts[block.id] = block.description_footer || ''
      })
    })
    return drafts
  })
  const routineFootersRef = useRef<Record<string, string>>(routineFooters)
  const [planMeta, setPlanMeta] = useState({
    title: initialPlan?.title || '',
    description: initialPlan?.description || '',
  })
  
  const [activeWeek, setActiveWeek] = useState<string>('1')
  const [isSaving, setIsSaving] = useState(false)
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editingBlocks, setEditingBlocks] = useState<Record<string, boolean>>({})
  // Collapsed state per block. Existing blocks (loaded from DB) start collapsed,
  // newly created blocks via the wizard start expanded.
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    initialDays.forEach((d: any) => {
      (d.workout_blocks || []).forEach((b: any) => {
        if (b.id) initial[b.id] = true
      })
    })
    return initial
  })
  const toggleBlockCollapse = (blockId: string) => {
    setCollapsedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }))
  }
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

  // Block type category: 'conditioning' shows timer picker in step 2,
  // 'strength' shows format hint, 'simple' skips step 2
  const BLOCK_TYPES = [
    { id: 'warmup',    label: 'Calentamiento', category: 'simple' as const },
    { id: 'strength',  label: 'Fuerza',        category: 'strength' as const },
    { id: 'metcon',    label: 'Acondicionamiento', category: 'conditioning' as const },
    { id: 'core',      label: 'Core',          category: 'strength' as const },
    { id: 'skills',    label: 'Skills',        category: 'strength' as const },
    { id: 'tecnica',   label: 'Técnica',       category: 'strength' as const },
    { id: 'mobility',  label: 'Movilidad',     category: 'simple' as const },
    { id: 'other',     label: 'Otro',          category: 'simple' as const },
  ]

  const getBlockCategory = (typeId: string) =>
    BLOCK_TYPES.find(t => t.id === typeId)?.category ?? 'simple'

  useEffect(() => {
    routineDraftsRef.current = routineDrafts
  }, [routineDrafts])

  useEffect(() => {
    routineFootersRef.current = routineFooters
  }, [routineFooters])

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
    const footers: Record<string, string> = {}
    nextDays.forEach(day => {
      day.workout_blocks.forEach(block => {
        drafts[block.id] = block.description || ''
        footers[block.id] = block.description_footer || ''
      })
    })
    routineDraftsRef.current = drafts
    routineFootersRef.current = footers
    setRoutineDrafts(drafts)
    setRoutineFooters(footers)
  }

  const mergeRoutineDraftsIntoDays = (sourceDays: Day[]) => {
    const drafts = routineDraftsRef.current
    const footers = routineFootersRef.current
    return JSON.parse(JSON.stringify(sourceDays)).map((day: Day) => ({
      ...day,
      workout_blocks: day.workout_blocks.map((block: Block) => ({
        ...block,
        description: drafts[block.id] ?? block.description ?? '',
        description_footer: footers[block.id] ?? block.description_footer ?? ''
      }))
    }))
  }

  const updateRoutineDraft = (blockId: string, value: string) => {
    const nextDrafts = { ...routineDraftsRef.current, [blockId]: value }
    routineDraftsRef.current = nextDrafts
    setRoutineDrafts(nextDrafts)
    setHasUnsavedChanges(true)
  }

  const updateRoutineFooter = (blockId: string, value: string) => {
    const nextFooters = { ...routineFootersRef.current, [blockId]: value }
    routineFootersRef.current = nextFooters
    setRoutineFooters(nextFooters)
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

    // Block reordering within a day
    if (active.data.current?.type === 'block') {
      const activeDIdx = active.data.current.dIdx
      if (activeId !== overId) {
        updateDays(prev => {
          const next = JSON.parse(JSON.stringify(prev))
          const blockIds = next[activeDIdx].workout_blocks.map((b: any) => b.id)
          const oldIndex = blockIds.indexOf(activeId)
          const newIndex = blockIds.indexOf(overId)
          if (oldIndex !== -1 && newIndex !== -1) {
            next[activeDIdx].workout_blocks = arrayMove(next[activeDIdx].workout_blocks, oldIndex, newIndex)
          }
          return next
        })
      }
      return
    }

    // Movement reordering within its block (no cross-block moves)
    let activeDIdx = -1, activeBIdx = -1, activeMIdx = -1
    days.forEach((d, di) => {
      d.workout_blocks.forEach((b, bi) => {
        const mi = b.workout_movements.findIndex(m => m.id === activeId)
        if (mi !== -1) { activeDIdx = di; activeBIdx = bi; activeMIdx = mi; }
      })
    })

    if (activeDIdx !== -1) {
      let overMIdx = -1
      const block = days[activeDIdx].workout_blocks[activeBIdx]
      const mi = block.workout_movements.findIndex(m => m.id === overId)
      if (mi !== -1) overMIdx = mi

      if (overMIdx !== -1 && activeMIdx !== overMIdx) {
        updateDays(prev => {
          const next = JSON.parse(JSON.stringify(prev))
          next[activeDIdx].workout_blocks[activeBIdx].workout_movements = arrayMove(
            next[activeDIdx].workout_blocks[activeBIdx].workout_movements,
            activeMIdx,
            overMIdx
          )
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

  const defaultTimerConfig = (timerType: string | null) => {
    if (timerType === 'amrap') return { minutes: 15 }
    if (timerType === 'emom') return { rounds: 10 }
    if (timerType === 'tabata') return { rounds: 8, work: 20, rest: 10 }
    if (timerType === 'intervals') return { intervals: 5, work: 40, rest: 20 }
    return {}
  }

  const confirmBlockWizard = (openPickerAfter: boolean = true) => {
    if (!blockWizard) return
    const { dayId, blockType, blockName, timerType } = blockWizard
    const blockTypeLabel = BLOCK_TYPES.find(t => t.id === blockType)?.label || blockType
    const newBlockId = genId()
    updateDays((prev: Day[]) => {
      const n: Day[] = JSON.parse(JSON.stringify(prev))
      const idx = n.findIndex((d: Day) => d.id === dayId)
      if (idx === -1) return prev
      const blockCount = n[idx].workout_blocks.length
      const defaultName = blockName.trim() || `${blockTypeLabel} ${String.fromCharCode(65 + blockCount)}`
      n[idx].workout_blocks.push({
        id: newBlockId,
        name: defaultName,
        type: blockType,
        timer_type: timerType ?? undefined,
        timer_config: defaultTimerConfig(timerType),
        description: '',
        workout_movements: [],
      })
      return n
    })
    setBlockWizard(null)
    // New blocks default to expanded so the coach can immediately edit them
    setCollapsedBlocks(prev => ({ ...prev, [newBlockId]: false }))
    if (openPickerAfter) {
      // Smooth scroll + auto-open exercise picker for the newly created block
      setTimeout(() => {
        document.getElementById(`day-${dayId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        openBlockPicker(newBlockId)
      }, 100)
    }
  }

  const advanceWizardStep = () => {
    if (!blockWizard) return
    const category = getBlockCategory(blockWizard.blockType)
    if (category === 'simple') {
      // Skip step 2 — create immediately
      confirmBlockWizard()
    } else {
      // Go to step 2 with sensible default timer
      const defaultTimer = category === 'conditioning' ? 'for_time' : null
      setBlockWizard(p => p ? { ...p, step: 2, timerType: defaultTimer } : p)
    }
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
  const [tagSearch, setTagSearch] = useState('')
  const filteredTags = allExercises.filter(ex =>
    !tagSearch ||
    ex.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
    (ex.category || '').toLowerCase().includes(tagSearch.toLowerCase())
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
    {/* ── Sticky top bar: title + save ── */}
    <div className="sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-4 bg-background/85 backdrop-blur-xl border-b border-border/60">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">Programación</p>
          <p className="text-sm font-black uppercase tracking-tight truncate">{planMeta.title || 'Sin título'}</p>
        </div>
        {hasUnsavedChanges && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[9px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Cambios sin guardar
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "h-10 px-4 sm:px-5 gap-2 font-black uppercase tracking-[0.14em] text-[10px] rounded-xl transition-all relative",
            hasUnsavedChanges
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_20px_rgba(147,213,0,0.20)]'
              : 'bg-secondary/70 hover:bg-secondary text-muted-foreground border border-border/70'
          )}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Guardando' : 'Guardar'}
        </Button>
      </div>
    </div>

    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="overflow-visible">
        {/* ── Main Workspace (full width, no sidebar) ── */}
        <main className="flex flex-col gap-4 overflow-visible min-w-0">
          
          {/* Compact header — title/description + week tabs in single panel */}
          <div className="ios-panel p-4 md:p-5 space-y-4 shrink-0 overflow-hidden max-w-5xl mx-auto w-full">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)]" />

            {/* Title + description (compact, single column) */}
            <div className="space-y-2">
              <Input
                className="bg-background/55 border-border/70 hover:border-primary/40 focus:border-primary h-11 rounded-xl text-base md:text-lg font-black tracking-tight transition-all"
                value={planMeta.title}
                placeholder="Título del programa..."
                onChange={(e) => setPlanMeta({...planMeta, title: e.target.value})}
              />
              <Input
                className="bg-background/40 border-border/50 hover:border-primary/30 focus:border-primary/40 h-9 rounded-xl text-xs font-medium transition-all"
                value={planMeta.description}
                placeholder="Descripción / objetivos (opcional)"
                onChange={(e) => setPlanMeta({...planMeta, description: e.target.value})}
              />
            </div>

            {/* Week tabs — compact row */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
              {totalWeeks.map(w => {
                const isWPublished = days.filter(d => d.week_number === w).every(d => d.is_published)
                const isActive = parseInt(activeWeek) === w
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setActiveWeek(w.toString())}
                    className={cn(
                      'h-8 px-3 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 whitespace-nowrap transition-all border',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow'
                        : 'bg-background/55 text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    S{w}
                    {!isWPublished && (
                      <span className="text-[7px] opacity-80">●</span>
                    )}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={addWeek}
                title="Añadir semana"
                className="h-8 px-2.5 rounded-lg border border-dashed border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>

              {/* Active week — visibility + actions */}
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  onClick={handleToggleWeekPublish}
                  variant="ghost"
                  size="sm"
                  title={isWeekPublished ? 'Visible para atletas — click para ocultar' : 'Oculta para atletas — click para publicar'}
                  className={cn(
                    "h-8 rounded-lg px-2.5 font-black uppercase tracking-widest text-[9px] gap-1.5 transition-all border",
                    isWeekPublished ? "border-primary/30 text-primary bg-primary/5" : "border-amber-500/40 text-amber-500 bg-amber-500/10"
                  )}
                >
                  {isWeekPublished ? <><Eye className="w-3 h-3" /> Visible</> : <><EyeOff className="w-3 h-3" /> Oculta</>}
                </Button>
                <button
                  type="button"
                  title="Duplicar semana actual"
                  onClick={() => duplicateWeek(parseInt(activeWeek))}
                  className="h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {totalWeeks.length > 1 && (
                  <button
                    type="button"
                    title={`Eliminar semana ${activeWeek}`}
                    onClick={() => { if (confirm(`¿Eliminar Semana ${activeWeek} y todos sus días? Esta acción no se puede deshacer.`)) removeWeek(parseInt(activeWeek)) }}
                    className="h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="overflow-visible pr-1 xl:pr-2">
            <div className="flex flex-col gap-4 pb-24 max-w-5xl mx-auto">
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
                        {day.workout_blocks.map((block, bIdx) => {
                          const description = routineDrafts[block.id] ?? block.description ?? ''
                          const footer = routineFooters[block.id] ?? block.description_footer ?? ''
                          const blockSummary = (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {block.timer_type && (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                    {block.timer_type.replace('_', ' ')}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-secondary/60 text-muted-foreground border border-border/40">
                                  {block.workout_movements.length} movimiento{block.workout_movements.length !== 1 ? 's' : ''}
                                </span>
                                {description && (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[var(--gymnastics)]/10 text-[var(--gymnastics)] border border-[var(--gymnastics)]/20">
                                    Texto inicial
                                  </span>
                                )}
                                {footer && (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[var(--gymnastics)]/10 text-[var(--gymnastics)] border border-[var(--gymnastics)]/20">
                                    Notas finales
                                  </span>
                                )}
                              </div>
                              {description && (
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                                  {description.split('\n').slice(0, 2).join(' · ').replace(/\[([^\]]+)\]/g, '$1')}
                                </p>
                              )}
                              {block.workout_movements.length > 0 && (
                                <p className="text-[11px] text-foreground/80 line-clamp-1">
                                  {block.workout_movements.slice(0, 3).map((m: Movement) => m.exercise?.name).filter(Boolean).join(' · ')}
                                  {block.workout_movements.length > 3 && ' · ...'}
                                </p>
                              )}
                              {footer && (
                                <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-1 italic">
                                  ↳ {footer.split('\n')[0]}
                                </p>
                              )}
                              {!description && !footer && block.workout_movements.length === 0 && (
                                <p className="text-[11px] text-muted-foreground italic">Bloque vacío — click para añadir contenido</p>
                              )}
                            </div>
                          )
                          return (
                          <SortableBlock
                            key={block.id}
                            id={block.id}
                            block={block}
                            collapsed={collapsedBlocks[block.id] ?? false}
                            onToggleCollapse={() => toggleBlockCollapse(block.id)}
                            summary={blockSummary}
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
                            <div className="min-h-[60px] p-1 md:p-2">
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
                                                { id: 'tabata', label: 'Tabata' },
                                                { id: 'intervals', label: 'Intervalos' }
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
                                              {block.timer_type === 'intervals' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                  <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Intervalos</Label>
                                                    <Input type="number" className="h-9 text-xs rounded-xl" value={block.timer_config?.intervals || 5} onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, intervals: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }} />
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Trabajo (seg)</Label>
                                                    <Input type="number" className="h-9 text-xs rounded-xl" value={block.timer_config?.work || 40} onChange={e => {
                                                      const n = JSON.parse(JSON.stringify(days))
                                                      n[globalDIdx].workout_blocks[bIdx].timer_config = { ...n[globalDIdx].workout_blocks[bIdx].timer_config, work: parseInt(e.target.value) }
                                                      updateDays(n)
                                                    }} />
                                                  </div>
                                                  <div className="space-y-1.5 col-span-2">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Descanso (seg)</Label>
                                                    <Input type="number" className="h-9 text-xs rounded-xl" value={block.timer_config?.rest || 20} onChange={e => {
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setOpenPopoverId(openPopoverId === block.id ? null : block.id)
                                        setTagSearch('')
                                      }}
                                      className={cn(
                                        "h-7 px-3 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl border-[var(--gymnastics)]/25 text-[var(--gymnastics)] hover:bg-[var(--gymnastics)]/10 transition-all",
                                        openPopoverId === block.id && "bg-[var(--gymnastics)]/15"
                                      )}
                                    >
                                      <Video className="w-3 h-3" />
                                      {openPopoverId === block.id ? 'Cerrar' : 'Insertar etiqueta'}
                                    </Button>
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

                                {/* Inline tag-insertion panel — replaces the broken portal popover */}
                                {openPopoverId === block.id && (
                                  <div className="rounded-2xl border border-[var(--gymnastics)]/30 bg-card/95 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gymnastics)] flex-1">Inserta una etiqueta con video</p>
                                      <button
                                        type="button"
                                        onClick={() => setOpenPopoverId(null)}
                                        className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                      <Input
                                        placeholder="Buscar ejercicio..."
                                        className="h-10 text-xs pl-9 bg-background/70 border-border/60 rounded-xl"
                                        onChange={(e) => setTagSearch(e.target.value)}
                                        value={tagSearch}
                                        autoFocus
                                      />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto overscroll-contain [scrollbar-width:thin] -mx-1 px-1">
                                      <div className="space-y-0.5">
                                        {filteredTags.length === 0 ? (
                                          <div className="py-6 text-center">
                                            <p className="text-[10px] text-muted-foreground italic">Sin resultados</p>
                                          </div>
                                        ) : filteredTags.map(ex => (
                                          <button
                                            key={ex.id}
                                            type="button"
                                            className="w-full text-left px-3 py-2.5 text-[11px] font-bold hover:bg-[var(--gymnastics)]/10 rounded-xl transition-all flex items-center justify-between gap-3 group"
                                            onClick={() => {
                                              const tagName = `[${ex.name}]`
                                              const currentDesc = routineDraftsRef.current[block.id] ?? block.description ?? ''
                                              updateRoutineDraft(block.id, currentDesc + (currentDesc ? '\n' : '') + tagName)
                                              setOpenPopoverId(null)
                                              setEditingBlocks(prev => ({ ...prev, [block.id]: true }))
                                            }}
                                          >
                                            <div className="min-w-0 flex-1">
                                              <span className="block uppercase tracking-tight text-foreground truncate">{ex.name}</span>
                                              <span className="block text-[8px] opacity-40 font-black uppercase tracking-widest">{ex.category || 'General'}</span>
                                            </div>
                                            <div className="w-6 h-6 rounded-lg bg-[var(--gymnastics)]/10 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                                              <Plus className="w-3 h-3 text-[var(--gymnastics)]" />
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

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
                                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Bloque sin movimientos estructurados</p>
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
                                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Tipo de registro</label>
                                          <select
                                            value={createFormData.tracking_type}
                                            onChange={e => setCreateFormData(p => ({ ...p, tracking_type: e.target.value }))}
                                            className="w-full h-8 px-2 rounded-xl bg-background/70 border border-border/60 text-xs font-bold"
                                          >
                                            <option value="weight_reps">Peso + Reps</option>
                                            <option value="reps_only">Solo Reps</option>
                                            <option value="distance_time">Distancia / Tiempo</option>
                                            <option value="time_only">Solo Tiempo</option>
                                            <option value="calories">Calorías</option>
                                            <option value="rounds">Rondas</option>
                                            <option value="custom">Personalizado</option>
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

                              {/* Footer free-text — notes shown AFTER movements */}
                              <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <Edit3 className="w-3 h-3" /> Notas finales (opcional)
                                </Label>
                                <Textarea
                                  placeholder="Notas o texto libre que aparecerá DESPUÉS de los ejercicios. Ej: estiramientos, descanso, observaciones."
                                  className="min-h-[80px] bg-background/55 border border-border/60 focus:border-primary/40 text-sm font-medium leading-relaxed resize-y rounded-xl p-3 transition-all"
                                  value={routineFooters[block.id] ?? ''}
                                  onChange={(e) => updateRoutineFooter(block.id, e.target.value)}
                                />
                                {(routineFooters[block.id] || '').length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => updateRoutineFooter(block.id, '')}
                                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> Eliminar notas finales
                                  </button>
                                )}
                              </div>
                            </div>
                          </SortableBlock>
                          )
                        })}
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
              
              {/* Add Day Button / Empty state */}
              {currentWeekDays.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center gap-6 py-16 px-8 ios-panel border border-dashed border-border/60 rounded-[28px]">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Layout className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center space-y-2 max-w-xs">
                    <h3 className="text-lg font-black uppercase tracking-tight">Semana vacía</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Añade el primer día de entrenamiento para empezar a construir la programación.</p>
                  </div>
                  <Button
                    onClick={() => addDay(parseInt(activeWeek))}
                    className="h-12 px-8 rounded-2xl font-black uppercase tracking-[0.16em] text-[11px] gap-2"
                  >
                    <Plus className="w-4 h-4" /> Añadir primer día
                  </Button>
                </div>
              ) : (
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
              )}
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
                  {blockWizard.step === 1
                    ? (getBlockCategory(blockWizard.blockType) === 'simple' ? 'Paso 1 de 1' : 'Paso 1 de 2')
                    : 'Paso 2 de 2'}
                </p>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {blockWizard.step === 1 ? 'Nuevo bloque' : (
                    getBlockCategory(blockWizard.blockType) === 'conditioning'
                      ? 'Tipo de crono'
                      : 'Formato de trabajo'
                  )}
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
                    onKeyDown={e => { if (e.key === 'Enter') advanceWizardStep() }}
                    className="w-full h-11 px-4 rounded-2xl border border-border/70 bg-background/55 text-sm font-bold outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BLOCK_TYPES.map(t => (
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
                  onClick={advanceWizardStep}
                  className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                >
                  {getBlockCategory(blockWizard.blockType) === 'simple'
                    ? <><Plus className="w-4 h-4" /> Crear bloque</>
                    : 'Siguiente →'}
                </button>
              </div>
            )}

            {blockWizard.step === 2 && (
              <div className="space-y-4">
                {getBlockCategory(blockWizard.blockType) === 'conditioning' ? (
                  /* Conditioning: pick timer type */
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Formato del WOD</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'for_time', label: 'For Time' },
                        { id: 'amrap',    label: 'AMRAP' },
                        { id: 'emom',     label: 'EMOM' },
                        { id: 'tabata',   label: 'Tabata' },
                        { id: 'intervals',label: 'Intervalos' },
                        { id: null,       label: 'Libre' },
                      ].map(t => (
                        <button
                          key={t.id ?? 'none'}
                          onClick={() => setBlockWizard(p => p ? { ...p, timerType: t.id } : p)}
                          className={cn(
                            'h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5',
                            blockWizard.timerType === t.id
                              ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                              : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          )}
                        >
                          {t.id && <Zap className="w-3 h-3" />}
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Strength/Skills: format hint + optional timer */
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20">
                      <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-1">Series × Reps × Carga</p>
                      <p className="text-[10px] text-muted-foreground">Añade movimientos estructurados al bloque. Cada movimiento tendrá sets, reps y % de carga.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cronómetro (opcional)</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: null,       label: 'Sin crono' },
                          { id: 'emom',     label: 'EMOM' },
                          { id: 'tabata',   label: 'Tabata' },
                        ].map(t => (
                          <button
                            key={t.id ?? 'none'}
                            onClick={() => setBlockWizard(p => p ? { ...p, timerType: t.id } : p)}
                            className={cn(
                              'h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
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
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setBlockWizard(p => p ? { ...p, step: 1 } : p)}
                    className="h-11 px-5 rounded-2xl border border-border/60 font-black uppercase tracking-widest text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={() => confirmBlockWizard(true)}
                    className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Crear y añadir ejercicios
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
