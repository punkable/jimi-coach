'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GripVertical, Trash2, Dumbbell, Save, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { savePlanStructure } from '../../actions'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableMovement } from './SortableMovement'

// Types based on our Supabase schema
type Exercise = { id: string, name: string, category: string, difficulty_level: string }
type Movement = { id?: string, exercise_id: string, exercise?: Exercise, sets: number, reps: string, weight_percentage: string, notes: string }
type Block = { id?: string, name: string, type: string, workout_movements: Movement[] }
type Day = { id?: string, day_of_week: number, title: string, week_number: number, workout_blocks: Block[] }

export function BuilderClient({ planId, initialDays, library }: { planId: string, initialDays: any[], library: Exercise[] }) {
  const [days, setDays] = useState<Day[]>(initialDays.length > 0 ? initialDays : [])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
        // Use a unique drag_id for matching
        const oldIndex = block.workout_movements.findIndex((m: any) => (m.id || m.exercise_id) === active.id)
        const newIndex = block.workout_movements.findIndex((m: any) => (m.id || m.exercise_id) === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          block.workout_movements = arrayMove(block.workout_movements, oldIndex, newIndex)
        }
        return newDays
      })
    }
  }

  const filteredLibrary = library.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()))

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

  const addMovement = (dayIndex: number, blockIndex: number, exercise: Exercise) => {
    const newDays = [...days]
    newDays[dayIndex].workout_blocks[blockIndex].workout_movements.push({
      exercise_id: exercise.id,
      exercise: exercise,
      sets: 3,
      reps: '10',
      weight_percentage: '',
      notes: ''
    })
    setDays(newDays)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await savePlanStructure(planId, days)
      // Success feedback could go here
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-1 gap-6 overflow-hidden h-full relative">
      {/* Save Button Absolute Top Right of Builder */}
      <div className="absolute -top-14 right-0">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg hover:scale-105 transition-transform">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Plan
        </Button>
      </div>

      {/* Main Canvas - Days and Blocks */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-12 pb-24">
        {Array.from(new Set(days.map(d => d.week_number || 1))).sort().map(weekNum => (
          <div key={`week-${weekNum}`} className="space-y-6 bg-secondary/5 p-6 rounded-2xl border border-border/50">
            <h1 className="text-3xl font-black text-foreground">Semana {weekNum}</h1>
            
            {days.map((day, dIdx) => day.week_number === weekNum && (
              <div key={dIdx} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-primary">{day.title}</h2>
                  <Button variant="outline" size="sm" onClick={() => addBlock(dIdx)} className="gap-2">
                    <Plus className="w-4 h-4" /> Añadir Bloque
                  </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {day.workout_blocks.map((block, bIdx) => (
                    <Card key={bIdx} className="glass border-border/50">
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/50 bg-secondary/10">
                        <input 
                          className="bg-transparent font-bold text-lg outline-none w-1/2" 
                          value={block.name}
                          onChange={(e) => {
                            const newDays = [...days]; newDays[dIdx].workout_blocks[bIdx].name = e.target.value; setDays(newDays);
                          }}
                        />
                        <select 
                          className="text-xs bg-transparent outline-none border border-border rounded px-2 py-1 text-muted-foreground"
                          value={block.type}
                          onChange={(e) => {
                            const newDays = [...days]; newDays[dIdx].workout_blocks[bIdx].type = e.target.value; setDays(newDays);
                          }}
                        >
                          <option className="bg-background" value="warmup">Warmup</option>
                          <option className="bg-background" value="strength">Strength</option>
                          <option className="bg-background" value="gymnastics">Gymnastics</option>
                          <option className="bg-background" value="metcon">Metcon</option>
                        </select>
                      </CardHeader>
                      <CardContent className="p-0">
                        {block.workout_movements.length === 0 ? (
                          <div className="p-6 text-center text-sm text-muted-foreground border-2 border-dashed border-border/50 m-4 rounded-lg">
                            Arrastra ejercicios o haz click en la librería.
                          </div>
                        ) : (
                          <div className="divide-y divide-border/50">
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
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full py-6 border-2 border-dashed bg-transparent hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => addDay(weekNum)}>
              <Plus className="w-5 h-5 mr-2" /> Añadir Día a la Semana {weekNum}
            </Button>
          </div>
        ))}

        {days.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">Comienza añadiendo una semana a tu planificación.</div>
        )}

        <Button variant="default" size="lg" className="w-full py-8 text-lg font-bold shadow-xl hover:scale-[1.02] transition-transform" onClick={addWeek}>
          <Plus className="w-6 h-6 mr-2" /> CREAR NUEVA SEMANA
        </Button>
      </div>

      {/* Sidebar Library */}
      <div className="w-80 border-l border-border/50 bg-card/30 backdrop-blur rounded-xl p-4 flex flex-col gap-4 shadow-2xl h-full">
        <div>
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-primary" /> Librería
          </h3>
          <Input 
            placeholder="Buscar ejercicios..." 
            className="bg-background/50 border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredLibrary.map(ex => (
            <div key={ex.id} className="p-3 bg-background/80 border border-border/30 rounded-lg shadow-sm hover:border-primary/50 cursor-pointer transition-all group relative">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">{ex.name}</span>
                <span className="text-[9px] uppercase text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{ex.category}</span>
              </div>
              
              {/* Overlay for quick add */}
              <div className="absolute inset-0 bg-primary/90 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {days.length > 0 && days[days.length - 1].workout_blocks.length > 0 ? (
                  <Button size="sm" variant="secondary" className="scale-90" onClick={() => addMovement(days.length - 1, days[days.length - 1].workout_blocks.length - 1, ex)}>
                    Añadir al último bloque
                  </Button>
                ) : (
                  <span className="text-xs text-primary-foreground font-medium">Crea un bloque primero</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
