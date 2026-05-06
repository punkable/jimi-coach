import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExerciseEditClient } from './exercise-edit-client'

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (!exercise) return notFound()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <header className="flex items-center gap-4">
        <Link
          href="/dashboard/coach/library"
          className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="section-title text-primary mb-1">Biblioteca</p>
          <h1 className="page-title">Editar ejercicio</h1>
        </div>
      </header>

      <ExerciseEditClient exercise={exercise} />
    </div>
  )
}
