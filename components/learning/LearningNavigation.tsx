import Link from "next/link"
import { getNavigationForNote } from "@/lib/notes"
import type { Note } from "@/lib/notes"

interface LearningNavigationProps {
  note: Note
}

function LessonCard({
  direction,
  lesson,
}: {
  direction: "Previous" | "Next"
  lesson: { slug: string; title: string } | null
}) {
  if (!lesson) {
    return null
  }

  const isNext = direction === "Next"

  return (
    <Link
      href={`/notes/${lesson.slug}`}
      className="group relative inline-flex w-[380px] items-center gap-4 rounded-full border border-emerald-500/30 bg-slate-900/80 px-5 py-3.5 transition-all duration-200 ease-out hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95"
      style={{
        animation: "breathingGlow 3s ease-in-out infinite",
      }}
    >
      {isNext ? (
        <>
          <div className="flex-1 text-right">
            <p className="text-base font-bold text-white leading-tight">{lesson.title}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-slate-800/50 transition-all duration-200 group-hover:border-emerald-400/60 group-hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <span className="text-xl font-bold text-emerald-400">→</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-slate-800/50 transition-all duration-200 group-hover:border-emerald-400/60 group-hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <span className="text-xl font-bold text-emerald-400">←</span>
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-white leading-tight">{lesson.title}</p>
          </div>
        </>
      )}
    </Link>
  )
}

export default function LearningNavigation({ note }: LearningNavigationProps) {
  const navigation = getNavigationForNote(note.slug)
  const previous = navigation.previous
  const next = navigation.next

  if (!previous && !next) {
    return null
  }

  return (
    <nav className="mt-12" aria-label="Lesson navigation">
      <div className="flex items-center justify-between gap-8">
        <LessonCard direction="Previous" lesson={previous} />
        <LessonCard direction="Next" lesson={next} />
      </div>
    </nav>
  )
}