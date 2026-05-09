'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, Trophy, X, CheckCircle2 } from 'lucide-react'
import { createPersonalRecord } from '../actions'

type Exercise = { id: string; name: string; tracking_type?: string | null }

export function AddPrForm({ exercises }: { exercises: Exercise[] }) {
  const [open, setOpen] = useState(false)
  const [exerciseId, setExerciseId] = useState('')
  const [search, setSearch] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [notes, setNotes] = useState('')
  const [achievedAt, setAchievedAt] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Only weight-based exercises (or those without tracking_type — default to weight)
  const weightExercises = exercises.filter(e =>
    !e.tracking_type || e.tracking_type === 'weight_reps'
  )

  const filtered = search
    ? weightExercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : weightExercises.slice(0, 30)

  const reset = () => {
    setExerciseId(''); setSearch(''); setWeight(''); setReps(''); setNotes('')
    setError(null); setSuccess(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!exerciseId) { setError('Elige un ejercicio'); return }
    const w = parseFloat(weight)
    if (!w || w <= 0) { setError('Peso debe ser mayor a 0'); return }
    setSaving(true)
    const res = await createPersonalRecord({
      exerciseId,
      weight: w,
      reps: reps ? parseInt(reps) : null,
      notes: notes || null,
      achievedAt: new Date(achievedAt).toISOString(),
    })
    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setSuccess(true)
    setTimeout(() => {
      setOpen(false)
      reset()
    }, 800)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full h-11 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-500 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-amber-500/10 transition-all"
      >
        <Trophy className="w-4 h-4" /> Marcar nuevo PR
      </button>
    )
  }

  const selectedName = weightExercises.find(e => e.id === exerciseId)?.name

  return (
    <form onSubmit={handleSave} className="ios-panel p-4 space-y-3 border-amber-500/30">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" /> Nuevo PR
        </p>
        <button type="button" onClick={() => { setOpen(false); reset() }} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Exercise picker */}
      {!exerciseId ? (
        <div className="space-y-2">
          <Input
            placeholder="Buscar ejercicio (con peso)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="h-10"
          />
          <div className="max-h-44 overflow-y-auto rounded-xl border border-border/40 divide-y divide-border/30">
            {filtered.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground text-center">Sin resultados</p>
            ) : (
              filtered.map(ex => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => { setExerciseId(ex.id); setSearch('') }}
                  className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-primary/10 transition-colors"
                >
                  {ex.name}
                </button>
              ))
            )}
          </div>
          <p className="text-[10px] text-muted-foreground italic">Solo ejercicios con peso (snatch, sentadilla, peso muerto, etc.)</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-2 rounded-xl bg-primary/5 border border-primary/15">
          <span className="text-sm font-black uppercase tracking-tight">{selectedName}</span>
          <button type="button" onClick={() => setExerciseId('')} className="text-[10px] font-black text-muted-foreground hover:text-primary uppercase tracking-widest">
            Cambiar
          </button>
        </div>
      )}

      {/* Inputs */}
      {exerciseId && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Peso (kg)</label>
              <Input type="number" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} placeholder="100" className="h-10" autoFocus />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reps (opcional)</label>
              <Input type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder="1" className="h-10" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</label>
            <Input type="date" value={achievedAt} onChange={e => setAchievedAt(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notas (opcional)</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Cómo te sentiste, técnica..." className="resize-none" />
          </div>
        </>
      )}

      {error && (
        <p className="text-[11px] font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={saving || !exerciseId} className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] gap-1.5">
        {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</> :
         success ? <><CheckCircle2 className="w-3.5 h-3.5" /> ¡PR guardado!</> :
         <><Plus className="w-3.5 h-3.5" /> Guardar PR</>}
      </Button>
    </form>
  )
}
