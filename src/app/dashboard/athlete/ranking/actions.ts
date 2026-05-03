'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function seedDemoWod() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No user' }

  // 1. Create Exercises if they don't exist
  const exercises = [
    { name: 'Back Squat', category: 'weightlifting', instructions: 'Barra tras nuca, bajar rompiendo el paralelo.' },
    { name: 'Thrusters', category: 'weightlifting', instructions: 'Sentadilla frontal + Press sobre la cabeza.' },
    { name: 'Pullups', category: 'gymnastics', instructions: 'Dominadas estrictas o con kipping.' },
    { name: 'Burpees', category: 'monostructural', instructions: 'Pecho al suelo y salto con palmada.' }
  ]

  for (const ex of exercises) {
    const { data: existing } = await supabase.from('exercises').select('id').eq('name', ex.name).single()
    if (!existing) {
      await supabase.from('exercises').insert({ ...ex, created_by: user.id })
    }
  }

  // 2. Fetch created exercises
  const { data: exList } = await supabase.from('exercises').select('*')
  const exMap = Object.fromEntries(exList?.map(e => [e.name, e.id]) || [])

  // 3. Create a Demo Plan
  const { data: plan, error: planError } = await supabase.from('workout_plans').insert({
    title: 'WOD Demo Completo',
    description: 'Sesión de prueba con múltiples bloques.',
    objective: 'Fuerza y Metcon intenso.',
    level: 'intermediate',
    created_by: user.id
  }).select().single()

  if (planError) return { error: planError.message }

  // 4. Create a Workout Day
  const { data: day } = await supabase.from('workout_days').insert({
    plan_id: plan.id,
    day_of_week: 1,
    title: 'Lunes de Prueba'
  }).select().single()

  // 5. Create Blocks
  const blocks = [
    { name: 'A. Warmup', type: 'warmup', order_index: 0 },
    { name: 'B. Fuerza', type: 'strength', order_index: 1 },
    { name: 'C. Metcon', type: 'metcon', order_index: 2 }
  ]

  for (const b of blocks) {
    const { data: block } = await supabase.from('workout_blocks').insert({
      workout_day_id: day.id,
      ...b
    }).select().single()

    // 6. Add movements to blocks
    if (b.type === 'warmup') {
      await supabase.from('workout_movements').insert([
        { block_id: block.id, exercise_id: exMap['Burpees'], reps: '10', order_index: 0 }
      ])
    } else if (b.type === 'strength') {
      await supabase.from('workout_movements').insert([
        { block_id: block.id, exercise_id: exMap['Back Squat'], sets: 5, reps: '5', weight_percentage: '75%', order_index: 0 }
      ])
    } else if (b.type === 'metcon') {
      await supabase.from('workout_movements').insert([
        { block_id: block.id, exercise_id: exMap['Thrusters'], sets: 3, reps: '21-15-9', order_index: 0 },
        { block_id: block.id, exercise_id: exMap['Pullups'], sets: 3, reps: '21-15-9', order_index: 1 }
      ])
    }
  }

  // 7. Assign plan to self
  await supabase.from('assigned_plans').insert({
    plan_id: plan.id,
    athlete_id: user.id,
    start_date: new Date().toISOString().split('T')[0],
    assigned_by: user.id
  })

  revalidatePath('/dashboard/athlete')
  return { success: true }
}
