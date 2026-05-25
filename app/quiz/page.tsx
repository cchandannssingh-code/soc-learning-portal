
"use client";

import Link from "next/link";
import { useState } from "react";
import { quizzes } from "@/data/quizzes";

type QuizType = {
  title: string;
  questions: {
    question: string;
    options: string[];
    answer: string;
  }[];
};

export default function QuizHomePage() {

  const quizEntries = Object.entries(quizzes) as [string, QuizType][];

  const [sessionName, setSessionName] = useState("batch-a");

  return (
    <div className="min-h-screen bg-black text-white p-8">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-12">

          <h1 className="text-5xl font-bold mb-4">
            SOC Quiz Portal
          </h1>

          <p className="text-gray-400 text-lg">
            Realtime Multiplayer Assessment Platform
          </p>

        </div>

        {/* SESSION GENERATOR */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">

          <h2 className="text-2xl font-bold mb-4">
            Session Generator
          </h2>

          <input
            type="text"
            value={sessionName}
            onChange={(e) =>
              setSessionName(e.target.value)
            }
            placeholder="Enter session name"
            className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-700 mb-4"
          />

          <p className="text-gray-400 text-sm">
            Example:
            <span className="text-blue-400 ml-2">
              SOC-MAY-2026
            </span>
          </p>

        </div>

        {/* QUIZ GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {quizEntries.map(([slug, quiz]) => (

            <div
              key={slug}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >

              {/* TITLE */}
              <h2 className="text-2xl font-bold mb-3">
                {quiz.title}
              </h2>

              {/* DESCRIPTION */}
              <p className="text-gray-400 mb-6">
                Multiplayer synchronized quiz assessment.
              </p>

              {/* STATS */}
              <div className="space-y-3 mb-8">

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Questions
                  </span>

                  <span className="font-semibold">
                    {quiz.questions.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Duration
                  </span>

                  <span className="font-semibold">
                    10 Minutes
                  </span>
                </div>

              </div>

              {/* GENERATED LINKS */}
              <div className="bg-zinc-800 rounded-xl p-4 mb-6 break-all text-sm space-y-4">

                <div>
                  <p className="text-green-400 font-bold mb-1">
                    Moderator URL
                  </p>

                  <p className="text-gray-300">
                    https://soc-learning-portal-gjwx.vercel.app/quiz/{slug}?session={sessionName}&moderator=true
                  </p>
                </div>

                <div>
                  <p className="text-blue-400 font-bold mb-1">
                    Participant URL
                  </p>

                  <p className="text-gray-300">
                    https://soc-learning-portal-gjwx.vercel.app/quiz/{slug}?session={sessionName}
                  </p>
                </div>

              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-3">

                <Link
                  href={`/quiz/${slug}?session=${sessionName}`}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-3 rounded-xl font-bold"
                >
                  Join Quiz
                </Link>

                <Link
                  href={`/quiz/${slug}?session=${sessionName}&moderator=true`}
                  className="block w-full bg-green-600 hover:bg-green-700 text-center py-3 rounded-xl font-bold"
                >
                  Moderator Panel
                </Link>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}
