import fs from "fs"
import path from "path"
import matter from "gray-matter"

const notesDirectory = path.join(
  process.cwd(),
  "notes"
)

function getAllFiles(
  dirPath: string,
  arrayOfFiles: string[] = []
) {

  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {

    const fullPath = path.join(
      dirPath,
      file
    )

    if (
      fs.statSync(fullPath).isDirectory()
    ) {

      getAllFiles(
        fullPath,
        arrayOfFiles
      )

    } else if (
      file.endsWith(".md") ||
      file.endsWith(".mdx")
    ) {

      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

export function getAllNotes() {

  const files =
    getAllFiles(notesDirectory)

  return files.map((filePath) => {

    const fileContents =
      fs.readFileSync(filePath, "utf8")

    const {
      data,
      content,
    } = matter(fileContents)

    const relativePath =
      path.relative(
        notesDirectory,
        filePath
      )

    const slug = relativePath
      .replace(/\\/g, "/")
      .replace(/\.mdx?$/, "")

    const parts = slug.split("/")

    return {

      slug,

      title:
        data.title ||
        parts[parts.length - 1],

      category: parts[0],

      subcategory:
        parts.length > 2
          ? parts[1]
          : "general",

      content,
    }
  })
}

export function getNoteBySlug(
  slug: string
) {

  const normalizedSlug =
    slug.replace(/\//g, path.sep)

  const mdPath = path.join(
    notesDirectory,
    `${normalizedSlug}.md`
  )

  const mdxPath = path.join(
    notesDirectory,
    `${normalizedSlug}.mdx`
  )

  let fullPath = ""

  if (fs.existsSync(mdPath)) {

    fullPath = mdPath

  } else if (
    fs.existsSync(mdxPath)
  ) {

    fullPath = mdxPath

  } else {

    return null
  }

  const fileContents =
    fs.readFileSync(fullPath, "utf8")

  const {
    data,
    content,
  } = matter(fileContents)

  return {

    slug,

    title:
      data.title || slug,

    content,
  }
}