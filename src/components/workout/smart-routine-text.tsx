import { Video } from 'lucide-react'

interface SmartRoutineTextProps {
  text: string
  exercises: any[]
  blockExercises?: any[]
  onVideoClick: (videoUrl: string, name: string) => void
}

export function SmartRoutineText({ text, exercises, blockExercises, onVideoClick }: SmartRoutineTextProps) {
  if (!text) return null
  
  // 1. Prepare names for auto-linking (from the block's movements)
  const autoLinkNames = (blockExercises || [])
    .filter(ex => ex?.name)
    .map(ex => ex.name)
    .sort((a: string, b: string) => b.length - a.length)

  // 2. Identify if we even need to process
  if (autoLinkNames.length === 0 && !text.includes('[')) {
    return <div className="text-[14px] text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">{text}</div>
  }

  // 3. Create Regex: Matches [Any Name] or any of the autoLinkNames
  const escapedNames = autoLinkNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const pattern = `(\\[.*?\\]${escapedNames ? `|\\b(?:${escapedNames})\\b` : ''})`
  const regex = new RegExp(pattern, 'gi')
  
  const parts = text.split(regex)
  
  return (
    <div className="text-[14px] text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!part) return null

        let exerciseName = ''
        let exercise: any = null

        // Check if part is a [Tag]
        if (part.startsWith('[') && part.includes(']')) {
          const bracketEnd = part.indexOf(']')
          exerciseName = part.slice(1, bracketEnd)
          const trailingText = part.slice(bracketEnd + 1)
          
          exercise = exercises.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase())
          
          if (exercise?.video_url) {
            return (
              <span key={i} className="inline-flex items-center gap-1 group">
                <span className="font-bold text-foreground">{exerciseName}</span>
                <button 
                  type="button"
                  onClick={() => onVideoClick(exercise.video_url, exercise.name)}
                  className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-all align-middle shadow-sm border border-primary/20"
                >
                  <Video className="w-3 h-3" />
                </button>
                {trailingText}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        } 
        
        // Check if part is a plain exercise name (auto-link)
        exercise = blockExercises?.find(ex => ex?.name?.toLowerCase() === part.toLowerCase())
        if (exercise?.video_url) {
          return (
            <span key={i} className="inline-flex items-center gap-1 group">
              <span className="font-bold text-foreground">{part}</span>
              <button 
                type="button"
                onClick={() => onVideoClick(exercise.video_url, exercise.name)}
                className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-all align-middle shadow-sm border border-primary/20"
              >
                <Video className="w-3 h-3" />
              </button>
            </span>
          )
        }

        return <span key={i}>{part}</span>
      })}
    </div>
  )
}
