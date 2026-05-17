import fs from "fs"
import path from "path"
import matter from "gray-matter"

const contentDirectory = path.join(process.cwd(), "notes")

export function getAllNotes() {
  const categories = fs.readdirSync(contentDirectory)

  let notes: any[] = []

  categories.forEach((category) => {
    const categoryPath = path.join(contentDirectory, category)

    const files = fs.readdirSync(categoryPath)

    files.forEach((file) => {
      if (
        !file.endsWith(".md") &&
        !file.endsWith(".mdx")
      ) {
        return
      }

      const filePath = path.join(categoryPath, file)

      const fileContent = fs.readFileSync(
        filePath,
        "utf8"
      )

      const { data } = matter(fileContent)

      notes.push({
        slug: file
          .replace(".md", "")
          .replace(".mdx", ""),

        category,

        title:
          data.title ||
          file
            .replace(".md", "")
            .replace(".mdx", ""),
      })
    })
  })

  return notes
}

export function getNoteBySlug(slug: string) {
  const categories = fs.readdirSync(contentDirectory)

  for (const category of categories) {
    const mdPath = path.join(
      contentDirectory,
      category,
      `${slug}.md`
    )

    const mdxPath = path.join(
      contentDirectory,
      category,
      `${slug}.mdx`
    )

    const filePath = fs.existsSync(mdPath)
      ? mdPath
      : mdxPath

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(
        filePath,
        "utf8"
      )

      const { data, content } = matter(fileContent)

      return {
        slug,
        category,
        title: data.title || slug,
        content,
      }
    }
  }

  return null
}