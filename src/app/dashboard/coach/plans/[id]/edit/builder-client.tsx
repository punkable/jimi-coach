'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, Trash2, Dumbbell, Save, Loader2, 
  Search, X, Calendar, GripVertical, Info, 
  ChevronRight, Layout, Edit3
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
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { SortableMovement } from './SortableMovement'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'

// Types
type Exercise = { id: string, name: string, category: string, difficulty_level: string }
type Movement = { 
  id: string, 
  exercise_id: string, 
  exercise?: Exercise, 
  sets: number, 
  reps: string, 
  weight_percentage: string, 
  notes: string 
}
type Block = { id: string, name: string, type: string, workout_movements: Movement[] }
type Day = { id: string, day_of_week: number, title: string, week_number: number, workout_blocks: Block[] }

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
  // Ensure all entities have IDs for DND
  const processInitialDays = (rawDays: any[]): Day[] => {
    return rawDays.map(d => ({
      ...d,
      id: d.id || genId(),
      workout_blocks: (d.workout_blocks || []).map((b: any) => ({
        ...b,
        id: b.id || genId(),
        workout_movements: (b.workout_movements || []).map((m: any) => ({
          ...m,
          id: m.id || genId()
        }))
      }))
    }))
  }

  const [days, setDays] = useState<Day[]>(processInitialDays(initialDays))
  const [planMeta, setPlanMeta] = useState({
    title: initialPlan?.title || '',
    description: initialPlan?.description || ''
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [targetBlock, setTargetBlock] = useState<{ dIdx: number, bIdx: number } | null>(null)
  const [modalSearchTerm, setModalSearchTerm] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over) return

    // If we are dragging within a block
    // We need to find which block 'active' and 'over' belong to
    let activeDIdx = -1, activeBIdx = -1, activeMIdx = -1
    let overDIdx = -1, overBIdx = -1, overMIdx = -1

    days.forEach((d, di) => {
      d.workout_blocks.forEach((b, bi) => {
        const mi = b.workout_movements.findIndex(m => m.id === active.id)
        if (mi !== -1) { activeDIdx = di; activeBIdx = bi; activeMIdx = mi; }
        
        const oi = b.workout_movements.findIndex(m => m.id === over.id)
        if (oi !== -1) { overDIdx = di; overBIdx = bi; overMIdx = oi; }
      })
    })

    if (activeDIdx !== -1 && overDIdx !== -1) {
      if (activeDIdx === overDIdx && activeBIdx === overBIdx) {
        // Same block sorting
        if (activeMIdx !== overMIdx) {
          setDays(prev => {
            const next = [...prev]
            const block = next[activeDIdx].workout_blocks[activeBIdx]
            block.workout_movements = arrayMove(block.workout_movements, activeMIdx, overMIdx)
            return next
          })
        }
      } else {
        // Between blocks move
        setDays(prev => {
          const next = [...prev]
          const sourceBlock = next[activeDIdx].workout_blocks[activeBIdx]
          const destBlock = next[overDIdx].workout_blocks[overBIdx]
          const [moved] = sourceBlock.workout_movements.splice(activeMIdx, 1)
          destBlock.workout_movements.splice(overMIdx, 0, moved)
          return next
        })
      }
    }
  }

  const addDay = (weekNum: number) => {
    const daysInWeek = days.filter(d => d.week_number === weekNum).length
    const nextDayNum = daysInWeek + 1
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
  }

  const addBlock = (dayIndex: number) => {
    const newDays = [...days]
    const blockCount = newDays[dayIndex].workout_blocks.length
    const blockLetter = String.fromCharCode(65 + blockCount) // A, B, C...
    newDays[dayIndex].workout_blocks.push({ 
      id: genId(), 
      name: `Bloque ${blockLetter}`, 
      type: 'strength', 
      workout_movements: [] 
    })
    setDays(newDays)
  }

  const addMovement = (dIdx: number, bIdx: number, exercise: Exercise) => {
    const newDays = [...days]
    newDays[dIdx].workout_blocks[bIdx].workout_movements.push({
      id: genId(),
      exercise_id: exercise.id,
      exercise: exercise,
      sets: 3,
      reps: '10',
      weight_percentage: '',
      notes: ''
    })
    setDays(newDays)
    setIsSearchOpen(false)
    setModalSearchTerm('')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Pass both structure and metadata to ensure total synchronization
      await savePlanStructure(planId, days, planMeta)
      alert('¡Planificación guardada con éxito!')
    } catch (e) {
      console.error(e)
      alert('Error al guardar la planificación')
    } finally {
      setIsSaving(false)
    }
  }

  const modalFilteredLibrary = library.filter(ex => 
    ex.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    ex.category.toLowerCase().includes(modalSearchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-1 gap-8 overflow-hidden h-full relative">
      {/* ── Main Workspace ── */}
      <div className="flex-1 overflow-y-auto pr-2 pb-32 scrollbar-hide space-y-12">
        
        {/* Plan Header Info */}
        <section className="glass rounded-[32px] p-8 border-primary/10 bg-primary/5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <Layout className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="relative group">
                <Input 
                  className="text-3xl font-black uppercase tracking-tight bg-transparent border-none p-0 focus-visible:ring-0 h-auto placeholder:opacity-30"
                  value={planMeta.title}
                  placeholder="NOMBRE DEL PLAN..."
                  onChange={(e) => setPlanMeta({...planMeta, title: e.target.value})}
                />
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Edit3 className="w-4 h-4 text-primary" />
                </div>
              </div>
              <Textarea 
                className="bg-background/40 border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl resize-none font-medium text-muted-foreground"
                value={planMeta.description}
                placeholder="Describe el enfoque de este programa (objetivos, fase, etc)..."
                onChange={(e) => setPlanMeta({...planMeta, description: e.target.value})}
                rows={2}
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl px-8 h-14 shrink-0"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar Cambios
            </Button>
          </div>
        </section>

        {/* Weeks & Days */}
        {Array.from(new Set(days.map(d => d.week_number || 1))).sort((a,b) => a-b).map(weekNum => (
          <div key={`week-${weekNum}`} className="space-y-8">
            <div className="flex items-center justify-between sticky top-0 z-10 py-4 bg-background/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="px-6 py-2 rounded-full bg-foreground text-background font-black uppercase tracking-[0.2em] text-xs">
                  Semana {weekNum}
                </div>
                <div className="h-px w-24 bg-border/40" />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest"
                onClick={() => setDays(days.filter(d => d.week_number !== weekNum))}
              >
                Eliminar Semana
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-12">
              {days.filter(d => d.week_number === weekNum).map((day, dIdx) => (
                <div key={day.id} className="space-y-6">
                  {/* Day Header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border/40 flex items-center justify-center font-black text-foreground shrink-0 shadow-sm">
                        {day.day_of_week}
                      </div>
                      <Input 
                        className="bg-transparent border-none font-black text-2xl p-0 h-auto focus-visible:ring-0 uppercase tracking-tighter w-full max-w-md" 
                        value={day.title}
                        onChange={(e) => {
                          const n = [...days]; 
                          const idx = n.findIndex(d => d.id === day.id);
                          n[idx].title = e.target.value; 
                          setDays(n);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const n = [...days];
                          const idx = n.findIndex(d => d.id === day.id);
                          addBlock(idx);
                        }} 
                        className="gap-2 h-10 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-black uppercase tracking-widest text-[10px] px-5"
                      >
                        <Plus className="w-4 h-4" /> Bloque
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all rounded-xl"
                        onClick={() => setDays(days.filter(d => d.id !== day.id))}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Blocks Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {day.workout_blocks.map((block, bIdx) => (
                      <Card key={block.id} className="glass-strong border-white/5 overflow-hidden rounded-[24px] flex flex-col shadow-xl transition-all hover:shadow-primary/5 hover:border-primary/20">
                        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b border-border/20 bg-white/5 shrink-0">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-2 h-6 bg-primary rounded-full" />
                            <input 
                              className="bg-transparent font-black text-sm uppercase tracking-tight outline-none w-full focus:text-primary transition-colors" 
                              value={block.name}
                              onChange={(e) => {
                                const n = [...days];
                                const dIdxInArr = n.findIndex(d => d.id === day.id);
                                n[dIdxInArr].workout_blocks[bIdx].name = e.target.value;
                                setDays(n);
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <select 
                              className="text-[10px] font-black uppercase tracking-widest bg-background/50 border border-border/20 rounded-xl px-3 py-1.5 outline-none hover:border-primary/40 transition-colors cursor-pointer"
                              value={block.type}
                              onChange={(e) => {
                                const n = [...days];
                                const dIdxInArr = n.findIndex(d => d.id === day.id);
                                n[dIdxInArr].workout_blocks[bIdx].type = e.target.value;
                                setDays(n);
                              }}
                            >
                              <option value="warmup">Calentamiento</option>
                              <option value="strength">Fuerza</option>
                              <option value="gymnastics">Gimnasia</option>
                              <option value="metcon">Metcon</option>
                              <option value="accessory">Accesorio</option>
                            </select>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => {
                              const n = [...days];
                              const dIdxInArr = n.findIndex(d => d.id === day.id);
                              n[dIdxInArr].workout_blocks.splice(bIdx, 1);
                              setDays(n);
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col min-h-[160px] bg-card/20">
                          <div className="flex-1">
                            <DndContext 
                              sensors={sensors} 
                              collisionDetection={closestCenter} 
                              onDragEnd={handleDragEnd}
                            >
                              <SortableContext 
                                items={block.workout_movements.map(m => m.id)} 
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="divide-y divide-white/5">
                                  {block.workout_movements.map((mov, mIdx) => (
                                    <SortableMovement 
                                      key={mov.id} 
                                      id={mov.id} 
                                      mov={mov} 
                                      mIdx={mIdx}
                                      updateSets={(val: string) => {
                                        const n = [...days];
                                        const dIdxInArr = n.findIndex(d => d.id === day.id);
                                        n[dIdxInArr].workout_blocks[bIdx].workout_movements[mIdx].sets = parseInt(val) || 0;
                                        setDays(n);
                                      }}
                                      updateReps={(val: string) => {
                                        const n = [...days];
                                        const dIdxInArr = n.findIndex(d => d.id === day.id);
                                        n[dIdxInArr].workout_blocks[bIdx].workout_movements[mIdx].reps = val;
                                        setDays(n);
                                      }}
                                      updateWeight={(val: string) => {
                                        const n = [...days];
                                        const dIdxInArr = n.findIndex(d => d.id === day.id);
                                        n[dIdxInArr].workout_blocks[bIdx].workout_movements[mIdx].weight_percentage = val;
                                        setDays(n);
                                      }}
                                      removeMov={() => {
                                        const n = [...days];
                                        const dIdxInArr = n.findIndex(d => d.id === day.id);
                                        n[dIdxInArr].workout_blocks[bIdx].workout_movements.splice(mIdx, 1);
                                        setDays(n);
                                      }}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                            {block.workout_movements.length === 0 && (
                              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mb-3">
                                  <Dumbbell className="w-6 h-6 text-muted-foreground/30" />
                                </div>
                                <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.2em]">Bloque Vacío</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Add movement button inside block */}
                          <div className="p-4 border-t border-white/5 bg-white/5 mt-auto">
                            <Button 
                              variant="ghost" 
                              className="w-full h-12 border-2 border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground/40 hover:text-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                              onClick={() => {
                                const dIdxInArr = days.findIndex(d => d.id === day.id);
                                setTargetBlock({ dIdx: dIdxInArr, bIdx })
                                setIsSearchOpen(true)
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Añadir Ejercicio
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full py-10 border-2 border-dashed border-border/20 bg-background/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all rounded-[32px] group" 
              onClick={() => addDay(weekNum)}
            >
              <div className="flex items-center justify-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all group-hover:scale-110">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.2em]">Añadir entrenamiento a la semana</span>
              </div>
            </Button>
          </div>
        ))}

        {days.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center glass rounded-[40px] border-dashed border-2 border-border/30 bg-primary/5">
            <Calendar className="w-20 h-20 text-primary/20 mb-8" />
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Planificación Nueva</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-10 leading-relaxed">Define la estructura de entrenamiento por semanas. Podrás asignar este plan a múltiples atletas.</p>
            <Button size="lg" onClick={addWeek} className="font-black uppercase tracking-widest rounded-[24px] px-12 h-16 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              Empezar Semana 1
            </Button>
          </div>
        )}

        <Button 
          variant="default" 
          size="lg" 
          className="w-full py-12 text-xl font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all rounded-[40px] border-4 border-primary/10 bg-foreground text-background" 
          onClick={addWeek}
        >
          <Plus className="w-8 h-8 mr-4" /> Crear Nueva Semana
        </Button>
      </div>

      {/* ── Add Movement Modal ── */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden border-white/10 rounded-[32px] glass-strong shadow-2xl">
          <div className="p-8 pb-6 border-b border-white/5 bg-primary/5">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Dumbbell className="w-6 h-6 text-primary-foreground" />
                </div>
                Explorar Biblioteca
              </DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/30" />
              <Input 
                autoFocus
                placeholder="Buscar por ejercicio o categoría..." 
                className="bg-background/80 border-white/10 pl-14 h-16 rounded-2xl text-xl font-medium focus:ring-primary/20 focus:border-primary/30 transition-all"
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
              />
              {modalSearchTerm && (
                <button 
                  onClick={() => setModalSearchTerm('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-[50vh] overflow-y-auto p-6 space-y-3 bg-black/20 scrollbar-hide">
            {modalFilteredLibrary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modalFilteredLibrary.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => targetBlock && addMovement(targetBlock.dIdx, targetBlock.bIdx, ex)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/10 transition-all group text-left shadow-sm active:scale-95"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary/40 flex items-center justify-center border border-white/5 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all shrink-0">
                        <Dumbbell className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-sm uppercase tracking-tight text-foreground/80 group-hover:text-foreground truncate">{ex.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{ex.category}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary opacity-0 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0 ml-2">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <Search className="w-16 h-16 text-muted-foreground/10 mx-auto mb-6" />
                <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Sin resultados en la biblioteca</p>
              </div>
            )}
          </div>
          <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            <span>Resultados: {modalFilteredLibrary.length}</span>
            <div className="flex items-center gap-2">
              <Info className="w-3 h-3" />
              <span>Haz clic para añadir al bloque</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
