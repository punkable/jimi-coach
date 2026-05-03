'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Dumbbell, Save, Loader2, Search, X, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { savePlanStructure } from '../../actions'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableMovement } from './SortableMovement'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Types based on our Supabase schema
type Exercise = { id: string, name: string, category: string, difficulty_level: string }
type Movement = { id?: string, exercise_id: string, exercise?: Exercise, sets: number, reps: string, weight_percentage: string, notes: string }
type Block = { id?: string, name: string, type: string, workout_movements: Movement[] }
type Day = { id?: string, day_of_week: number, title: string, week_number: number, workout_blocks: Block[] }

export function BuilderClient({ planId, initialDays, library }: { planId: string, initialDays: any[], library: Exercise[] }) {
  const [days, setDays] = useState<Day[]>(initialDays.length > 0 ? initialDays : [])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Modal state for adding exercises to a specific block
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [targetBlock, setTargetBlock] = useState<{ dIdx: number, bIdx: number } | null>(null)
  const [modalSearchTerm, setModalSearchTerm] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: any, dIdx: number, bIdx: number) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setDays((prevDays) => {
        const newDays = [...prevDays]
        const block = newDays[dIdx].workout_blocks[bIdx]
        const oldIndex = block.workout_movements.findIndex((m: any) => (m.id || m.exercise_id) === active.id)
        const newIndex = block.workout_movements.findIndex((m: any) => (m.id || m.exercise_id) === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          block.workout_movements = arrayMove(block.workout_movements, oldIndex, newIndex)
        }
        return newDays
      })
    }
  }

  const addDay = (weekNum: number) => {
    const daysInWeek = days.filter(d => d.week_number === weekNum).length
    setDays([...days, { week_number: weekNum, day_of_week: daysInWeek + 1, title: `Día ${daysInWeek + 1}`, workout_blocks: [] }])
  }

  const addWeek = () => {
    const nextWeek = Math.max(0, ...days.map(d => d.week_number || 1)) + 1
    setDays([...days, { week_number: nextWeek, day_of_week: 1, title: 'Día 1', workout_blocks: [] }])
  }

  const addBlock = (dayIndex: number) => {
    const newDays = [...days]
    newDays[dayIndex].workout_blocks.push({ name: 'Nuevo Bloque', type: 'strength', workout_movements: [] })
    setDays(newDays)
  }

  const addMovement = (dIdx: number, bIdx: number, exercise: Exercise) => {
    const newDays = [...days]
    newDays[dIdx].workout_blocks[bIdx].workout_movements.push({
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
      await savePlanStructure(planId, days)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredLibrary = library.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()))
  const modalFilteredLibrary = library.filter(ex => ex.name.toLowerCase().includes(modalSearchTerm.toLowerCase()))

  return (
    <div className="flex flex-1 gap-6 overflow-hidden h-full relative">
      {/* Save Button */}
      <div className="absolute -top-14 right-0 flex gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 h-11">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Planificación
        </Button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-12 pb-24 scrollbar-hide">
        {Array.from(new Set(days.map(d => d.week_number || 1))).sort().map(weekNum => (
          <div key={`week-${weekNum}`} className="space-y-6 bg-secondary/5 p-4 md:p-8 rounded-3xl border border-border/40">
            <div className="flex items-center justify-between px-2">
              <h1 className="text-4xl font-black text-foreground uppercase tracking-tight">Semana {weekNum}</h1>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                setDays(days.filter(d => d.week_number !== weekNum))
              }}>
                Eliminar Semana
              </Button>
            </div>
            
            <div className="space-y-8">
              {days.map((day, dIdx) => day.week_number === weekNum && (
                <div key={dIdx} className="space-y-4">
                  <div className="flex items-center justify-between bg-card/40 p-4 rounded-2xl border border-border/30">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="font-black text-primary uppercase text-xs">D{day.day_of_week}</span>
                      </div>
                      <Input 
                        className="bg-transparent border-none font-bold text-xl p-0 h-auto focus-visible:ring-0 w-64" 
                        value={day.title}
                        onChange={(e) => {
                          const n = [...days]; n[dIdx].title = e.target.value; setDays(n);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => addBlock(dIdx)} className="gap-2 h-9 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest text-[10px]">
                        <Plus className="w-3.5 h-3.5" /> Bloque
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hover:text-destructive" onClick={() => {
                        setDays(days.filter((_, i) => i !== dIdx))
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {day.workout_blocks.map((block, bIdx) => (
                      <Card key={bIdx} className="glass border-border/40 overflow-hidden rounded-2xl flex flex-col shadow-sm">
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/30 bg-secondary/10 shrink-0">
                          <input 
                            className="bg-transparent font-black text-sm uppercase tracking-tight outline-none w-1/2" 
                            value={block.name}
                            onChange={(e) => {
                              const newDays = [...days]; newDays[dIdx].workout_blocks[bIdx].name = e.target.value; setDays(newDays);
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <select 
                              className="text-[10px] font-bold uppercase tracking-widest bg-background/50 border border-border/30 rounded-lg px-2 py-1 outline-none appearance-none"
                              value={block.type}
                              onChange={(e) => {
                                const newDays = [...days]; newDays[dIdx].workout_blocks[bIdx].type = e.target.value; setDays(newDays);
                              }}
                            >
                              <option value="warmup">Warmup</option>
                              <option value="strength">Strength</option>
                              <option value="gymnastics">Gym</option>
                              <option value="metcon">Metcon</option>
                            </select>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/30 hover:text-destructive" onClick={() => {
                              const n = [...days]; n[dIdx].workout_blocks.splice(bIdx, 1); setDays(n);
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col min-h-[120px]">
                          <div className="flex-1 divide-y divide-border/20">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, dIdx, bIdx)}>
                              <SortableContext items={block.workout_movements.map((m: any) => m.id || m.exercise_id)} strategy={verticalListSortingStrategy}>
                                {block.workout_movements.map((mov, mIdx) => (
                                  <SortableMovement 
                                    key={mov.id || mov.exercise_id} 
                                    id={mov.id || mov.exercise_id} 
                                    mov={mov} 
                                    mIdx={mIdx}
                                    updateSets={(val: string) => { const n = [...days]; n[dIdx].workout_blocks[bIdx].workout_movements[mIdx].sets = parseInt(val) || 0; setDays(n); }}
                                    updateReps={(val: string) => { const n = [...days]; n[dIdx].workout_blocks[bIdx].workout_movements[mIdx].reps = val; setDays(n); }}
                                    updateWeight={(val: string) => { const n = [...days]; n[dIdx].workout_blocks[bIdx].workout_movements[mIdx].weight_percentage = val; setDays(n); }}
                                    removeMov={() => { const n = [...days]; n[dIdx].workout_blocks[bIdx].workout_movements.splice(mIdx, 1); setDays(n); }}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                            {block.workout_movements.length === 0 && (
                              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/20 m-3 rounded-xl">
                                <Dumbbell className="w-8 h-8 text-muted-foreground/20 mb-2" />
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Sin ejercicios</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Add movement button inside block */}
                          <div className="p-3 border-t border-border/20 bg-secondary/5">
                            <Button 
                              variant="ghost" 
                              className="w-full h-10 border border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                              onClick={() => {
                                setTargetBlock({ dIdx, bIdx })
                                setIsSearchOpen(true)
                              }}
                            >
                              <Plus className="w-3.5 h-3.5 mr-2" /> Añadir Ejercicio
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="w-full py-8 border-2 border-dashed border-border/40 bg-background/30 hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all rounded-2xl group" onClick={() => addDay(weekNum)}>
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">Añadir día a la planificación</span>
              </div>
            </Button>
          </div>
        ))}

        {days.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-3xl border-dashed border-2 border-border/40">
            <Calendar className="w-16 h-16 text-muted-foreground/20 mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Planificación Vacía</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">Comienza creando tu primera semana de entrenamiento para este atleta.</p>
            <Button size="lg" onClick={addWeek} className="font-black uppercase tracking-widest rounded-2xl px-10 h-14 shadow-xl shadow-primary/20">
              Crear Semana 1
            </Button>
          </div>
        )}

        <Button variant="default" size="lg" className="w-full py-10 text-xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all rounded-3xl border-4 border-primary/20" onClick={addWeek}>
          <Plus className="w-8 h-8 mr-4" /> Crear Nueva Semana
        </Button>
      </div>

      {/* Sidebar Library - Optional but kept for quick reference */}
      <div className="hidden 2xl:flex w-80 border-l border-border/30 bg-card/40 backdrop-blur-xl p-6 flex-col gap-6 shadow-2xl h-full rounded-l-3xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Librería Global</span>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Biblioteca</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input 
              placeholder="Buscar..." 
              className="bg-background/50 border-border/30 pl-10 h-12 rounded-xl focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
          {filteredLibrary.map(ex => (
            <div key={ex.id} className="p-4 bg-background/40 border border-border/20 rounded-2xl shadow-sm hover:border-primary/40 cursor-pointer transition-all group relative">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-sm uppercase tracking-tight text-foreground/80 group-hover:text-primary transition-colors">{ex.name}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">{ex.category}</span>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => {
                   if (days.length > 0 && days[0].workout_blocks.length > 0) {
                     addMovement(0, 0, ex)
                   }
                 }}>
                   <Plus className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Movement Modal */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-xl w-[90vw] p-0 overflow-hidden border-border/40 rounded-3xl glass-strong">
          <div className="p-6 pb-0 border-b border-border/20 bg-secondary/10">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Dumbbell className="w-6 h-6 text-primary" />
                Añadir Ejercicio
              </DialogTitle>
            </DialogHeader>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
              <Input 
                autoFocus
                placeholder="Buscar por nombre, categoría o grupo muscular..." 
                className="bg-background/60 border-border/30 pl-12 h-14 rounded-2xl text-lg focus:ring-primary/20"
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
              />
              {modalSearchTerm && (
                <button 
                  onClick={() => setModalSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 bg-secondary/5 scrollbar-hide">
            {modalFilteredLibrary.length > 0 ? (
              modalFilteredLibrary.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => targetBlock && addMovement(targetBlock.dIdx, targetBlock.bIdx, ex)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/20 hover:border-primary/40 hover:bg-primary/5 transition-all group text-left shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/40 flex items-center justify-center border border-border/30 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                      <Dumbbell className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-bold text-base uppercase tracking-tight text-foreground/80 group-hover:text-foreground">{ex.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{ex.category}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/30 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Plus className="w-5 h-5" />
                  </div>
                </button>
              ))
            ) : (
              <div className="py-20 text-center">
                <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">No encontramos resultados</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
