import type { Note } from "@/lib/notes"
import { getAssessmentNavigation, getBreadcrumbLabels, getReadingTime } from "@/lib/learning"

interface LearningHeaderProps {
  note: Note
}

const defaultObjectives = [
  "Understand the core concepts in this lesson",
  "Apply the investigation workflow",
  "Identify useful detection and hunting opportunities",
]

export default function LearningHeader({ note }: LearningHeaderProps) {
  const objectives = note.learning.objectives.length > 0 ? note.learning.objectives : defaultObjectives
  const assessment = getAssessmentNavigation(note)

  return (
    <section className="mb-6 rounded-xl border border-slate-800 bg-slate-950 px-5 py-4 text-slate-100 shadow-sm md:px-6" aria-label="Learning overview">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-400">
        {getBreadcrumbLabels(note).map((label, index, labels) => (
          <span key={`${label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span className="text-slate-600" aria-hidden="true">/</span>}
            <span className={index === labels.length - 1 ? "text-slate-200" : ""}>{label}</span>
          </span>
        ))}
      </nav>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="font-display text-xl font-bold text-white md:text-2xl">{note.title}</p>
          {note.learning.eventId && <p className="mt-1 text-sm text-slate-400">Event ID {note.learning.eventId}</p>}
        </div>
        <dl className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-md border border-cyan-900/70 bg-cyan-950/50 px-3 py-2">
            <dt className="text-cyan-400">Difficulty</dt>
            <dd className="mt-0.5 font-semibold text-cyan-100">{note.learning.difficulty || "Intermediate"}</dd>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
            <dt className="text-slate-400">Reading time</dt>
            <dd className="mt-0.5 font-semibold text-slate-100">{getReadingTime(note)} min</dd>
          </div>
          <div className="rounded-md border border-violet-900/70 bg-violet-950/50 px-3 py-2">
            <dt className="text-violet-300">Assessment</dt>
            <dd className="mt-0.5 font-semibold text-violet-100">{assessment.available ? `~${assessment.estimatedTime}` : "Coming soon"}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4">
        <p className="text-sm font-semibold text-slate-200">By the end of this page you will be able to:</p>
        <ul className="mt-2 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          {objectives.map((objective) => (
            <li key={objective} className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-400" aria-hidden="true">✓</span>
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
