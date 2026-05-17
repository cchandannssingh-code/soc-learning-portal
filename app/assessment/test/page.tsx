"use client";

import { useState } from "react";

const questions = [
  {
    question:
      "What does Event ID 4648 represent?",

    options: [
      "Failed logon",
      "Explicit credential usage",
      "Service installation",
      "Kerberos ticket deletion",
    ],

    answer: 1,

    explanation:
      "Event ID 4648 is generated when explicit credentials are supplied.",
  },

  {
    question:
      "Which process commonly triggers Event ID 4648?",

    options: [
      "notepad.exe",
      "calc.exe",
      "runas.exe",
      "mspaint.exe",
    ],

    answer: 2,

    explanation:
      "runas.exe commonly uses alternate credentials.",
  },

  {
    question:
      "Which Windows component handles authentication?",

    options: [
      "explorer.exe",
      "lsass.exe",
      "chrome.exe",
      "taskmgr.exe",
    ],

    answer: 1,

    explanation:
      "LSASS handles authentication and security token creation.",
  },

  {
    question:
      "Which protocol is preferred in Active Directory?",

    options: [
      "FTP",
      "SNMP",
      "Kerberos",
      "SSH",
    ],

    answer: 2,

    explanation:
      "Kerberos is the default authentication protocol in AD.",
  },

  {
    question:
      "Which event commonly correlates with 4648?",

    options: [
      "4624",
      "1102",
      "7040",
      "5158",
    ],

    answer: 0,

    explanation:
      "4624 indicates successful logon activity.",
  },
];

export default function WindowsAssessment() {

  const [current, setCurrent] = useState(0);

  const [selected, setSelected] =
    useState<number | null>(null);

  const [showAnswer, setShowAnswer] =
    useState(false);

  const [score, setScore] = useState(0);

  const [completed, setCompleted] =
    useState(false);

  const q = questions[current];

  function handleSubmit() {

    if (selected === null) return;

    setShowAnswer(true);

    if (selected === q.answer) {
      setScore(score + 1);
    }
  }

  function handleNext() {

    setSelected(null);

    setShowAnswer(false);

    if (current + 1 < questions.length) {

      setCurrent(current + 1);

    } else {

      setCompleted(true);
    }
  }

  function restartQuiz() {

    setCurrent(0);

    setSelected(null);

    setShowAnswer(false);

    setScore(0);

    setCompleted(false);
  }

  if (completed) {

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f1117",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
        }}
      >

        <div
          style={{
            background: "#161b22",
            padding: "50px",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "700px",
          }}
        >

          <h1
            style={{
              fontSize: "38px",
              marginBottom: "20px",
            }}
          >
            Assessment Complete
          </h1>

          <p
            style={{
              fontSize: "22px",
              marginBottom: "30px",
            }}
          >
            Score: {score} / {questions.length}
          </p>

          <button
            onClick={restartQuiz}
            style={{
              background: "#00d9ff",
              color: "black",
              border: "none",
              padding: "14px 28px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Restart Assessment
          </button>

        </div>

      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        color: "white",
        padding: "50px",
      }}
    >

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#161b22",
          padding: "50px",
          borderRadius: "24px",
        }}
      >

        <h1
          style={{
            fontSize: "40px",
            marginBottom: "10px",
          }}
        >
          Windows Assessment
        </h1>

        <p
          style={{
            color: "#aaa",
            marginBottom: "40px",
          }}
        >
          Question {current + 1} of {questions.length}
        </p>

        <h2
          style={{
            fontSize: "28px",
            marginBottom: "30px",
            lineHeight: "1.5",
          }}
        >
          {q.question}
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >

          {q.options.map((option, index) => {

            const isCorrect =
              index === q.answer;

            const isSelected =
              index === selected;

            let background = "#222";

            if (showAnswer) {

              if (isCorrect) {
                background = "#14532d";
              }

              if (
                isSelected &&
                !isCorrect
              ) {
                background = "#7f1d1d";
              }
            }

            return (
              <button
                key={index}
                disabled={showAnswer}
                onClick={() =>
                  setSelected(index)
                }
                style={{
                  background,
                  color: "white",
                  border: isSelected
                    ? "2px solid #00d9ff"
                    : "1px solid #444",
                  padding: "18px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "18px",
                  transition: "0.3s",
                }}
              >
                {option}
              </button>
            );
          })}

        </div>

        {showAnswer && (

          <div
            style={{
              marginTop: "30px",
              background: "#222",
              padding: "24px",
              borderRadius: "16px",
              lineHeight: "1.8",
            }}
          >

            <h3
              style={{
                marginBottom: "10px",
              }}
            >
              Explanation
            </h3>

            <p>{q.explanation}</p>

          </div>
        )}

        <div
          style={{
            marginTop: "40px",
          }}
        >

          {!showAnswer ? (

            <button
              onClick={handleSubmit}
              style={{
                background: "#00d9ff",
                color: "black",
                border: "none",
                padding: "14px 28px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Submit
            </button>

          ) : (

            <button
              onClick={handleNext}
              style={{
                background: "#00d9ff",
                color: "black",
                border: "none",
                padding: "14px 28px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Next Question
            </button>

          )}

        </div>

      </div>

    </div>
  );
}