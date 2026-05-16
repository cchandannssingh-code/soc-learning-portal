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
          background: "#161b22",
          overflowY: "auto",
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
                ▼ {category}
              </h2>

              {/* NOTES + ASSESSMENT */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  paddingLeft: "12px",
                }}
              >

                {/* NOTE FILES */}
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
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "transparent",
                        transition: "0.3s",
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

                {/* ASSESSMENT BUTTON */}
                <Link
                  href={`/assessment/${category}`}
                  style={{
                    color: "#00d9ff",
                    textDecoration: "none",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border:
                      "1px solid rgba(0,217,255,0.3)",
                    marginTop: "6px",
                    fontWeight: "bold",
                    background:
                      "rgba(0,217,255,0.08)",
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
            boxShadow:
              "0 0 30px rgba(0,0,0,0.4)",
          }}
        >

          <h1
            style={{
              fontSize: "48px",
              marginBottom: "20px",
            }}
          >
            SOC Learning Portal
          </h1>

          <p
            style={{
              fontSize: "20px",
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