import { getAssessmentByPath } from "@/lib/notes"
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
  
  // Get custom assessment questions if they exist
  const customQuestions = getAssessmentByPath(fullPath)
  const questions = customQuestions || defaultQuestions

  return <AssessmentClient questions={questions} folderName={folderName} />
}
