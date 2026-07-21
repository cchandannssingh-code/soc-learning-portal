import remarkGfm from "remark-gfm"
import { getNoteBySlug } from "@/lib/notes"
import ReactMarkdown from "react-markdown"
import rehypeSlug from "rehype-slug"
import LearningNavigation from "@/components/learning/LearningNavigation"

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {

  const resolvedParams =
    await params

  const slug =
    resolvedParams.slug.join("/")

  const note =
    getNoteBySlug(slug)

  if (!note) {

    return (
      <div className="text-red-500 text-2xl font-bold">
        Note Not Found
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div className="prose max-w-none">

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug]}
        >
          {note.content}
        </ReactMarkdown>

      </div>

      <LearningNavigation note={note} />

    </div>
  )
}
