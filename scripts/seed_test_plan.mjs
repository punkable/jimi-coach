import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log("Starting seed...")
  const { data: assignments } = await supabase.from('assigned_plans').select('*').limit(1)
  if (!assignments || assignments.length === 0) {
    console.log("No assigned plans found.")
    return
  }
  const planId = assignments[0].plan_id
  
  let { data: exercises } = await supabase.from('exercises').select('id').limit(1)
  if (!exercises || exercises.length === 0) {
    console.log("No exercises found in DB. Creating one...")
    const { data: ex } = await supabase.from('exercises').insert({ name: 'Push Up' }).select()
    exercises = ex
  }
  const exerciseId = exercises[0].id

  // Check if day already exists
  const { data: existingDays } = await supabase.from('workout_days').select('*').eq('plan_id', planId)
  if (existingDays && existingDays.length > 0) {
     console.log("Plan already has days. Skipping seed.")
     // Lets force inject a movement to the first block if it has one.
     const dayId = existingDays[0].id
     const { data: existingBlocks } = await supabase.from('workout_blocks').select('*').eq('workout_day_id', dayId)
     if (existingBlocks && existingBlocks.length > 0) {
       const blockId = existingBlocks[0].id
       await supabase.from('workout_movements').insert({
         block_id: blockId,
         exercise_id: exerciseId,
         sets: 3,
         reps: '10',
         order_index: 0
       })
       console.log("Injected movement into existing block.")
     } else {
       const { data: block } = await supabase.from('workout_blocks').insert({
         workout_day_id: dayId,
         name: 'Warm up',
         order_index: 0
       }).select()
       await supabase.from('workout_movements').insert({
         block_id: block[0].id,
         exercise_id: exerciseId,
         sets: 3,
         reps: '10',
         order_index: 0
       })
       console.log("Injected block and movement into existing day.")
     }
     return
  }

  const { data: day } = await supabase.from('workout_days').insert({
    plan_id: planId,
    day_of_week: 1,
    title: 'Día 1: Full Body'
  }).select()
  const dayId = day[0].id

  const { data: block, error: blockErr } = await supabase.from('workout_blocks').insert({
    workout_day_id: dayId,
    name: 'Workout',
    order_index: 0
  }).select()
  if (blockErr) console.error("BLOCK ERROR:", blockErr)
  const blockId = block?.[0]?.id

  await supabase.from('workout_movements').insert({
    block_id: blockId,
    exercise_id: exerciseId,
    sets: 3,
    reps: '15',
    order_index: 0
  })

  console.log("Successfully injected dummy data into the plan.")
}

seed()
