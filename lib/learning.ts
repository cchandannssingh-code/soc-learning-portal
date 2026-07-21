import { getAllNotes, getAssessmentByResourceId, getNoteByLearningId } from "./notes"
import type { Note } from "./notes"

export interface LearningResource {
  id: string
  kind: string
  label: string
  href: string
}

export interface LearningDocument {
  id: string
  title: string
  href: string
}

export interface AssessmentNavigation {
  available: boolean
  href?: string
  questionCount?: number
  estimatedTime: string
  difficulty: string
}

export interface LearningPath {
  label: string
  href?: string
}

interface RegisteredLearningResource {
  href: string
  label?: string
}

// Non-assessment modules register stable IDs here. Markdown never stores routes.
export const learningResourceRegistry: Record<string, Record<string, RegisteredLearningResource>> = {
  scenario: {},
  splunkLab: {},
  threatHunt: {},
}

const resourceLabels: Record<string, string> = {
  assessment: "Take Assessment",
  scenario: "Scenario Investigation",
  splunkLab: "Splunk Investigation Lab",
  threatHunt: "Threat Hunting Lab",
}

export function formatLearningLabel(kind: string): string {
  return kind
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function resolveLearningResource(kind: string, id: string): LearningResource | undefined {
  if (kind === "assessment") {
    const assessment = getAssessmentByResourceId(id)

    return assessment
      ? {
          id,
          kind,
          label: resourceLabels.assessment,
          href: `/assessment/${assessment.slug}`,
        }
      : undefined
  }

  const registeredResource = learningResourceRegistry[kind]?.[id]

  return registeredResource
    ? {
        id,
        kind,
        label: registeredResource.label || resourceLabels[kind] || formatLearningLabel(kind),
        href: registeredResource.href,
      }
    : undefined
}

export function getLearningResources(note: Note): LearningResource[] {
  const requestedResources = [
    ["assessment", note.learning.assessmentId],
    ["scenario", note.learning.scenarioId],
    ["splunkLab", note.learning.splunkLabId],
    ["threatHunt", note.learning.threatHuntId],
    ...Object.entries(note.learning.resources),
  ] as const

  return requestedResources.flatMap(([kind, id]) => {
    if (!id) {
      return []
    }

    const resource = resolveLearningResource(kind, id)
    return resource ? [resource] : []
  })
}

export function getReadingTimeMinutes(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 220))
}

export function getReadingTime(note: Note): number {
  return note.learning.estimatedReadingTime || getReadingTimeMinutes(note.content)
}

export function getAssessmentNavigation(note: Note): AssessmentNavigation {
  const difficulty = note.learning.difficulty || "Intermediate"

  if (!note.learning.assessmentId) {
    return {
      available: false,
      estimatedTime: note.learning.estimatedAssessmentTime
        ? `${note.learning.estimatedAssessmentTime} minutes`
        : "To be announced",
      difficulty,
    }
  }

  const assessment = getAssessmentByResourceId(note.learning.assessmentId)

  if (!assessment) {
    return {
      available: false,
      estimatedTime: note.learning.estimatedAssessmentTime
        ? `${note.learning.estimatedAssessmentTime} minutes`
        : "To be announced",
      difficulty,
    }
  }

  return {
    available: true,
    href: `/assessment/${assessment.slug}`,
    questionCount: assessment.questions.length,
    estimatedTime: note.learning.estimatedAssessmentTime
      ? `${note.learning.estimatedAssessmentTime} minutes`
      : assessment.durationMinutes
        ? `${assessment.durationMinutes} minutes`
        : `${Math.max(1, Math.ceil(assessment.questions.length * 0.75))} minutes`,
    difficulty,
  }
}

export function getLearningPath(note: Note): LearningPath {
  const category = note.learning.category
  const subcategory = note.learning.subcategory
  const label = subcategory || category

  if (!category) {
    return { label: "Learning Library" }
  }

  const path = [category, subcategory]
    .filter((segment): segment is string => Boolean(segment))
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return {
    label: formatLearningLabel(label || category),
    href: `/learning/${path}`,
  }
}

export function getNotesForLearningPath(category: string, subcategory?: string): Note[] {
  const normalizedCategory = category.toLowerCase()
  const normalizedSubcategory = subcategory?.toLowerCase()

  return getAllNotes().filter((note) =>
    note.learning.category?.toLowerCase() === normalizedCategory &&
    (!normalizedSubcategory || note.learning.subcategory?.toLowerCase() === normalizedSubcategory),
  )
}

export function getBreadcrumbLabels(note: Note): string[] {
  const pathLabels = note.slug.split("/").slice(0, -1)
  const categoryLabels = note.learning.category
    ? note.learning.category.split(/[\/_-]+/).filter(Boolean)
    : pathLabels

  return [...categoryLabels.map((label) => formatLearningLabel(label)), note.title]
}
