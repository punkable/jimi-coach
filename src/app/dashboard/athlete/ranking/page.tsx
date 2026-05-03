import { createClient } from '@/lib/supabase/server'
import { RankingClient } from './ranking-client'

export default async function RankingPage() {
  const supabase = await createClient()

  // Fetch all athletes and their stats
  // We include workout_results and personal_records to calculate the score
  const { data: athletes } = await supabase
    .from('profiles')
    .select(`
      id, 
      full_name, 
      avatar_url,
      emoji,
      workout_results(id, completed),
      personal_records(id)
    `)
    .eq('role', 'athlete')

  // Process data for leaderboard
  const leaderboard = athletes?.map(a => {
    const wodsDone = a.workout_results?.filter((r: any) => r.completed).length || 0
    const prsCount = a.personal_records?.length || 0
    // Simple point system: 10 pts per WOD, 50 pts per PR
    const points = (wodsDone * 10) + (prsCount * 50)
    
    return {
      id: a.id,
      name: a.full_name || 'Atleta Anónimo',
      avatar: a.avatar_url,
      emoji: a.emoji || '💪',
      wods: wodsDone,
      prs: prsCount,
      points
    }
  }).sort((a, b) => b.points - a.points) || []

  return <RankingClient leaderboard={leaderboard} />
}
