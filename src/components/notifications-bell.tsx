'use client'

import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  title: string
  message: string
  is_read: boolean
  link: string | null
  created_at: string
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Add new notification and increment count
          setNotifications(prev => [payload.new as Notification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  const markAsRead = async (id: string, link: string | null) => {
    // Optimistic UI
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))

    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    
    if (link) {
      setIsOpen(false)
      router.push(link)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative hover:bg-secondary" />}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden glass">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-bold text-sm">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground">
              <Check className="w-3 h-3 mr-1" /> Marcar todas leídas
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No tienes notificaciones
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id, n.link)}
                  className={`flex flex-col items-start p-4 text-left hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0 ${n.is_read ? 'opacity-60' : 'bg-primary/5'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <span className="font-semibold text-sm leading-none">{n.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70 mt-2 font-mono">
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
