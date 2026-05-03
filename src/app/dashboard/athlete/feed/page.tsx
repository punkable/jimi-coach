import { createClient } from '@/lib/supabase/server'
import { toggleFistBump } from './actions'

const typeEmoji: Record<string, string> = {
  workout_done: '🏋️',
  pr_set: '🏆',
  streak: '🔥',
  feedback_received: '💬',
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: feedEntries } = await supabase
    .from('activity_feed')
    .select(`
      *,
      profiles:athlete_id(full_name, avatar_url),
      fist_bumps(from_athlete_id)
    `)
    .order('created_at', { ascending: false })
    .limit(40)

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl border-b border-border/30 px-4 h-14 flex items-center justify-between">
        <h1 className="text-base font-black uppercase tracking-tight">Box Feed</h1>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {feedEntries && feedEntries.length > 0 ? (
          feedEntries.map((entry: any) => {
            const bumps = entry.fist_bumps ?? []
            const myBump = bumps.find((b: any) => b.from_athlete_id === user?.id)
            const isBumped = !!myBump

            return (
              <div key={entry.id} className="glass rounded-2xl p-4 border border-border/30">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-secondary/50 border border-border/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {entry.profiles?.avatar_url ? (
                      <img src={entry.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-muted-foreground leading-none">
                        {entry.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-sm leading-tight uppercase tracking-tight truncate">
                          {entry.profiles?.full_name || 'Atleta'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(entry.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-lg shrink-0">{typeEmoji[entry.type] || '💪'}</span>
                    </div>

                    {entry.content && (
                      <p className="text-sm text-foreground/80 mt-2 leading-relaxed font-medium">
                        {entry.content}
                      </p>
                    )}

                    {/* Fist Bump */}
                    <form action={async () => {
                      'use server'
                      await toggleFistBump(entry.id, isBumped)
                    }} className="mt-3">
                      <button
                        type="submit"
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                          isBumped
                            ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_rgba(var(--primary),0.2)]'
                            : 'bg-secondary/30 border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        <span className="text-base">👊</span>
                        <span>{bumps.length} Fist Bump{bumps.length !== 1 ? 's' : ''}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-6">👊</div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">El feed está vacío</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Cuando tus compañeros completen entrenamientos, aparecerán aquí. ¡Sé el primero!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
