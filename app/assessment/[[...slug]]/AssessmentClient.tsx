"use client";

import { useState } from "react";
import { AssessmentQuestion } from "@/lib/notes";

interface AssessmentClientProps {
  questions: AssessmentQuestion[];
  folderName: string;
}

export default function AssessmentClient({ questions, folderName }: AssessmentClientProps) {
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
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-10 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-lg shadow-cyan-900/30">
              <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              Assessment Complete!
            </h1>
            <p className="text-lg text-slate-600">
              Great job completing the assessment
            </p>
          </div>

          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-8 mb-8 text-center">
            <p className="text-slate-700 mb-2 font-medium">Your Score</p>
            <p className="text-6xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              {score}
              <span className="text-3xl font-bold text-slate-500 mx-2">/</span>
              {questions.length}
            </p>
          </div>

          <button
            onClick={restartQuiz}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 shadow-lg shadow-cyan-900/30 hover:shadow-xl hover:shadow-cyan-900/40 hover:-translate-y-0.5"
          >
            Restart Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <svg className="h-8 w-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {folderName.charAt(0).toUpperCase() + folderName.slice(1)} Assessment
            </h1>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <p className="text-lg font-medium">
              Question {current + 1} of {questions.length}
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700 bg-cyan-50 px-4 py-2 rounded-xl border border-cyan-200">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {score} point{score !== 1 ? 's' : ''} earned
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 leading-relaxed mb-8">
          {q.question}
        </h2>

        <div className="space-y-4 mb-8">
          {q.options.map((option, index) => {
            const isCorrect = index === q.answer;
            const isSelected = index === selected;
            let classes =
              "w-full text-left px-6 py-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-base font-medium";

            if (!showAnswer) {
              classes += isSelected
                ? " bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-500 text-blue-900 shadow-md"
                : " bg-white border-slate-200 text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 hover:shadow-sm";
            } else {
              if (isCorrect) {
                classes += " bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-900 shadow-md";
              } else if (isSelected && !isCorrect) {
                classes += " bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-900 shadow-md";
              } else {
                classes += " bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed opacity-60";
              }
            }

            return (
              <button
                key={index}
                disabled={showAnswer}
                onClick={() => setSelected(index)}
                className={classes}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showAnswer && isCorrect && (
                    <svg className="h-6 w-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {showAnswer && isSelected && !isCorrect && (
                    <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <div className="mb-10 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Explanation
            </h3>
            <p className="text-slate-700 leading-relaxed text-base">
              {q.explanation}
            </p>
          </div>
        )}

        <div>
          {!showAnswer ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className={`w-full font-bold py-4 px-8 rounded-2xl transition-all duration-200 ${
                selected === null
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/30 hover:shadow-xl hover:shadow-cyan-900/40 hover:-translate-y-0.5"
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 hover:-translate-y-0.5"
            >
              {current + 1 < questions.length ? "Next Question" : "Finish Assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
