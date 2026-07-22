"use client";

import {
  use,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { quizzes } from "@/data/quizzes";

const QUIZ_DURATION = 900;

export default function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session") || "default";
  const isModerator = searchParams.get("moderator") === "true";

  const quizData = quizzes[slug];

  const leaderboardCollection = `${slug}-${sessionId}-leaderboard`;
  const participantsCollection = `${slug}-${sessionId}-participants`;

  const sessionDocRef = doc(db, "quizSessions", `${slug}-${sessionId}`);

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [answers, setAnswers] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [warning, setWarning] = useState("");
  const [watermarkTime, setWatermarkTime] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);

  // Moderator authentication state
  const [moderatorPassword, setModeratorPassword] = useState("");
  const [moderatorAuthError, setModeratorAuthError] = useState("");
  const [isModeratorAuthenticated, setIsModeratorAuthenticated] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const submittedRef = useRef(false); // mirror of submitted for use inside callbacks
  const fullscreenViolationsRef = useRef(0);
  const cameraViolationsRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* =========================
     MODERATOR AUTHENTICATION
  ========================= */

  // Check if moderator is already authenticated in sessionStorage
  useEffect(() => {
    if (isModerator) {
      const authStatus = sessionStorage.getItem("quizModeratorAuthenticated");
      if (authStatus === "true") {
        setIsModeratorAuthenticated(true);
      }
    }
  }, [isModerator]);

  const handleModeratorLogin = async () => {
    setIsVerifyingPassword(true);
    setModeratorAuthError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: moderatorPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store authentication in sessionStorage
        sessionStorage.setItem("quizModeratorAuthenticated", "true");
        setIsModeratorAuthenticated(true);
        setModeratorPassword("");
      } else {
        setModeratorAuthError("Incorrect password.");
        setModeratorPassword("");
      }
    } catch (error) {
      setModeratorAuthError("Authentication failed. Please try again.");
      setModeratorPassword("");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleModeratorCancel = () => {
    setModeratorPassword("");
    setModeratorAuthError("");
    // Redirect to participant join screen by removing moderator parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("moderator");
    window.location.href = newUrl.toString();
  };

  /* =========================
     WARNING TOAST
  ========================= */

  const triggerWarning = useCallback((msg: string) => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setWarning(msg);
    warningTimerRef.current = setTimeout(() => setWarning(""), 3000);
  }, []);

  const handleManualClose = () => {
    setWarning("");
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  };

  /* =========================
     FULLSCREEN HELPERS
  ========================= */

  const enterFullScreen = useCallback(async () => {
    const element = containerRef.current;
    
    try {
      if (element && !document.fullscreenElement) {
        
        await element.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Exit fullscreen failed:", err);
    }
  }, []);

  
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      triggerWarning("❌ Camera permission is required.");
    }
  }, [triggerWarning]);

