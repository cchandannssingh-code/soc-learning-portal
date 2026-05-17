import fs from "fs";
import path from "path";
import Link from "next/link";

export default function HomePage() {

  const notesPath = path.join(
    process.cwd(),
    "notes"
  );

  const categories =
    fs.readdirSync(notesPath);

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

      {/* LEFT SIDEBAR */}
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

        {categories.map((category) => {

          const categoryPath = path.join(
            notesPath,
            category
          );

          const files = fs
            .readdirSync(categoryPath)
            .filter((file) =>
              file.endsWith(".md")
            );

          return (
            <div
              key={category}
              style={{
                marginBottom: "30px",
              }}
            >

              {/* CATEGORY */}
              <Link
                href={`/notes/${files[0].replace(".md", "")}`}
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
                ▼ {category}
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

                {files.map((file) => {

                  const slug =
                    file.replace(".md", "");

                  return (
                    <Link
                      key={slug}
                      href={`/notes/${slug}`}
                      style={{
                        color: "#ddd",
                        textDecoration: "none",
                        padding: "9px 12px",
                        borderRadius: "12px",
                        background: "transparent",
                        transition: "0.3s",
                        fontSize: "14px",
                      }}
                    >
                      ▶{" "}
                      {slug.replace(
                        /-/g,
                        " "
                      )}
                    </Link>
                  );
                })}

                {/* ASSESSMENT */}
                <Link
                  href={`/assessment/${category}`}
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

      {/* RIGHT CONTENT */}
      <div
        style={{
          flex: 1,
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
            boxShadow:
              "0 0 30px rgba(0,0,0,0.4)",
          }}
        >

          <h1
            style={{
              fontSize: "36px",
              marginBottom: "20px",
            }}
          >
            SOC Learning Portal
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "#aaa",
              lineHeight: "1.8",
            }}
          >
            Select notes or assessments
            from the left sidebar.
          </p>

        </div>

      </div>

    </div>
  );
}