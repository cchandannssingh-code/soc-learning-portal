import Link from "next/link"
import { formatLearningLabel, getNotesForLearningPath } from "@/lib/learning"

export default async function LearningPathPage({
  params,
}: {
  params: Promise<{ path?: string[] }>
}) {
  const { path = [] } = await params
  const [category, subcategory] = path
  const notes = category ? getNotesForLearningPath(category, subcategory) : []
  const title = subcategory || category

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Learning Path</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">
        {title ? formatLearningLabel(title) : "Learning Library"}
      </h1>
      <p className="mt-3 text-slate-600">Choose a lesson to continue learning.</p>

      {notes.length > 0 ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {notes.map((note) => (
            <Link key={note.slug} href={`/notes/${note.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{note.learning.difficulty || "Lesson"}</span>
              <h2 className="mt-2 font-display text-lg font-bold text-slate-900">{note.title}</h2>
              {note.learning.eventId && <p className="mt-1 text-sm text-slate-500">Event ID {note.learning.eventId}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-slate-500">
          No lessons have been added to this learning path yet.
        </p>
      )}
    </section>
  )
}
