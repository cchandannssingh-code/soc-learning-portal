import { getAssessmentBySlug } from "@/lib/notes"
import AssessmentClient from "./AssessmentClient"

// Default questions (fallback)
const defaultQuestions = [
  {
    question: "What is this assessment about?",
    options: [
      "Windows security",
      "Kerberos",
      "This folder's content",
      "Nothing",
    ],
    answer: 2,
    explanation: "This assessment is for this specific folder's content.",
  },
]

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params
  const slugArray = resolvedParams.slug || []
  const fullPath = slugArray.join("/")
  const folderName = slugArray.length > 0 ? slugArray[slugArray.length - 1] : "Assessment"
  
  const assessment = getAssessmentBySlug(fullPath)

  if (!assessment) {
    return <AssessmentClient questions={defaultQuestions} title={`${folderName} Assessment`} />
  }

  return <AssessmentClient questions={assessment.questions} title={assessment.title} />
}
