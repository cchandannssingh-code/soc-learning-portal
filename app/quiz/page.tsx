"use client";

import Link from "next/link";
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

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            SOC Quiz Portal
          </h1>

          <p className="text-gray-400 text-lg">
            Realtime Multiplayer Assessment Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quizEntries.map(([slug, quiz]) => (
            <div
              key={slug}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold mb-3">
                {quiz.title}
              </h2>

              <p className="text-gray-400 mb-6">
                Multiplayer synchronized quiz assessment.
              </p>

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

              <div className="space-y-3">
                <Link
                  href={`/quiz/${slug}?session=default`}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-3 rounded-xl font-bold"
                >
                  Join Quiz
                </Link>

                <Link
                  href={`/quiz/${slug}?session=default&moderator=true`}
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
