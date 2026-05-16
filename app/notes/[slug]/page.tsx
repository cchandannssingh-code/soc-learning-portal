import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export async function generateStaticParams() {
  const notesDirectory = path.join(process.cwd(), "notes");

  const files = fs.readdirSync(notesDirectory);

  return files.map((file) => ({
    slug: file.replace(".md", ""),
  }));
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const filePath = path.join(
    process.cwd(),
    "notes",
    `${slug}.md`
  );

  const fileContent = fs.readFileSync(filePath, "utf8");

  const { content } = matter(fileContent);

  const processedContent = await remark()
    .use(html)
    .process(content);

  const contentHtml = processedContent.toString();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <article
        dangerouslySetInnerHTML={{
          __html: contentHtml,
        }}
      />
    </main>
  );
}