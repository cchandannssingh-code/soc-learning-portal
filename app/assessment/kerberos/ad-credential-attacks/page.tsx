"use client";

import { useState } from "react";

const questions = [

  {
    question:
      "Which Kerberos ticket is forged during a Golden Ticket attack?",

    options: [
      "TGS",
      "AS-REP",
      "TGT",
      "AP-REQ",
    ],

    answer: 2,

    explanation:
      "Golden Ticket attacks forge fake TGTs using the krbtgt hash.",
  },

  {
    question:
      "Which attack specifically abuses service account SPNs?",

    options: [
      "Silver Ticket",
      "Kerberoasting",
      "Pass-the-Ticket",
      "DCSync",
    ],

    answer: 1,

    explanation:
      "Kerberoasting abuses SPN-linked service tickets for offline cracking.",
  },

  {
    question:
      "Which Event ID commonly logs Kerberos TGS requests?",

    options: [
      "4768",
      "4769",
      "4624",
      "4662",
    ],

    answer: 1,

    explanation:
      "Event ID 4769 records Kerberos service ticket requests.",
  },

  {
    question:
      "Which attack abuses replication privileges inside Active Directory?",

    options: [
      "Kerberoasting",
      "Pass-the-Hash",
      "DCSync",
      "Silver Ticket",
    ],

    answer: 2,

    explanation:
      "DCSync simulates a Domain Controller requesting replication data.",
  },

  {
    question:
      "Which attack is most associated with RC4 encrypted service tickets?",

    options: [
      "Golden Ticket",
      "Kerberoasting",
      "Pass-the-Hash",
      "Silver Ticket",
    ],

    answer: 1,

    explanation:
      "Kerberoasting often targets RC4 encrypted TGS tickets for cracking.",
  },

  {
    question:
      "Which Windows process is the primary target for credential dumping?",

    options: [
      "winlogon.exe",
      "explorer.exe",
      "lsass.exe",
      "services.exe",
    ],

    answer: 2,

    explanation:
      "LSASS stores authentication material and Kerberos tickets in memory.",
  },

  {
    question:
      "Which attack can bypass communication with the Domain Controller?",

    options: [
      "Golden Ticket",
      "Silver Ticket",
      "DCSync",
      "AS-REP Roasting",
    ],

    answer: 1,

    explanation:
      "Silver Tickets forge service tickets locally without contacting the DC.",
  },

  {
    question:
      "Which attack requires Kerberos pre-authentication to be disabled?",

    options: [
      "Pass-the-Ticket",
      "AS-REP Roasting",
      "Golden Ticket",
      "DCSync",
    ],

    answer: 1,

    explanation:
      "AS-REP Roasting targets accounts without Kerberos pre-authentication.",
  },

  {
    question:
      "Which Event ID is most useful for suspicious process creation detection?",

    options: [
      "4688",
      "4769",
      "4624",
      "4662",
    ],

    answer: 0,

    explanation:
      "4688 records process creation events.",
  },

  {
    question:
      "Which attack directly abuses NTLM hashes for authentication?",

    options: [
      "Pass-the-Hash",
      "Pass-the-Ticket",
      "Golden Ticket",
      "Kerberoasting",
    ],

    answer: 0,

    explanation:
      "Pass-the-Hash reuses NTLM hashes without cracking passwords.",
  },

  {
    question:
      "Which account hash is required for Golden Ticket generation?",

    options: [
      "Administrator",
      "krbtgt",
      "Domain Admin",
      "CIFS",
    ],

    answer: 1,

    explanation:
      "The krbtgt account signs Kerberos TGTs.",
  },

  {
    question:
      "Which Event ID is associated with Kerberos TGT requests?",

    options: [
      "4769",
      "4768",
      "4624",
      "4672",
    ],

    answer: 1,

    explanation:
      "4768 logs Kerberos Authentication Service requests.",
  },

  {
    question:
      "Which attack often results in many unique SPN requests from one user?",

    options: [
      "DCSync",
      "Kerberoasting",
      "Pass-the-Hash",
      "Golden Ticket",
    ],

    answer: 1,

    explanation:
      "Kerberoasting often generates bursts of TGS requests for many SPNs.",
  },

  {
    question:
      "Which attack can impersonate any user in the domain?",

    options: [
      "Silver Ticket",
      "Golden Ticket",
      "AS-REP Roasting",
      "Pass-the-Hash",
    ],

    answer: 1,

    explanation:
      "Golden Tickets allow arbitrary user impersonation across the domain.",
  },

  {
    question:
      "Which attack uses forged PAC data inside tickets?",

    options: [
      "Golden Ticket",
      "Password Spraying",
      "Kerberoasting",
      "Pass-the-Ticket",
    ],

    answer: 0,

    explanation:
      "Golden Tickets forge PAC privilege information.",
  },

  {
    question:
      "Which attack commonly follows successful Kerberoasting?",

    options: [
      "Password reset",
      "Silver Ticket",
      "DNS tunneling",
      "ARP spoofing",
    ],

    answer: 1,

    explanation:
      "Compromised service hashes may later enable Silver Ticket attacks.",
  },

  {
    question:
      "Which attack abuses legitimate Kerberos tickets instead of forging them?",

    options: [
      "Pass-the-Ticket",
      "Golden Ticket",
      "Silver Ticket",
      "AS-REP Roasting",
    ],

    answer: 0,

    explanation:
      "Pass-the-Ticket reuses valid Kerberos tickets.",
  },

  {
    question:
      "Which attack is hardest to detect through DC logs alone?",

    options: [
      "Kerberoasting",
      "Silver Ticket",
      "DCSync",
      "Golden Ticket",
    ],

    answer: 1,

    explanation:
      "Silver Tickets often avoid direct Domain Controller interaction.",
  },

  {
    question:
      "Which attack abuses Kerberos service ticket generation?",

    options: [
      "Golden Ticket",
      "Kerberoasting",
      "Pass-the-Hash",
      "Password Spraying",
    ],

    answer: 1,

    explanation:
      "Kerberoasting abuses TGS ticket requests for service accounts.",
  },

  {
    question:
      "Which Event ID commonly appears during DCSync operations?",

    options: [
      "4662",
      "4624",
      "4769",
      "4688",
    ],

    answer: 0,

    explanation:
      "4662 logs directory replication-related activity.",
  },

  {
    question:
      "Which attack commonly abuses Mimikatz ticket injection?",

    options: [
      "Pass-the-Ticket",
      "Kerberoasting",
      "AS-REP Roasting",
      "Password Spraying",
    ],

    answer: 0,

    explanation:
      "Mimikatz can inject Kerberos tickets into memory for Pass-the-Ticket attacks.",
  },

  {
    question:
      "Which attack most likely explains replication traffic from a workstation?",

    options: [
      "DCSync",
      "Golden Ticket",
      "Silver Ticket",
      "Kerberoasting",
    ],

    answer: 0,

    explanation:
      "Replication traffic from non-DC systems strongly suggests DCSync.",
  },

  {
    question:
      "Which attack abuses stolen service account hashes?",

    options: [
      "Silver Ticket",
      "Pass-the-Hash",
      "Golden Ticket",
      "AS-REP Roasting",
    ],

    answer: 0,

    explanation:
      "Silver Tickets require service account hashes to forge TGS tickets.",
  },

  {
    question:
      "Which detection clue most strongly indicates Kerberoasting?",

    options: [
      "Repeated DNS failures",
      "Large number of unique TGS requests",
      "Group policy changes",
      "Large SMB transfers",
    ],

    answer: 1,

    explanation:
      "Kerberoasting often generates abnormal volumes of unique TGS requests.",
  },

  {
    question:
      "Which attack is considered domain-wide persistence?",

    options: [
      "Silver Ticket",
      "Golden Ticket",
      "Pass-the-Ticket",
      "AS-REP Roasting",
    ],

    answer: 1,

    explanation:
      "Golden Tickets provide long-term domain persistence.",
  },

  {
    question:
      "Which attack typically uses offline password cracking techniques?",

    options: [
      "Pass-the-Ticket",
      "Kerberoasting",
      "Golden Ticket",
      "DCSync",
    ],

    answer: 1,

    explanation:
      "Kerberoasting extracts crackable service ticket hashes.",
  },

  {
    question:
      "Which attack abuses NTLM authentication rather than Kerberos?",

    options: [
      "Pass-the-Hash",
      "Silver Ticket",
      "Golden Ticket",
      "Kerberoasting",
    ],

    answer: 0,

    explanation:
      "Pass-the-Hash abuses NTLM hashes directly.",
  },

  {
    question:
      "Which attack commonly results in 4769 events without 4768 events?",

    options: [
      "Golden Ticket",
      "AS-REP Roasting",
      "Password Spraying",
      "DNS Tunneling",
    ],

    answer: 0,

    explanation:
      "Golden Tickets may generate service activity without legitimate TGT requests.",
  },

  {
    question:
      "Which attack specifically abuses SPN-linked accounts?",

    options: [
      "Kerberoasting",
      "Pass-the-Ticket",
      "DCSync",
      "Silver Ticket",
    ],

    answer: 0,

    explanation:
      "SPNs identify Kerberos-enabled service accounts.",
  },

  {
    question:
      "Which attack is most stealthy due to minimal logging?",

    options: [
      "Silver Ticket",
      "Kerberoasting",
      "DCSync",
      "Golden Ticket",
    ],

    answer: 0,

    explanation:
      "Silver Tickets often avoid standard DC-side visibility.",
  },

  {
    question:
      "Which attack requires replication privileges?",

    options: [
      "Pass-the-Ticket",
      "DCSync",
      "Kerberoasting",
      "AS-REP Roasting",
    ],

    answer: 1,

    explanation:
      "DCSync abuses directory replication permissions.",
  },

  {
    question:
      "Which attack can survive password resets if krbtgt is not rotated twice?",

    options: [
      "Golden Ticket",
      "Silver Ticket",
      "Pass-the-Hash",
      "Kerberoasting",
    ],

    answer: 0,

    explanation:
      "Golden Ticket persistence survives until krbtgt is reset twice.",
  },

  {
    question:
      "Which attack abuses authentication material already stored in memory?",

    options: [
      "Pass-the-Ticket",
      "Kerberoasting",
      "Golden Ticket",
      "AS-REP Roasting",
    ],

    answer: 0,

    explanation:
      "Pass-the-Ticket reuses cached Kerberos tickets.",
  },

  {
    question:
      "Which attack most commonly targets service accounts with weak passwords?",

    options: [
      "Kerberoasting",
      "Pass-the-Hash",
      "Golden Ticket",
      "DCSync",
    ],

    answer: 0,

    explanation:
      "Weak service account passwords are prime Kerberoasting targets.",
  },

  {
    question:
      "Which attack abuses the Kerberos PAC structure?",

    options: [
      "Golden Ticket",
      "Pass-the-Hash",
      "AS-REP Roasting",
      "Password Spraying",
    ],

    answer: 0,

    explanation:
      "Golden Tickets manipulate PAC privilege data.",
  },

  {
    question:
      "Which attack often produces suspicious LSASS memory access?",

    options: [
      "Credential Dumping",
      "Golden Ticket",
      "Kerberoasting",
      "Silver Ticket",
    ],

    answer: 0,

    explanation:
      "Credential dumping tools commonly target LSASS memory.",
  },

  {
    question:
      "Which attack can directly extract the krbtgt hash?",

    options: [
      "DCSync",
      "Kerberoasting",
      "Pass-the-Ticket",
      "Silver Ticket",
    ],

    answer: 0,

    explanation:
      "DCSync can replicate password hashes including krbtgt.",
  },

  {
    question:
      "Which attack abuses TGS tickets instead of TGT tickets?",

    options: [
      "Silver Ticket",
      "Golden Ticket",
      "Pass-the-Hash",
      "AS-REP Roasting",
    ],

    answer: 0,

    explanation:
      "Silver Tickets forge service tickets rather than TGTs.",
  },

  {
    question:
      "Which attack is most associated with abnormal service ticket lifetimes?",

    options: [
      "Golden Ticket",
      "Kerberoasting",
      "DCSync",
      "Pass-the-Hash",
    ],

    answer: 0,

    explanation:
      "Golden Tickets often contain abnormal expiration values.",
  },

  {
    question:
      "Which attack chain is most realistic in enterprise compromise?",

    options: [
      "Kerberoasting → DCSync → Golden Ticket",
      "Password Spray → DNS → DHCP",
      "Golden Ticket → Kerberoasting → SMB",
      "Silver Ticket → ARP → DNS",
    ],

    answer: 0,

    explanation:
      "Kerberoasting may lead to privilege escalation, DCSync, and Golden Tickets.",
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