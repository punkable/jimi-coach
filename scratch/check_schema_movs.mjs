import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  try {
    const { data: sample, error: queryError } = await supabase.from('workout_movements').select('*').limit(1)
    if (queryError) {
      console.error('Error fetching sample:', queryError)
    } else {
      console.log('Columns in workout_movements:', Object.keys(sample[0] || {}))
    }
  } catch (err) {
    console.error('Execution error:', err)
  }
}

checkSchema()
