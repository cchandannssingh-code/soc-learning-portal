"use client";

import { useState } from "react";

const questions = [
  
  
  {
  question: "What does Event ID 4720 indicate?",
  options: [
    "User account created",
    "User account deleted",
    "Password reset",
    "Successful logon"
  ],
  answer: 0,
  explanation: "Event ID 4720 is generated when a new user account is created."
}
];

export default function Defender() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

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
            Restart Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Defender
          </h1>
          <p className="text-slate-500">
            Question {current + 1} of {questions.length}
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 leading-relaxed mb-8">
          {q.question}
        </h2>

        <div className="space-y-4">
          {q.options.map((option, index) => {
            const isCorrect = index === q.answer;
            const isSelected = index === selected;
            let classes =
              "w-full text-left px-5 py-4 rounded-xl border transition text-[15px]";

            if (!showAnswer) {
              classes += isSelected
                ? " bg-blue-50 border-blue-500"
                : " bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50";
            } else {
              if (isCorrect) {
                classes += " bg-green-50 border-green-500 text-green-900";
              } else if (isSelected && !isCorrect) {
                classes += " bg-red-50 border-red-500 text-red-900";
              } else {
                classes += " bg-white border-slate-200";
              }
            }

            return (
              <button
                key={index}
                disabled={showAnswer}
                onClick={() => setSelected(index)}
                className={classes}
              >
                {option}
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Explanation
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {q.explanation}
            </p>
          </div>
        )}

        <div className="mt-10">
          {!showAnswer ? (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
