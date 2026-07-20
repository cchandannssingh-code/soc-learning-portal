import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { orderConfig, orderKeyFor } from "./order-config"

const notesDirectory = path.join(process.cwd(), "notes")

export interface Note {
  slug: string
  title: string
  content: string
}

export interface AssessmentQuestion {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface Assessment {
  filename: string
  path: string
  slug: string
  title: string
  questions: AssessmentQuestion[]
}

interface ParsedAssessment {
  title?: string
  questions: AssessmentQuestion[]
}

export interface TreeItem {
  name: string
  path: string
  type: "folder" | "file" | "assessment"
  children?: TreeItem[]
  note?: Note
  assessment?: Assessment
}

function titleFromAssessmentFilename(filename: string): string {
  const name = filename.replace(/\.json$/i, "")

  if (name.toLowerCase() === "assessment") {
    return "Assessment"
  }

  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function normalizeAssessmentQuestion(value: unknown): AssessmentQuestion | undefined {
  if (!value || typeof value !== "object") {
    return undefined
  }

  const question = value as Partial<AssessmentQuestion> & { explanation?: unknown }

  if (
    typeof question.question !== "string" ||
    !Array.isArray(question.options) ||
    question.options.length === 0 ||
    !question.options.every((option) => typeof option === "string") ||
    typeof question.answer !== "number" ||
    !Number.isInteger(question.answer) ||
    question.answer < 0 ||
    question.answer >= question.options.length
  ) {
    return undefined
  }

  return {
    question: question.question,
    options: question.options,
    answer: question.answer,
    explanation: typeof question.explanation === "string" ? question.explanation : "",
  }
}

function normalizeAssessmentData(value: unknown): ParsedAssessment | undefined {
  const questions = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { questions?: unknown }).questions)
      ? (value as { questions: unknown[] }).questions
      : undefined

  if (!questions || questions.length === 0) {
    return undefined
  }

  const normalizedQuestions = questions.map(normalizeAssessmentQuestion)

  if (normalizedQuestions.some((question) => !question)) {
    return undefined
  }

  return {
    title: value && typeof value === "object" && typeof (value as { title?: unknown }).title === "string"
      ? (value as { title: string }).title
      : undefined,
    questions: normalizedQuestions as AssessmentQuestion[],
  }
}

function parseAssessmentFile(filePath: string, folderPath: string): ParsedAssessment | undefined {
  try {
    const assessmentContent = fs.readFileSync(filePath, "utf8")
    const parsed = JSON.parse(assessmentContent)
    const assessment = normalizeAssessmentData(parsed)

    if (!assessment) {
      console.warn(`Skipping invalid assessment schema at ${path.relative(notesDirectory, filePath)} for path ${folderPath}`)
      return undefined
    }

    return assessment
  } catch (e) {
    console.warn(`Error loading assessment file ${path.relative(notesDirectory, filePath)} for path ${folderPath}:`, e)
    return undefined
  }
}

function buildAssessment(filePath: string, folderPath: string): Assessment | undefined {
  const assessment = parseAssessmentFile(filePath, folderPath)

  if (!assessment) {
    return undefined
  }

  const relativePath = path.relative(notesDirectory, filePath)
  const normalizedPath = relativePath.replace(/\\/g, "/")
  const filename = path.basename(filePath)

  return {
    filename,
    path: normalizedPath,
    slug: normalizedPath.replace(/\.json$/i, ""),
    title: assessment.title || titleFromAssessmentFilename(filename),
    questions: assessment.questions,
  }
}

