"use client";

import { useState } from "react";

const questions = [
  {
    question:
      "Which account hash is required to create a Golden Ticket?",

    options: [
      "Administrator",
      "KRBADMIN",
      "krbtgt",
      "CIFS",
    ],

    answer: 2,

    explanation:
      "Golden Tickets require the krbtgt hash to forge Kerberos TGTs.",
  },

  {
    question:
      "Which Kerberos ticket is forged during a Golden Ticket attack?",

    options: [
      "TGS",
      "AS-REP",
      "TGT",
      "NTLM Token",
    ],

    answer: 2,

    explanation:
      "Golden Ticket attacks forge fake TGTs for domain-wide access.",
  },

  {
    question:
      "Which attack specifically abuses service account SPNs?",

    options: [
      "Pass-the-Hash",
      "Kerberoasting",
      "DCSync",
      "Skeleton Key",
    ],

    answer: 1,

    explanation:
      "Kerberoasting abuses SPNs to request crackable TGS tickets.",
  },

  {
    question:
      "Which Event ID is most associated with Kerberos Service Ticket requests?",

    options: [
      "4624",
      "4768",
      "4769",
      "4662",
    ],

    answer: 2,

    explanation:
      "Event ID 4769 logs Kerberos TGS requests.",
  },

  {
    question:
      "A forged TGS without contacting the Domain Controller most likely indicates:",

    options: [
      "Golden Ticket",
      "AS-REP Roasting",
      "Silver Ticket",
      "DCSync",
    ],

    answer: 2,

    explanation:
      "Silver Tickets bypass the DC by forging service tickets directly.",
  },
];

export default function AssessmentPage() {

  const [current, setCurrent] = useState(0);

  const [selectedAnswers, setSelectedAnswers] =
    useState<{ [key: number]: number }>({});

  const [score, setScore] = useState(0);

  const [completed, setCompleted] =
    useState(false);

  const q = questions[current];

  const selected =
    selectedAnswers[current];

  function handleSelectAnswer(
    index: number
  ) {

    if (
      selectedAnswers[current] !== undefined
    ) {
      return;
    }

    setSelectedAnswers((prev) => ({
      ...prev,
      [current]: index,
    }));

    if (index === q.answer) {

      setScore((prev) => prev + 1);
    }
  }

  function handleNext() {

    if (
      current < questions.length - 1
    ) {

      setCurrent(current + 1);
    }
  }

  function handlePrevious() {

    if (current > 0) {

      setCurrent(current - 1);
    }
  }

  function restartQuiz() {

    setCurrent(0);

    setSelectedAnswers({});

    setScore(0);

    setCompleted(false);
  }

  if (completed) {

    return (
      <div className="max-w-4xl mx-auto">

        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">

          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Assessment Complete
          </h1>

          <p className="text-lg text-slate-600 mb-8">
            Your Score: {score} / {questions.length}
          </p>

          <button
            onClick={restartQuiz}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition"
          >
            Retake Assessment
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">

      <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">

        {/* HEADER */}

        <div className="mb-8 flex items-start justify-between gap-4">

          <div>

            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              AD Credential Attack Assessment
            </h1>

            <p className="text-slate-500">
              Question {current + 1} of {questions.length}
            </p>

          </div>

          <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl min-w-[100px] text-center">

            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
              Score
            </p>

            <p className="text-2xl font-bold text-blue-700">
              {score}
            </p>

          </div>

        </div>

        {/* QUESTION */}

        <h2 className="text-2xl font-semibold text-slate-800 leading-relaxed mb-8">
          {q.question}
        </h2>

        {/* OPTIONS */}

        <div className="space-y-4">

          {q.options.map((option, index) => {

            const isCorrect =
              index === q.answer;

            const isSelected =
              index === selected;

            const answered =
              selected !== undefined;

            let classes =
              "w-full text-left px-5 py-4 rounded-xl border transition text-[15px]";

            if (!answered) {

              classes +=
                " bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50";

            } else {

              if (isCorrect) {

                classes +=
                  " bg-green-50 border-green-500 text-green-900";

              } else if (
                isSelected &&
                !isCorrect
              ) {

                classes +=
                  " bg-red-50 border-red-500 text-red-900";

              } else {

                classes +=
                  " bg-white border-slate-200";
              }
            }

            return (
              <button
                key={index}
                disabled={answered}
                onClick={() =>
                  handleSelectAnswer(index)
                }
                className={classes}
              >
                {option}
              </button>
            );
          })}

        </div>

        {/* EXPLANATION */}

        {selected !== undefined && (

          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5">

            <p className="text-slate-700 leading-relaxed">
              {q.explanation}
            </p>

          </div>
        )}

        {/* BUTTONS */}

        <div className="mt-10 flex items-center justify-end gap-4 flex-wrap">

          {current > 0 && (

            <button
              onClick={handlePrevious}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-xl font-medium transition"
            >
              Back
            </button>

          )}

          {current < questions.length - 1 ? (

            <button
              onClick={handleNext}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Next
            </button>

          ) : (

            <button
              onClick={() =>
                setCompleted(true)
              }
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Final Submit
            </button>

          )}

        </div>

      </div>

    </div>
  );
}