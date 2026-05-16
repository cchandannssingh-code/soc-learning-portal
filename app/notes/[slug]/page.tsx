import fs from "fs";
import path from "path";
import Link from "next/link";

function getNotes() {

  const notesPath = path.join(process.cwd(), "notes");

  const categories = fs.readdirSync(notesPath);

  return categories.map((category) => {

    const categoryPath = path.join(notesPath, category);

    const files = fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith(".md"));

    return {
      category,
      files,
    };
  });
}

function findMarkdownFile(
  dir: string,
  slug: string
): string | null {

  const items = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  for (const item of items) {

    const fullPath = path.join(
      dir,
      item.name
    );

    if (item.isDirectory()) {

      const result = findMarkdownFile(
        fullPath,
        slug
      );

      if (result) return result;
    }

    if (
      item.isFile() &&
      item.name === `${slug}.md`
    ) {
      return fullPath;
    }
  }

  return null;
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {

  const { slug } = await params;

  const notes = getNotes();

  const notesDir = path.join(
    process.cwd(),
    "notes"
  );

  const filePath = findMarkdownFile(
    notesDir,
    slug
  );

  if (!filePath) {
    return <div>Note not found</div>;
  }

  const content = fs.readFileSync(
    filePath,
    "utf8"
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0f1117",
        color: "white",
      }}
    >

      {/* LEFT SIDEBAR */}
      <div
        style={{
          width: "320px",
          borderRight: "1px solid #333",
          padding: "24px",
          overflowY: "auto",
          background: "#161b22",
        }}
      >

        <h1
          style={{
            fontSize: "30px",
            marginBottom: "40px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          SOC Portal
        </h1>

        {notes.map((section) => (

          <div
            key={section.category}
            style={{
              marginBottom: "35px",
            }}
          >

            {/* CATEGORY */}
            <h2
              style={{
                color: "#00d9ff",
                marginBottom: "16px",
                fontSize: "18px",
                textTransform: "uppercase",
              }}
            >
              ▼ {section.category}
            </h2>

            {/* SUBHEADINGS */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                paddingLeft: "12px",
              }}
            >

              {section.files.map((file) => {

                const currentSlug =
                  file.replace(".md", "");

                const isActive =
                  currentSlug === slug;

                return (
                  <Link
                    key={currentSlug}
                    href={`/notes/${currentSlug}`}
                    style={{
                      color: isActive
                        ? "#00d9ff"
                        : "#ddd",

                      textDecoration: "none",

                      padding: "12px 14px",

                      borderRadius: "12px",

                      background: isActive
                        ? "rgba(0,217,255,0.1)"
                        : "transparent",

                      transition: "0.3s",
                    }}
                  >
                    ▶{" "}
                    {currentSlug.replace(
                      /-/g,
                      " "
                    )}
                  </Link>
                );
              })}

            </div>

          </div>
        ))}

      </div>

      {/* RIGHT CONTENT */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "60px",
        }}
      >

        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            background: "#161b22",
            borderRadius: "24px",
            padding: "50px",
            lineHeight: "1.9",
            fontSize: "18px",
            boxShadow:
              "0 0 30px rgba(0,0,0,0.4)",
          }}
        >

          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
            }}
          >
            {content}
          </pre>

        </div>

      </div>

    </div>
  );
}