function getAssessmentFilesInFolder(folderPath: string): string[] {
  return fs
    .readdirSync(folderPath)
    .filter((file) => file.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
}

function findExactFolderPath(folderPath: string): string | null {
  function findExactPath(currentDir: string, remainingParts: string[]): string | null {
    if (remainingParts.length === 0) {
      return currentDir
    }

    const targetPart = remainingParts[0].toLowerCase()
    const entries = fs.readdirSync(currentDir)

    for (const entry of entries) {
      if (entry.toLowerCase() === targetPart) {
        const fullEntryPath = path.join(currentDir, entry)
        if (fs.statSync(fullEntryPath).isDirectory()) {
          const result = findExactPath(fullEntryPath, remainingParts.slice(1))
          if (result) {
            return result
          }
        }
      }
    }
    return null
  }

  const pathParts = folderPath.split("/").filter(Boolean)

  return findExactPath(notesDirectory, pathParts)
}

function findExactFilePath(filePath: string): string | null {
  const pathParts = filePath.split("/").filter(Boolean)
  const filename = pathParts.pop()

  if (!filename) {
    return null
  }

  const exactFolderPath = findExactFolderPath(pathParts.join("/"))

  if (!exactFolderPath) {
    return null
  }

  const targetFilename = filename.toLowerCase()
  const entries = fs.readdirSync(exactFolderPath)

  for (const entry of entries) {
    if (entry.toLowerCase() === targetFilename) {
      const fullEntryPath = path.join(exactFolderPath, entry)

      if (fs.statSync(fullEntryPath).isFile()) {
        return fullEntryPath
      }
    }
  }

  return null
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file)

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles)
    } else if (file.endsWith(".md") || file.endsWith(".mdx")) {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

export function getAllNotes(): Note[] {
  const files = getAllFiles(notesDirectory)

  return files.map((filePath) => {
    const fileContents = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(fileContents)
    const relativePath = path.relative(notesDirectory, filePath)
    const slug = relativePath.replace(/\\/g, "/").replace(/\.mdx?$/, "")
    const parts = slug.split("/")

    return {
      slug,
      title: data.title || parts[parts.length - 1],
      content,
    }
  })
}

export function getNoteBySlug(slug: string): Note | null {
  const normalizedSlug = slug.replace(/\//g, path.sep)
  const mdPath = path.join(notesDirectory, `${normalizedSlug}.md`)
  const mdxPath = path.join(notesDirectory, `${normalizedSlug}.mdx`)

  let fullPath = ""

  if (fs.existsSync(mdPath)) {
    fullPath = mdPath
  } else if (fs.existsSync(mdxPath)) {
    fullPath = mdxPath
  } else {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, "utf8")
  const { data, content } = matter(fileContents)

  return {
    slug,
    title: data.title || slug,
    content,
  }
}

function buildTree(dirPath: string): TreeItem[] {
  const items: TreeItem[] = []
  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file)
    const relativePath = path.relative(notesDirectory, fullPath)
    const normalizedPath = relativePath.replace(/\\/g, "/")

    if (fs.statSync(fullPath).isDirectory()) {
      const children = buildTree(fullPath)
      items.push({
        name: file,
        path: normalizedPath,
        type: "folder",
        children: children.length > 0 ? children : undefined,
      })
    } else if (file.endsWith(".md") || file.endsWith(".mdx")) {
      const fileContents = fs.readFileSync(fullPath, "utf8")
      const { data, content } = matter(fileContents)
      const slug = normalizedPath.replace(/\.mdx?$/, "")
      const parts = slug.split("/")

      items.push({
        name: file.replace(/\.mdx?$/, ""),
        path: normalizedPath,
        type: "file",
        note: {
          slug,
          title: data.title || parts[parts.length - 1],
          content,
        },
      })
    } else if (file.toLowerCase().endsWith(".json")) {
      const assessment = buildAssessment(fullPath, path.dirname(normalizedPath))

      if (assessment) {
        items.push({
          name: assessment.title,
          path: normalizedPath,
          type: "assessment",
          assessment,
        })
      }
    }
  })

  items.sort((a, b) => {
    const aOrder = orderConfig[orderKeyFor(a.path)]
    const bOrder = orderConfig[orderKeyFor(b.path)]

    // Explicit order wins, regardless of folder/file type.
    if (aOrder !== undefined && bOrder !== undefined) {
      return aOrder - bOrder
    }
    if (aOrder !== undefined) {
      return -1
    }
    if (bOrder !== undefined) {
      return 1
    }

    // Fallback for anything not in orderConfig: folders first, then
    // alphabetical -- same behavior as before.
    if (a.type === "folder" && b.type !== "folder") {
      return -1
    }
    if (a.type !== "folder" && b.type === "folder") {
      return 1
    }
    return a.name.localeCompare(b.name)
  })

  return items
}

export function getNotesTree(): TreeItem[] {
  return buildTree(notesDirectory)
}

export function getAssessmentsByPath(folderPath: string): Assessment[] {
  const exactFolderPath = findExactFolderPath(folderPath)

  if (!exactFolderPath) {
    return []
  }

  return getAssessmentFilesInFolder(exactFolderPath).flatMap((filename) => {
    const assessmentPath = path.join(exactFolderPath, filename)

    if (!fs.statSync(assessmentPath).isFile()) {
      return []
    }

    const assessment = buildAssessment(assessmentPath, folderPath)

    if (!assessment) {
      return []
    }

    return [assessment]
  })
}

export function getAssessmentBySlug(slug: string): Assessment | undefined {
  const directAssessmentPath = findExactFilePath(`${slug}.json`)

  if (directAssessmentPath) {
    return buildAssessment(directAssessmentPath, path.dirname(slug))
  }

  const legacyFolderPath = findExactFolderPath(slug)

  if (!legacyFolderPath) {
    return undefined
  }

  const legacyAssessmentPath = path.join(legacyFolderPath, "assessment.json")

  if (!fs.existsSync(legacyAssessmentPath) || !fs.statSync(legacyAssessmentPath).isFile()) {
    return undefined
  }

  return buildAssessment(legacyAssessmentPath, slug)
}

export function getAssessmentByPath(folderPath: string): AssessmentQuestion[] | undefined {
  const assessments = getAssessmentsByPath(folderPath)

  if (assessments.length === 0) {
    return undefined
  }

  const legacyAssessment = assessments.find((assessment) => assessment.filename.toLowerCase() === "assessment.json")

  if (legacyAssessment) {
    return legacyAssessment.questions
  }

  return assessments[0].questions
}
