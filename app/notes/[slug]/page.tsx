import fs from "fs";
import path from "path";
import Link from "next/link";

function getNotes() {

  const notesPath = path.join(
    process.cwd(),
    "notes"
  );

  const categories =
    fs.readdirSync(notesPath);

  return categories.map((category) => {

    const categoryPath = path.join(
      notesPath,
      category
    );

    const files = fs
      .readdirSync(categoryPath)
      .filter((file) =>
        file.endsWith(".md")
      );

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
        flexWrap: "wrap",
        minHeight: "100vh",
        background: "#0f1117",
        color: "white",
      }}
    >

      {/* SIDEBAR */}
      <div
        style={{
          width: "100%",
          maxWidth: "320px",
          borderRight: "1px solid #333",
          padding: "20px",
          background: "#161b22",
          overflowY: "auto",
        }}
      >

        <h1
          style={{
            fontSize: "24px",
            marginBottom: "35px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          SOC Portal
        </h1>

        {notes.map((section) => {

          const hasFiles =
            section.files.length > 0;

          return (
            <div
              key={section.category}
              style={{
                marginBottom: "30px",
              }}
            >

              {/* CATEGORY */}
              <Link
                href={
                  hasFiles
                    ? `/notes/${section.files[0].replace(".md", "")}`
                    : "#"
                }
                style={{
                  color: "#00d9ff",
                  marginBottom: "14px",
                  fontSize: "15px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  display: "block",
                  fontWeight: "bold",
                }}
              >
                ▼ {section.category}
              </Link>

              {/* NOTES */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  paddingLeft: "10px",
                }}
              >

                {hasFiles &&
                  section.files.map((file) => {

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

                          textDecoration:
                            "none",

                          padding: "9px 12px",

                          borderRadius:
                            "12px",

                          background: isActive
                            ? "rgba(0,217,255,0.1)"
                            : "transparent",

                          transition: "0.3s",

                          fontSize: "14px",
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

                {/* ASSESSMENT */}
                <Link
                  href={`/assessment/${section.category}`}
                  style={{
                    color: "#00d9ff",
                    textDecoration: "none",
                    padding: "9px 12px",
                    borderRadius: "12px",
                    border:
                      "1px solid rgba(0,217,255,0.3)",
                    marginTop: "4px",
                    fontWeight: "bold",
                    background:
                      "rgba(0,217,255,0.08)",
                    fontSize: "14px",
                  }}
                >
                  📝 Assessment
                </Link>

              </div>

            </div>
          );
        })}

      </div>

      {/* CONTENT */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          minWidth: "300px",
        }}
      >

        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            background: "#161b22",
            borderRadius: "24px",
            padding: "35px",
            lineHeight: "1.8",
            fontSize: "16px",
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