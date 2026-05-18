"use client";

import {
  use,
  useEffect,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { quizzes } from "@/data/quizzes";

const QUIZ_DURATION = 600;

export default function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {

  const { slug } = use(params);

  const searchParams = useSearchParams();

  const sessionId =
    searchParams.get("session") || "default";

  const isModerator =
    searchParams.get("moderator") === "true";

  const quizData = quizzes[slug];

  const leaderboardCollection =
    `${slug}-${sessionId}-leaderboard`;

  const participantsCollection =
    `${slug}-${sessionId}-participants`;

  const sessionDocRef = doc(
    db,
    "quizSessions",
    `${slug}-${sessionId}`
  );

  const [name, setName] = useState("");

  const [joined, setJoined] =
    useState(false);

  const [quizStarted, setQuizStarted] =
    useState(false);

  const [startTime, setStartTime] =
    useState<number | null>(null);

  const [timeLeft, setTimeLeft] =
    useState(QUIZ_DURATION);

  const [answers, setAnswers] =
    useState<string[]>([]);

  const [score, setScore] =
    useState<number | null>(null);

  const [submitted, setSubmitted] =
    useState(false);

  const [leaderboard, setLeaderboard] =
    useState<any[]>([]);

  const [participants, setParticipants] =
    useState<any[]>([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  /* =========================
     MODERATOR RESET
  ========================= */

  useEffect(() => {

    const resetSession = async () => {

      if (!isModerator) return;

      await setDoc(
        sessionDocRef,
        {
          started: false,
          startTime: null,
          createdAt: new Date(),
        },
        { merge: true }
      );
    };

    resetSession();

  }, [isModerator, sessionDocRef]);

  /* =========================
     SESSION LISTENER
  ========================= */

  useEffect(() => {

    const initSession = async () => {

      const existing =
        await getDoc(sessionDocRef);

      if (!existing.exists()) {

        await setDoc(sessionDocRef, {
          started: false,
          startTime: null,
        });
      }
    };

    initSession();

    const unsubscribe = onSnapshot(
      sessionDocRef,
      (snapshot) => {

        const data = snapshot.data();

        if (!data) return;

        if (data.started) {

          setQuizStarted(true);

          if (data.startTime) {

            const firestoreTime =
              data.startTime.toDate().getTime();

            setStartTime(firestoreTime);
          }
        }
      }
    );

    return () => unsubscribe();

  }, [sessionDocRef]);

  /* =========================
     PARTICIPANTS LISTENER
  ========================= */

  useEffect(() => {

    const q = query(
      collection(db, participantsCollection)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setParticipants(data);
      }
    );

    return () => unsubscribe();

  }, [participantsCollection]);

  /* =========================
     LEADERBOARD
  ========================= */

  useEffect(() => {

    const q = query(
      collection(db, leaderboardCollection),
      orderBy("score", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLeaderboard(data.slice(0, 25));
      }
    );

    return () => unsubscribe();

  }, [leaderboardCollection]);

  /* =========================
     SHARED TIMER
  ========================= */

  useEffect(() => {

    if (
      !quizStarted ||
      !startTime ||
      submitted
    ) return;

    const timer = setInterval(() => {

      const now = Date.now();

      const elapsedSeconds =
        Math.floor(
          (now - startTime) / 1000
        );

      const remaining =
        QUIZ_DURATION - elapsedSeconds;

      if (remaining <= 0) {

        setTimeLeft(0);

        calculateScore();

        clearInterval(timer);

      } else {

        setTimeLeft(remaining);
      }

    }, 1000);

    return () => clearInterval(timer);

  }, [
    quizStarted,
    startTime,
    submitted,
  ]);

  /* =========================
     START QUIZ
  ========================= */

  const startQuiz = async () => {

    await setDoc(
      sessionDocRef,
      {
        started: true,
        startTime: new Date(),
      },
      { merge: true }
    );
  };

  /* =========================
     JOIN SESSION
  ========================= */

  const joinSession = async () => {

    if (!name.trim()) return;

    await addDoc(
      collection(db, participantsCollection),
      {
        name,
        joinedAt: new Date(),
      }
    );

    setJoined(true);
  };

  /* =========================
     SUBMIT
  ========================= */

  const calculateScore = async () => {

    if (submitted) return;

    let total = 0;

    quizData.questions.forEach(
      (q: any, index: number) => {

        if (answers[index] === q.answer) {
          total++;
        }
      }
    );

    setScore(total);

    setSubmitted(true);

    await addDoc(
      collection(db, leaderboardCollection),
      {
        name,
        score: total,
        createdAt: new Date(),
      }
    );
  };

  /* =========================
     ANSWERS
  ========================= */

  function handleOptionChange(
    qIndex: number,
    option: string
  ) {

    if (submitted) return;

    const updatedAnswers = [...answers];

    updatedAnswers[qIndex] = option;

    setAnswers(updatedAnswers);
  }

  if (!quizData) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-4xl font-bold">
        Quiz Not Found
      </div>
    );
  }

  /* =========================
     JOIN SCREEN
  ========================= */

  if (!joined && !isModerator) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-xl w-full">

          <h1 className="text-5xl font-bold mb-8 text-center">
            Join Session
          </h1>

          <div className="bg-blue-900 border border-blue-700 p-4 rounded-xl mb-8 text-center">

            <p className="text-sm text-gray-300">
              Active Session
            </p>

            <h2 className="text-2xl font-bold">
              {sessionId}
            </h2>

          </div>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full p-4 rounded bg-zinc-800 border border-zinc-700 mb-4"
          />

          {name.trim() === "" && (
            <p className="text-red-400 text-sm mb-6">
              Name is required
            </p>
          )}

          <button
            disabled={!name.trim()}
            onClick={joinSession}
            className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-xl text-xl font-bold disabled:opacity-50"
          >
            Join Session
          </button>

        </div>

      </div>
    );
  }

  /* =========================
     WAITING ROOM
  ========================= */

  if (!quizStarted) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-2xl w-full text-center">

          <h1 className="text-5xl font-bold mb-6">
            Waiting Room
          </h1>

          <p className="text-gray-400 text-xl mb-6">
            Session
          </p>

          <h2 className="text-3xl text-blue-400 font-bold mb-10">
            {sessionId}
          </h2>

          <div className="bg-zinc-800 p-6 rounded-xl mb-8">

            <p className="text-xl font-bold mb-4">
              Participants Joined
            </p>

            <div className="space-y-2">

              {participants.map((user) => (

                <div
                  key={user.id}
                  className="bg-zinc-700 p-3 rounded-lg"
                >
                  {user.name}
                </div>

              ))}

            </div>

          </div>

          <p className="text-gray-300 mb-10 text-lg">
            Waiting for moderator to start...
          </p>

          {isModerator && (

            <button
              onClick={startQuiz}
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl text-2xl font-bold"
            >
              Start Quiz
            </button>

          )}

        </div>

      </div>
    );
  }

  const question =
    quizData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-black text-white p-8">

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT SIDE */}
        <div>

          <div className="bg-red-900 p-4 rounded-xl mb-6 text-center">

            <h2 className="text-3xl font-bold">

              {Math.floor(timeLeft / 60)}:

              {(timeLeft % 60)
                .toString()
                .padStart(2, "0")}

            </h2>

            <p className="text-sm text-gray-300 mt-1">
              Shared Session Timer
            </p>

          </div>

          <h1 className="text-4xl font-bold mb-2">
            {quizData.title}
          </h1>

          <div className="bg-blue-900 border border-blue-700 p-4 rounded-xl mb-6">

            <p className="text-sm text-gray-300">
              Active Session
            </p>

            <h2 className="text-xl font-bold">
              {sessionId}
            </h2>

          </div>

          <p className="text-gray-400 mb-6">

            Question {currentQuestion + 1} of{" "}

            {quizData.questions.length}

          </p>

          {/* QUESTION */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">

            <h2 className="text-2xl font-semibold mb-6">
              {question.question}
            </h2>

            <div className="space-y-4">

              {question.options.map(
                (
                  option: string,
                  index: number
                ) => {

                  const isCorrect =
                    option === question.answer;

                  const isSelected =
                    answers[currentQuestion] ===
                    option;

                  let optionClass =
                    "bg-zinc-800 hover:bg-zinc-700";

                  if (submitted) {

                    if (isCorrect) {
                      optionClass =
                        "bg-green-700";
                    }

                    else if (isSelected) {
                      optionClass =
                        "bg-red-700";
                    }
                  }

                  return (
                    <label
                      key={index}
                      className={`block p-4 rounded cursor-pointer ${optionClass}`}
                    >

                      <input
                        type="radio"
                        disabled={submitted}
                        name={`question-${currentQuestion}`}
                        value={option}
                        checked={
                          answers[currentQuestion] ===
                          option
                        }
                        onChange={() =>
                          handleOptionChange(
                            currentQuestion,
                            option
                          )
                        }
                        className="mr-3"
                      />

                      {option}

                    </label>
                  );
                }
              )}

            </div>

            {/* NAVIGATION */}
            <div className="flex justify-between mt-8">

              <button
                disabled={currentQuestion === 0}
                onClick={() =>
                  setCurrentQuestion(
                    currentQuestion - 1
                  )
                }
                className="bg-zinc-700 px-5 py-3 rounded-lg disabled:opacity-50"
              >
                Back
              </button>

              {currentQuestion <
              quizData.questions.length - 1 ? (

                <button
                  onClick={() =>
                    setCurrentQuestion(
                      currentQuestion + 1
                    )
                  }
                  className="bg-blue-600 px-5 py-3 rounded-lg"
                >
                  Next
                </button>

              ) : (

                <button
                  disabled={submitted}
                  onClick={calculateScore}
                  className="bg-green-600 px-5 py-3 rounded-lg"
                >
                  {submitted
                    ? "Submitted"
                    : "Submit Quiz"}
                </button>

              )}

            </div>

          </div>

          {/* SCORE */}
          {score !== null && (

            <div className="mt-8 bg-green-900 p-6 rounded-xl border border-green-700">

              <h2 className="text-3xl font-bold">

                {name} scored {score}/
                {quizData.questions.length}

              </h2>

            </div>
          )}

        </div>

        {/* RIGHT SIDE */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-fit">

          <h2 className="text-3xl font-bold mb-2">
            Top 10 Leaderboard
          </h2>

          <p className="text-gray-400 mb-6">
            Participants: {leaderboard.length}
          </p>

          <div className="space-y-4">

            {leaderboard.map((user, index) => {

              let rank = index + 1;

              if (
                index > 0 &&
                user.score ===
                  leaderboard[index - 1].score
              ) {

                rank =
                  leaderboard[index - 1].rank;
              }

              user.rank = rank;

              return (

                <div
                  key={user.id}
                  className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg"
                >

                  <div>

                    <p className="font-bold text-lg">
                      #{rank}
                    </p>

                    <p>{user.name}</p>

                  </div>

                  <div className="text-2xl font-bold text-blue-400">
                    {user.score}
                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>

    </div>
  );
}