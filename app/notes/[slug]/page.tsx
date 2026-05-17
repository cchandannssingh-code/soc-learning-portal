import { getNoteBySlug } from "@/lib/notes"
import ReactMarkdown from "react-markdown"

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const note = getNoteBySlug(slug)

  if (!note) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-red-600">
          Note Not Found
        </h1>
      </div>
    )
  }

  return (
    <div className="space-y-6">
    

      <div className="prose max-w-none">
        <ReactMarkdown>
          {note.content || "No content available"}
        </ReactMarkdown>
      </div>
    </div>
  )
}