/* =========================
     ANTI-CHEAT: FULLSCREEN + NO COPY/PASTE/RIGHT-CLICK
     Only active when quiz is running and not submitted
  ========================= */

  useEffect(() => {
    // Only enforce during an active quiz for non-moderators
    if (!quizStarted || submitted || isModerator || !joined) return;

    const element = containerRef.current;
    if (!element) return;

    // Enter fullscreen when quiz starts
    enterFullScreen();
    void startCamera();

    const handleFullscreenChange = () => {
      if (submittedRef.current) return;
      if (!document.fullscreenElement) {
        fullscreenViolationsRef.current++;
        if (fullscreenViolationsRef.current >= 3) {
          triggerWarning("❌ Fullscreen violation 3/3. Quiz submitted.");
          void calculateScore();
          return;
        }
        triggerWarning(`⚠️ Fullscreen violation ${fullscreenViolationsRef.current}/3`);
        setTimeout(() => { void enterFullScreen(); }, 500);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMetaOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Block copy, paste, cut
      if (isMetaOrCtrl && ["c", "v", "x"].includes(key)) {
        e.preventDefault();
        triggerWarning("❌ Copying, pasting, and cutting are strictly blocked!");
        return;
      }

      // Block Escape
      if (e.key === "Escape") {
        e.preventDefault();
        triggerWarning("❌ You cannot exit full screen during the quiz!");
        return;
      }

      // Block F11
      if (e.key === "F11") {
        e.preventDefault();
        triggerWarning("❌ You cannot exit full screen during the quiz!");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerWarning("❌ Right-clicking is not allowed during the quiz!");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    element.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
      element.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [quizStarted, submitted, isModerator, joined, enterFullScreen, triggerWarning, startCamera]);

  useEffect(() => {
    const t = setInterval(() => {
      setWatermarkTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* =========================
     SESSION RESET
  ========================= */

  useEffect(() => {
    if (!isModerator) return;
    const resetSession = async () => {
      await setDoc(
        sessionDocRef,
        { started: false, startTime: null, createdAt: new Date() },
        { merge: true }
      );
    };
    resetSession();
  }, [isModerator]);

  /* =========================
       SESSION LISTENER
    ========================= */

  useEffect(() => {
    const initSession = async () => {
      const existing = await getDoc(sessionDocRef);
      if (!existing.exists()) {
        await setDoc(sessionDocRef, { started: false, startTime: null, active: true });
      }
    };
    initSession();

    const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;
      
      // Check if session was ended by moderator
      if (data.active === false && !isModerator) {
        setSessionEnded(true);
        setQuizStarted(false);
        return;
      }
      
      if (data.started) {
        setQuizStarted(true);
        if (data.startTime) {
          setStartTime(data.startTime.toDate().getTime());
        }
      }
    });

    return () => unsubscribe();
  }, []);

  /* =========================
     PARTICIPANTS
  ========================= */

  useEffect(() => {
    const q = query(collection(db, participantsCollection));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setParticipants(data);
    });
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLeaderboard(data.slice(0, 25));
    });

    // const handleVisibilityChange = () => {
    //   if (document.hidden) {
    //     confirm(
    //       "Tab switching is not allowed. Your session will be terminated."
    //     );
    //   }
    // }
    // document.addEventListener(
    //   "visibilitychange",
    //   handleVisibilityChange
    // );
    return () => unsubscribe();
  }, [leaderboardCollection]);

  /* =========================
     SHARED TIMER
  ========================= */

  const calculateScore = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);

    let total = 0;
    quizData?.questions.forEach((q: any, index: number) => {
      if (answers[index] === q.answer) total++;
    });

    setScore(total);

    // Exit fullscreen when time is up / quiz submitted
    await exitFullScreen();
    
    

    await addDoc(collection(db, leaderboardCollection), {
      name,
      score: total,
      createdAt: new Date(),
    });
  }, [answers, name, leaderboardCollection, exitFullScreen, quizData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const track = streamRef.current?.getVideoTracks()?.[0];
      if (track && track.readyState !== "live" && !submittedRef.current) {
        cameraViolationsRef.current++;
        if (cameraViolationsRef.current >= 3) {
          triggerWarning("❌ Camera violation 3/3. Quiz submitted.");
          void calculateScore();
          return;
        }
        triggerWarning(`⚠️ Camera violation ${cameraViolationsRef.current}/3`);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [calculateScore, triggerWarning]);

  useEffect(() => {
    if (!quizStarted || !startTime || submitted || isModerator) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = QUIZ_DURATION - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        calculateScore();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, startTime, submitted, isModerator, calculateScore]);

  /* =========================
     START QUIZ
  ========================= */

  const startQuiz = async () => {
    await setDoc(
      sessionDocRef,
      { started: true, startTime: new Date() },
      { merge: true }
    );
  };

  /* =========================
       STOP / DELETE SESSION
    ========================= */

  const stopSession = async () => {
    const confirmStop = window.confirm(
      "Stop this session? All participants will be kicked out."
    );
    if (!confirmStop) return;

    try {
      // Mark session as inactive - this will kick out all participants
      await setDoc(
        sessionDocRef,
        { active: false, stoppedAt: new Date() },
        { merge: true }
      );

      // Wait a moment for participants to see the change
      setTimeout(async () => {
        // Delete all participants
        const participantsSnapshot = await getDocs(
          collection(db, participantsCollection)
        );
        for (const participant of participantsSnapshot.docs) {
          await deleteDoc(participant.ref);
        }

        // Delete leaderboard
        const leaderboardSnapshot = await getDocs(
          collection(db, leaderboardCollection)
        );
        for (const item of leaderboardSnapshot.docs) {
          await deleteDoc(item.ref);
        }

        // Delete session document
        await deleteDoc(sessionDocRef);
        
        alert("Session stopped and deleted successfully");
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(error);
      alert("Failed to stop session");
    }
  };

  /* =========================
     JOIN SESSION
  ========================= */

  const joinSession = async () => {
    if (!name.trim()) return;
    await addDoc(collection(db, participantsCollection), {
      name,
      joinedAt: new Date(),
    });
    setJoined(true);
  };

  /* =========================
     ANSWERS
  ========================= */

  const handleOptionChange = (qIndex: number, option: string) => {
    if (submitted) return;
    const updatedAnswers = [...answers];
    updatedAnswers[qIndex] = option;
    setAnswers(updatedAnswers);
  };

  /* =========================
     GUARDS
  ========================= */

  /* =========================
       SESSION ENDED SCREEN
    ========================= */

  if (sessionEnded && !isModerator) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-xl w-full text-center">
          <h1 className="text-5xl font-bold mb-6 text-red-500">
            Session no longer available
          </h1>
          <p className="text-gray-400 text-xl mb-8">
            The moderator has stopped this quiz session.
          </p>
          <p className="text-gray-500 mb-8">
            You have been removed from the session.
          </p>
          <button
            onClick={() => {
              // Clear session state and stay on the same page
              setSessionEnded(false);
              setJoined(false);
              setName("");
              setQuizStarted(false);
              setSubmitted(false);
              setScore(null);
              setAnswers([]);
              setCurrentQuestion(0);
              
              // Remove session parameter from URL without navigating away
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete("session");
              window.history.replaceState({}, "", newUrl.toString());
            }}
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-xl font-bold"
          >
            Return to Quiz Portal
          </button>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-4xl font-bold">
        Quiz Not Found
      </div>
    );
  }

  /* =========================
     MODERATOR PASSWORD SCREEN
  ========================= */

  if (isModerator && !isModeratorAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-md w-full">
          <h1 className="text-4xl font-bold mb-2 text-center">Moderator Access</h1>
          <p className="text-gray-400 text-center mb-8">Enter moderator password.</p>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={moderatorPassword}
              onChange={(e) => {
                setModeratorPassword(e.target.value);
                setModeratorAuthError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleModeratorLogin()}
              className="w-full p-4 rounded bg-zinc-800 border border-zinc-700"
              autoFocus
            />

            {moderatorAuthError && (
              <p className="text-red-500 text-center">{moderatorAuthError}</p>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleModeratorCancel}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-xl text-lg font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleModeratorLogin}
                disabled={!moderatorPassword.trim() || isVerifyingPassword}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-lg font-bold disabled:opacity-50"
              >
                {isVerifyingPassword ? "Verifying..." : "Unlock"}
              </button>
            </div>
          </div>
        </div>
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
          <h1 className="text-5xl font-bold mb-8 text-center">Join Session</h1>

          <div className="bg-blue-900 border border-blue-700 p-4 rounded-xl mb-8 text-center">
            <p className="text-sm text-gray-300">Active Session</p>
            <h2 className="text-2xl font-bold">{sessionId}</h2>
          </div>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinSession()}
            className="w-full p-4 rounded bg-zinc-800 border border-zinc-700 mb-4"
          />

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
     WAITING / MODERATOR PANEL
  ========================= */

  if (!quizStarted || isModerator) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-2xl w-full text-center">
          <h1 className="text-5xl font-bold mb-6">
            {isModerator ? "Moderator Control Room" : "Waiting for Quiz to Start..."}
          </h1>

          <p className="text-gray-400 text-xl mb-6">Session</p>
          <h2 className="text-3xl text-blue-400 font-bold mb-10">{sessionId}</h2>

          <div className="bg-zinc-800 p-6 rounded-xl mb-8">
            <p className="text-xl font-bold mb-4">Participants Joined</p>
            <div className="space-y-2">
              {participants.map((user) => (
                <div key={user.id} className="bg-zinc-700 p-3 rounded-lg">
                  {user.name}
                </div>
              ))}
            </div>
          </div>

          {quizStarted && (
            <div className="bg-zinc-800 p-6 rounded-xl mb-8">
              <p className="text-2xl font-bold mb-4">Live Leaderboard</p>
              <div className="space-y-3">
                {leaderboard.map((user, index) => {
                  let rank = index + 1;
                  if (index > 0 && user.score === leaderboard[index - 1].score) {
                    rank = leaderboard[index - 1].rank;
                  }
                  user.rank = rank;
                  return (
                    <div
                      key={user.id}
                      className="bg-zinc-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold">#{rank}</p>
                        <p>{user.name}</p>
                      </div>
                      <div className="text-blue-400 text-2xl font-bold">
                        {user.score}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isModerator && (
            <div className="flex flex-col gap-4">
              {!quizStarted && (
                <button
                  onClick={startQuiz}
                  className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl text-2xl font-bold"
                >
                  Start Quiz
                </button>
              )}
              <button
                onClick={stopSession}
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl text-xl font-bold"
              >
                Stop / Delete Session
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================
     QUIZ SCREEN
  ========================= */

  const question = quizData.questions[currentQuestion];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white p-8"
      style={{ userSelect: "none", position: "relative" }}
    >
      {/* Warning Toast */}
      {warning && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#dc2626",
            color: "#fff",
            padding: "12px 48px 12px 24px",
            borderRadius: "8px",
            fontWeight: "bold",
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            whiteSpace: "nowrap",
          }}
        >
          <span>{warning}</span>
          <button
            onClick={handleManualClose}
            style={{
              position: "absolute",
              right: "12px",
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "20px",
              cursor: "pointer",
              fontWeight: "bold",
              lineHeight: "1",
              padding: "0",
            }}
          >
            ×
          </button>
        </div>
      )}

      
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-30deg)",
          fontSize: "72px",
          fontWeight: "bold",
          color: "#ffffff",
          opacity: 0.06,
          pointerEvents: "none",
          zIndex: 1,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {name}
        <br />
        {sessionId}
        <br />
        {watermarkTime}
      </div>

<div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="fixed top-4 right-4 z-50">
          <video ref={videoRef} autoPlay muted playsInline className="w-40 rounded-lg border border-zinc-700 bg-black" />
        </div>

        {/* LEFT: Quiz */}
        <div>
          {/* Timer */}
          <div className="bg-red-900 p-4 rounded-xl mb-6 text-center">
            <h2 className="text-3xl font-bold">
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </h2>
            <p className="text-sm text-gray-300 mt-1">Shared Session Timer</p>
          </div>

          <h1 className="text-4xl font-bold mb-2">{quizData.title}</h1>

          <p className="text-gray-400 mb-6">
            Question {currentQuestion + 1} of {quizData.questions.length}
          </p>

          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-6">{question.question}</h2>

            <div className="space-y-4">
              {question.options.map((option: string, index: number) => {
                const isCorrect = option === question.answer;
                const isSelected = answers[currentQuestion] === option;

                let optionClass = "bg-zinc-800 hover:bg-zinc-700";
                if (submitted) {
                  if (isCorrect) optionClass = "bg-green-700";
                  else if (isSelected) optionClass = "bg-red-700";
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
                      checked={answers[currentQuestion] === option}
                      onChange={() => handleOptionChange(currentQuestion, option)}
                      className="mr-3"
                    />
                    {option}
                  </label>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <button
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                className="bg-zinc-700 px-5 py-3 rounded-lg disabled:opacity-50"
              >
                Back
              </button>

              {currentQuestion < quizData.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="bg-blue-600 px-5 py-3 rounded-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  disabled={submitted}
                  onClick={calculateScore}
                  className="bg-green-600 px-5 py-3 rounded-lg disabled:opacity-50"
                >
                  {submitted ? "Submitted" : "Submit Quiz"}
                </button>
              )}
            </div>
          </div>

          {score !== null && (
            <div className="mt-8 bg-green-900 p-6 rounded-xl border border-green-700">
              <h2 className="text-3xl font-bold">
                {name} scored {score}/{quizData.questions.length}
              </h2>
            </div>
          )}
        </div>

        {/* RIGHT: Leaderboard */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-fit">
          <h2 className="text-3xl font-bold mb-4">Leaderboard</h2>
          <div className="space-y-4">
            {leaderboard.map((user, index) => {
              let rank = index + 1;
              if (
                index > 0 &&
                user.score === leaderboard[index - 1].score
              ) {
                rank = leaderboard[index - 1].rank;
              }
              user.rank = rank;
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg"
                >
                  <div>
                    <p className="font-bold text-lg">#{rank}</p>
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