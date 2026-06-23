import fs from "fs"
import path from "path"
import matter from "gray-matter"

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

export interface TreeItem {
  name: string
  path: string
  type: "folder" | "file"
  children?: TreeItem[]
  note?: Note
  assessment?: AssessmentQuestion[]
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

function buildTree(dirPath: string, basePath: string = ""): TreeItem[] {
  const items: TreeItem[] = []
  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file)
    const relativePath = path.relative(notesDirectory, fullPath)
    const normalizedPath = relativePath.replace(/\\/g, "/")

    if (fs.statSync(fullPath).isDirectory()) {
      // Check for assessment.json in THIS folder
      let assessmentQuestions: AssessmentQuestion[] | undefined
      const assessmentPath = path.join(fullPath, "assessment.json")
      if (fs.existsSync(assessmentPath) && fs.statSync(assessmentPath).isFile()) {
        try {
          const assessmentContent = fs.readFileSync(assessmentPath, "utf8")
          assessmentQuestions = JSON.parse(assessmentContent)
        } catch (e) {
          console.error(`Error parsing assessment.json in ${fullPath}:`, e)
        }
      }
      
      const children = buildTree(fullPath, normalizedPath)
      items.push({
        name: file,
        path: normalizedPath,
        type: "folder",
        children: children.length > 0 ? children : undefined,
        assessment: assessmentQuestions,
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
    }
  })

  items.sort((a, b) => {
    if (a.type === "folder" && b.type === "file") {
      return -1
    }
    if (a.type === "file" && b.type === "folder") {
      return 1
    }
    return a.name.localeCompare(b.name)
  })

  return items
}

export function getNotesTree(): TreeItem[] {
  return buildTree(notesDirectory)
}

export function getAssessmentByPath(folderPath: string): AssessmentQuestion[] | undefined {
  // Function to find the correct case-insensitive path
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
  const exactFolderPath = findExactPath(notesDirectory, pathParts)
  
  if (!exactFolderPath) {
    return undefined
  }
  
  const assessmentPath = path.join(exactFolderPath, "assessment.json")
  
  if (!fs.existsSync(assessmentPath) || !fs.statSync(assessmentPath).isFile()) {
    return undefined
  }
  
  try {
    const assessmentContent = fs.readFileSync(assessmentPath, "utf8")
    return JSON.parse(assessmentContent)
  } catch (e) {
    console.error(`Error loading assessment.json for path ${folderPath}:`, e)
    return undefined
  }
}