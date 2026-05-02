import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const exercisesData = [
  {
    name: 'Thruster',
    category: 'weightlifting',
    difficulty_level: 'intermedio',
    instructions: 'Sentadilla frontal profunda seguida de un empuje estricto (press) en un solo movimiento fluido. Mantén los codos altos y usa la cadera para impulsar la barra hacia arriba.',
    video_url: 'https://www.youtube.com/watch?v=L219ltL15zk'
  },
  {
    name: 'Pull Up',
    category: 'gymnastics',
    difficulty_level: 'principiante',
    instructions: 'Dominada estricta o con kipping. Asegúrate de pasar la barbilla por encima de la barra y extender completamente los brazos abajo.',
    video_url: 'https://www.youtube.com/watch?v=lzwrXmAeb1U'
  },
  {
    name: 'Double Under',
    category: 'monostructural',
    difficulty_level: 'intermedio',
    instructions: 'Salto de cuerda donde la cuerda pasa dos veces por debajo de tus pies en un solo salto. Mantén las manos pegadas a la cadera y salta con la punta de los pies.',
    video_url: 'https://www.youtube.com/watch?v=82jNjDS19jc'
  },
  {
    name: 'Snatch',
    category: 'weightlifting',
    difficulty_level: 'avanzado',
    instructions: 'Arrancada. Lleva la barra desde el suelo hasta por encima de la cabeza en un solo movimiento continuo. Requiere mucha técnica y movilidad.',
    video_url: 'https://www.youtube.com/watch?v=1uR1Aol3e5Y'
  },
  {
    name: 'Burpee',
    category: 'gymnastics',
    difficulty_level: 'principiante',
    instructions: 'Tírate al suelo, toca con el pecho el piso, levántate y da un pequeño salto aplaudiendo sobre tu cabeza.',
    video_url: 'https://www.youtube.com/watch?v=auN1tHvuZ1g'
  }
]

async function seed() {
  console.log("Starting CrossFit data seed...")
  
  // Get an admin or coach user to be the creator
  const { data: users } = await supabase.from('profiles').select('id').in('role', ['admin', 'coach']).limit(1)
  if (!users || users.length === 0) {
    console.error("No coach/admin found to create data.")
    return
  }
  const coachId = users[0].id

  // 1. Insert Exercises
  const insertedExercises = []
  for (const ex of exercisesData) {
    const { data, error } = await supabase.from('exercises').insert({
      ...ex,
      created_by: coachId
    }).select().single()
    if (error) console.log(`Error inserting ${ex.name}:`, error.message)
    if (data) insertedExercises.push(data)
  }
  console.log(`Inserted ${insertedExercises.length} real exercises.`)

  // 2. Create "Fran" Workout Plan
  const { data: plan, error: planErr } = await supabase.from('workout_plans').insert({
    title: 'Benchmark: FRAN',
    description: 'El WOD más famoso de CrossFit. Un sprint puro de Thrusters y Pull Ups (21-15-9). No deberías tardar más de 7 minutos.',
    objective: 'Metcon (Sprint)',
    level: 'RX',
    created_by: coachId
  }).select().single()

  if (planErr) {
    console.error("Error creating plan:", planErr)
    return
  }

  // 3. Create Day 1
  const { data: day } = await supabase.from('workout_days').insert({
    plan_id: plan.id,
    day_of_week: 1,
    title: 'Día de Prueba - Fran'
  }).select().single()

  // 4. Create Block
  const { data: block } = await supabase.from('workout_blocks').insert({
    workout_day_id: day.id,
    name: 'WOD: Fran',
    type: 'metcon',
    order_index: 0
  }).select().single()

  // 5. Add Movements to Block
  const thruster = insertedExercises.find(e => e.name === 'Thruster')
  const pullup = insertedExercises.find(e => e.name === 'Pull Up')

  if (thruster && pullup) {
    await supabase.from('workout_movements').insert([
      {
        block_id: block.id,
        exercise_id: thruster.id,
        sets: 1,
        reps: '21-15-9',
        weight_percentage: '95lb/65lb',
        notes: 'Unbroken si es posible.',
        order_index: 0
      },
      {
        block_id: block.id,
        exercise_id: pullup.id,
        sets: 1,
        reps: '21-15-9',
        notes: 'Kipping o Butterfly.',
        order_index: 1
      }
    ])
    console.log("Created FRAN workout successfully.")
  }

  // 6. Assign to all athletes for testing
  const { data: athletes } = await supabase.from('profiles').select('id').eq('role', 'athlete')
  for (const athlete of (athletes || [])) {
    await supabase.from('assigned_plans').insert({
      plan_id: plan.id,
      athlete_id: athlete.id,
      assigned_by: coachId,
      start_date: new Date().toISOString().split('T')[0]
    })
  }
  console.log(`Assigned FRAN to ${athletes?.length || 0} athletes.`)
}

seed()
