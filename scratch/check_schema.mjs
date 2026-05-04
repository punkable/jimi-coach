import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'workout_days' })
  if (error) {
    // If RPC doesn't exist, try a simple query
    const { data: sample, error: queryError } = await supabase.from('workout_days').select('*').limit(1)
    if (queryError) {
      console.error('Error fetching sample:', queryError)
    } else {
      console.log('Columns in workout_days:', Object.keys(sample[0] || {}))
    }
  } else {
    console.log('Columns:', data)
  }
}

checkSchema()
