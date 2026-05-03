'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, Trash2, Dumbbell, Save, Loader2, 
  Search, X, Calendar, Layout, Edit3,
  GripHorizontal, ChevronRight, Hash, Info
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { savePlanStructure } from '../../actions'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Types
type Exercise = { id: string, name: string, category: string, difficulty_level: string }
type Movement = { id: string, exercise_id: string, exercise?: Exercise, sets: number, reps: string, weight_percentage: string, notes: string }
type Block = { id: string, name: string, type: string, workout_movements: Movement[] }
type Day = { id: string, day_of_week: number, title: string, week_number: number, workout_blocks: Block[] }

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
      workout_blocks: (d.workout_blocks || []).map((b: any) => ({
        ...b,
        id: b.id || genId(),
        workout_movements: (b.workout_movements || []).map((m: any) => ({
          ...m,
          id: m.id || genId(),
          // Supabase returns 'exercises', but we use 'exercise' in state
          exercise: m.exercises || m.exercise
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over) return

    // ID Formats:
    // - Movement: "uuid"
    // - Block Drop Zone: "block-dIdx-bIdx"
    // - Library Item: "lib-uuid"

    const isLibraryItem = active.data.current?.type === 'library-item'
    
    // 1. Identify Target Block
    let overDIdx = -1, overBIdx = -1, overMIdx = -1
    const overId = String(over.id)

    if (overId.startsWith('block-')) {
      const parts = overId.split('-')
      overDIdx = parseInt(parts[1])
      overBIdx = parseInt(parts[2])
      overMIdx = days[overDIdx].workout_blocks[overBIdx].workout_movements.length
    } else {
      // It's a movement ID
      days.forEach((d, di) => {
        d.workout_blocks.forEach((b, bi) => {
          const mi = b.workout_movements.findIndex(m => m.id === overId)
          if (mi !== -1) { overDIdx = di; overBIdx = bi; overMIdx = mi; }
        })
      })
    }

    if (overDIdx === -1) return

    // 2. Handle Library Item Drop
    if (isLibraryItem) {
      const exercise = active.data.current.exercise
      addMovement(overDIdx, overBIdx, exercise, overMIdx)
      return
    }

    // 3. Handle Movement Sorting/Moving
    let activeDIdx = -1, activeBIdx = -1, activeMIdx = -1
    days.forEach((d, di) => {
      d.workout_blocks.forEach((b, bi) => {
        const mi = b.workout_movements.findIndex(m => m.id === active.id)
        if (mi !== -1) { activeDIdx = di; activeBIdx = bi; activeMIdx = mi; }
      })
    })

    if (activeDIdx !== -1) {
      setDays(prev => {
        const next = JSON.parse(JSON.stringify(prev)) // deep clone for safety
        const [moved] = next[activeDIdx].workout_blocks[activeBIdx].workout_movements.splice(activeMIdx, 1)
        next[overDIdx].workout_blocks[overBIdx].workout_movements.splice(overMIdx, 0, moved)
        return next
      })
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
      workout_blocks: [] 
    }
    setDays([...days, newDay])
  }

  const addWeek = () => {
    const nextWeek = Math.max(0, ...days.map(d => d.week_number || 1)) + 1
    setDays([...days, { 
      id: genId(), 
      week_number: nextWeek, 
      day_of_week: 1, 
      title: 'Entrenamiento 1', 
      workout_blocks: [] 
    }])
    setActiveWeek(nextWeek.toString())
  }

  const addBlock = (dayId: string) => {
    const n = [...days]
    const idx = n.findIndex(d => d.id === dayId)
    const blockCount = n[idx].workout_blocks.length
    const blockLetter = String.fromCharCode(65 + blockCount)
    n[idx].workout_blocks.push({ 
      id: genId(), 
      name: `Bloque ${blockLetter}`, 
      type: 'strength', 
      workout_movements: [] 
    })
    setDays(n)
  }

  const addMovement = (dIdx: number, bIdx: number, exercise: Exercise, atIdx?: number) => {
    const n = JSON.parse(JSON.stringify(days))
    const newMov = {
      id: genId(),
      exercise_id: exercise.id,
      exercise: exercise,
      sets: 3,
      reps: '10',
      weight_percentage: '',
      notes: ''
    }
    
    if (typeof atIdx === 'number') {
      n[dIdx].workout_blocks[bIdx].workout_movements.splice(atIdx, 0, newMov)
    } else {
      n[dIdx].workout_blocks[bIdx].workout_movements.push(newMov)
    }
    setDays(n)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await savePlanStructure(planId, days, planMeta)
      alert('¡Planificación guardada con éxito!')
    } catch (e) {
      console.error(e)
      alert('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredLibrary = library.filter(ex => 
    ex.name.toLowerCase().includes(libSearch.toLowerCase()) ||
    ex.category.toLowerCase().includes(libSearch.toLowerCase())
  )

  const currentWeekDays = days.filter(d => d.week_number === parseInt(activeWeek))
  const totalWeeks = Array.from(new Set(days.map(d => d.week_number || 1))).sort((a,b) => a-b)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-6 overflow-hidden">
        
        {/* ── Sidebar: Library ── */}
        <aside className="w-80 flex flex-col gap-4 bg-background/40 border border-border/20 rounded-[24px] p-4 shrink-0 shadow-sm">
          <div className="pb-2 border-b border-border/10">
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="w-full gap-2 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl shadow-lg shadow-primary/10"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Guardar Plan
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
          <div className="bg-background/40 border border-border/20 rounded-[24px] p-6 space-y-6 shrink-0 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Layout className="w-6 h-6 text-primary-foreground" />
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

            <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">
              <TabsList className="bg-secondary/20 p-1 rounded-xl h-12 border border-border/10 w-full md:w-auto justify-start overflow-x-auto overflow-y-hidden">
                {totalWeeks.map(w => (
                  <TabsTrigger 
                    key={w} 
                    value={w.toString()}
                    className="rounded-lg font-black uppercase tracking-widest text-[10px] px-8 h-full data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                  >
                    Semana {w}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Days Grid */}
          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-12">
              {currentWeekDays.map((day, dIdxInWeek) => {
                const globalDIdx = days.findIndex(d => d.id === day.id)
                return (
                  <div key={day.id} className="flex flex-col gap-4">
                    {/* Day Header */}
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-black px-2.5 h-6 rounded-lg text-[10px] shrink-0">
                          DÍA {day.day_of_week}
                        </Badge>
                        <Input 
                          className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 font-black uppercase text-sm tracking-tight truncate w-full"
                          value={day.title}
                          onChange={(e) => {
                            const n = [...days]; n[globalDIdx].title = e.target.value; setDays(n);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => addBlock(day.id)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:text-destructive" onClick={() => setDays(days.filter(d => d.id !== day.id))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Blocks in Day */}
                    <div className="space-y-4">
                      {day.workout_blocks.map((block, bIdx) => (
                        <Card key={block.id} className="border-border/30 bg-card/30 rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary/40">
                          <div className="p-4 border-b border-border/10 bg-muted/20 flex items-center justify-between gap-3">
                            <input 
                              className="bg-transparent font-black text-[10px] uppercase tracking-widest outline-none w-full focus:text-primary transition-colors" 
                              value={block.name}
                              onChange={(e) => {
                                const n = [...days]; n[globalDIdx].workout_blocks[bIdx].name = e.target.value; setDays(n);
                              }}
                            />
                            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md opacity-20 hover:opacity-100 hover:text-destructive" onClick={() => {
                              const n = [...days]; n[globalDIdx].workout_blocks.splice(bIdx, 1); setDays(n);
                            }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <DroppableBlock id={`block-${globalDIdx}-${bIdx}`} className="min-h-[60px] p-4">
                            {/* Routine Description Area */}
                            <div className="mb-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Rutina / WOD (Texto libre)</Label>
                                <div className="flex gap-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-6 px-2 text-[9px] font-black uppercase tracking-widest gap-1 rounded-lg border-primary/20 text-primary">
                                        <Video className="w-2.5 h-2.5" /> Vincular Video
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0" align="end">
                                      <div className="p-2 border-b border-border/10">
                                        <Input 
                                          placeholder="Buscar ejercicio..." 
                                          className="h-8 text-[10px]" 
                                          autoFocus
                                          onChange={(e) => {
                                            // Local filter for this popover if needed
                                          }}
                                        />
                                      </div>
                                      <ScrollArea className="h-48">
                                        <div className="p-1">
                                          {library.map(ex => (
                                            <button
                                              key={ex.id}
                                              className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-primary/10 rounded-md transition-colors flex items-center justify-between group"
                                              onClick={() => {
                                                const tag = `[${ex.name}]`
                                                const n = [...days]
                                                const currentDesc = n[globalDIdx].workout_blocks[bIdx].description || ''
                                                n[globalDIdx].workout_blocks[bIdx].description = currentDesc + (currentDesc ? ' ' : '') + tag
                                                setDays(n)
                                              }}
                                            >
                                              {ex.name}
                                              <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                                            </button>
                                          ))}
                                        </div>
                                      </ScrollArea>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                              <Textarea 
                                placeholder="Ej: 5 rondas de 10 [Pull Ups], 15 [Sentadillas]..."
                                className="min-h-[100px] bg-background/30 border-border/10 text-xs font-medium leading-relaxed resize-none rounded-xl focus:ring-primary/20"
                                value={block.description || ''}
                                onChange={(e) => {
                                  const n = [...days]; n[globalDIdx].workout_blocks[bIdx].description = e.target.value; setDays(n);
                                }}
                              />
                              <p className="text-[8px] text-muted-foreground/50 font-medium italic">Los ejercicios entre corchetes [] mostrarán el video automáticamente.</p>
                            </div>

                            <div className="border-t border-border/5 pt-4 mb-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Movimientos Estructurados (Opcional)</Label>
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
                                      const n = [...days]; n[globalDIdx].workout_blocks[bIdx].workout_movements[mIdx].sets = parseInt(val) || 0; setDays(n);
                                    }}
                                    updateReps={(val: string) => {
                                      const n = [...days]; n[globalDIdx].workout_blocks[bIdx].workout_movements[mIdx].reps = val; setDays(n);
                                    }}
                                    updateWeight={(val: string) => {
                                      const n = [...days]; n[globalDIdx].workout_blocks[bIdx].workout_movements[mIdx].weight_percentage = val; setDays(n);
                                    }}
                                    removeMov={() => {
                                      const n = [...days]; n[globalDIdx].workout_blocks[bIdx].workout_movements.splice(mIdx, 1); setDays(n);
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
                        </Card>
                      ))}
                      
                      <Button 
                        variant="ghost" 
                        className="w-full h-10 border border-dashed border-border/20 rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/30 text-[9px] font-black uppercase tracking-[0.2em] transition-all text-muted-foreground/40"
                        onClick={() => addBlock(day.id)}
                      >
                        <Plus className="w-3 h-3 mr-2" /> Añadir Bloque
                      </Button>
                    </div>
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
