"use client";
import React, { useMemo, useState } from "react";

export default function Event4648PracticePortal() {
  const questions = useMemo(() => [
    {
      level: "Basic",
      question: "What does Windows Event ID 4648 represent?",
      options: [
        "A failed logon attempt",
        "A successful Kerberos ticket request",
        "A logon attempt using explicit credentials",
        "A user account creation event"
      ],
      answer: 2,
      explanation:
        "Event ID 4648 is generated when explicit credentials are supplied to a process or application."
    },
    {
      level: "Basic",
      question: "Which tool commonly generates Event ID 4648?",
      options: ["notepad.exe", "runas.exe", "calc.exe", "mspaint.exe"],
      answer: 1,
      explanation:
        "runas.exe commonly triggers 4648 because it explicitly requests alternate credentials."
    },
    {
      level: "Basic",
      question: "Which field shows the account whose credentials were used?",
      options: ["SubjectUserName", "TargetUserName", "ProcessName", "ComputerName"],
      answer: 1,
      explanation:
        "TargetUserName identifies the credentials supplied during the authentication attempt."
    },
    {
      level: "Basic",
      question: "Which Windows component handles authentication requests?",
      options: ["LSASS.exe", "explorer.exe", "svchost.exe", "taskmgr.exe"],
      answer: 0,
      explanation: "LSASS handles authentication, token creation and security policy enforcement."
    },
    {
      level: "Basic",
      question: "What does SubjectUserName represent in Event ID 4648?",
      options: [
        "The user initiating the request",
        "The domain controller",
        "The process hash",
        "The target server"
      ],
      answer: 0,
      explanation: "SubjectUserName identifies the account that initiated the authentication request."
    },
    {
      level: "Basic",
      question: "Which authentication protocol is preferred in Active Directory environments?",
      options: ["FTP", "Kerberos", "SNMP", "LDAP"],
      answer: 1,
      explanation: "Kerberos is the default and preferred authentication mechanism in Active Directory."
    },
    {
      level: "Basic",
      question: "Which protocol commonly acts as fallback when Kerberos fails?",
      options: ["SSH", "NTLM", "RDP", "TLS"],
      answer: 1,
      explanation: "NTLM commonly acts as fallback when Kerberos cannot be used."
    },
    {
      level: "Basic",
      question: "Which log contains Event ID 4648?",
      options: ["Application", "Security", "System", "Setup"],
      answer: 1,
      explanation: "Event ID 4648 is recorded in the Windows Security log."
    },
    {
      level: "Basic",
      question: "Which process commonly creates security tokens after authentication?",
      options: ["lsass.exe", "chrome.exe", "teams.exe", "calc.exe"],
      answer: 0,
      explanation: "LSASS is responsible for generating security tokens after successful authentication."
    },
    {
      level: "Basic",
      question: "What is commonly supplied during a 4648 event?",
      options: ["MAC address", "Explicit credentials", "DNS records", "Certificates only"],
      answer: 1,
      explanation: "Explicit credentials are manually supplied during a 4648 authentication event."
    },
    {
      level: "Intermediate",
      question: "Why do SOC analysts monitor Event ID 4648 closely?",
      options: [
        "It always indicates malware",
        "It can indicate lateral movement or credential abuse",
        "It only appears during Windows updates",
        "It disables user authentication"
      ],
      answer: 1,
      explanation:
        "Attackers often use explicit credentials during lateral movement and administrative abuse."
    },
    {
      level: "Intermediate",
      question: "Which related event commonly appears alongside Event ID 4648 after successful authentication?",
      options: ["4624", "1102", "4720", "5156"],
      answer: 0,
      explanation: "4624 represents a successful logon and is commonly correlated with 4648."
    },
    {
      level: "Intermediate",
      question: "Which process would generally be considered suspicious with Event ID 4648?",
      options: [
        "explorer.exe",
        "powershell.exe using admin credentials",
        "chrome.exe",
        "winword.exe"
      ],
      answer: 1,
      explanation:
        "PowerShell combined with privileged credentials may indicate credential abuse or lateral movement."
    },
    {
      level: "Intermediate",
      question: "What does a mismatch between SubjectUserName and TargetUserName often indicate?",
      options: [
        "Normal DNS resolution",
        "Use of alternate credentials",
        "System reboot",
        "Firewall block"
      ],
      answer: 1,
      explanation:
        "A mismatch commonly means one user is supplying another account’s credentials."
    },
    {
      level: "Intermediate",
      question: "Which logon type is commonly associated with remote interactive logons?",
      options: ["2", "3", "10", "7"],
      answer: 2,
      explanation: "Logon Type 10 represents RemoteInteractive sessions such as RDP."
    },
    {
      level: "Intermediate",
      question: "Which Windows utility is frequently abused for remote execution?",
      options: ["Paint", "PsExec", "WordPad", "Snipping Tool"],
      answer: 1,
      explanation: "PsExec is commonly used for remote command execution and lateral movement."
    },
    {
      level: "Intermediate",
      question: "What should analysts inspect when investigating suspicious 4648 events?",
      options: ["Browser bookmarks", "Parent-child process lineage", "Desktop wallpaper", "Screen resolution"],
      answer: 1,
      explanation: "Process lineage helps determine how authentication activity originated."
    },
    {
      level: "Intermediate",
      question: "Which event helps track process execution associated with 4648?",
      options: ["4688", "4728", "4719", "1100"],
      answer: 0,
      explanation: "4688 logs process creation and supports execution tracing."
    },
    {
      level: "Intermediate",
      question: "Which field commonly identifies the source workstation?",
      options: ["IpAddress", "Signature", "Privileges", "Opcode"],
      answer: 0,
      explanation: "IpAddress helps identify the originating source system."
    },
    {
      level: "Intermediate",
      question: "Why is PowerShell frequently monitored with 4648 events?",
      options: ["It controls printers", "It is heavily abused for post-exploitation", "It installs fonts", "It disables networking"],
      answer: 1,
      explanation: "Attackers frequently abuse PowerShell for credential abuse and remote operations."
    },
    {
      level: "Intermediate",
      question: "Which authentication package supports ticket-based authentication?",
      options: ["Kerberos", "NetBIOS", "RPC", "WMI"],
      answer: 0,
      explanation: "Kerberos uses tickets for authentication within Active Directory."
    },
    {
      level: "Intermediate",
      question: "What does Event ID 4672 indicate when correlated with 4648?",
      options: ["Privileged logon", "DNS update", "Time sync", "USB insertion"],
      answer: 0,
      explanation: "4672 indicates special privileges assigned to a logon session."
    },
    {
      level: "Intermediate",
      question: "Which remote management technology frequently generates authentication events?",
      options: ["WinRM", "Bluetooth", "HDMI", "SMBv1 only"],
      answer: 0,
      explanation: "WinRM is widely used for remote PowerShell management."
    },
    {
      level: "Intermediate",
      question: "What is a common reason for NTLM fallback?",
      options: ["Kerberos failure", "GPU crash", "DNS cache cleanup", "Windows themes"],
      answer: 0,
      explanation: "NTLM commonly appears when Kerberos authentication cannot complete successfully."
    },
    {
      level: "Intermediate",
      question: "Which behavior is more suspicious for Event ID 4648?",
      options: ["Admin activity on jump server", "Domain admin usage from user workstation", "Backup account authentication", "Scheduled patch deployment"],
      answer: 1,
      explanation: "Privileged credentials used from ordinary user workstations are higher risk."
    },
    {
      level: "Advanced",
      question: "Which attack technique may generate Event ID 4648 during lateral movement?",
      options: ["Pass-the-Hash", "ARP spoofing", "SQL injection", "DNS tunneling"],
      answer: 0,
      explanation:
        "Pass-the-Hash and related credential abuse techniques frequently trigger explicit credential usage events."
    },
    {
      level: "Advanced",
      question: "Which combination is considered highly suspicious?",
      options: [
        "runas.exe from admin jump box",
        "powershell.exe using domain admin credentials from user workstation",
        "Backup software authenticating to backup server",
        "Scheduled task using service account"
      ],
      answer: 1,
      explanation:
        "Administrative credentials used from a normal workstation through PowerShell may indicate compromise."
    },
    {
      level: "Advanced",
      question: "What should analysts correlate with Event ID 4648 to trace process execution lineage?",
      options: ["4688 process creation events", "4726 user deletion events", "7045 service installation only", "DNS logs only"],
      answer: 0,
      explanation: "4688 helps identify parent-child process relationships and execution flow."
    },
    {
      level: "Advanced",
      question: "Which attack commonly abuses valid credentials for remote execution?",
      options: ["Pass-the-Hash", "Clickjacking", "Cross-site scripting", "SEO poisoning"],
      answer: 0,
      explanation: "Pass-the-Hash abuses NTLM hashes for authentication without plaintext passwords."
    },
    {
      level: "Advanced",
      question: "Which event sequence may indicate lateral movement?",
      options: ["4648 → 4624 → 4688", "1102 → 104", "5156 → 5158", "4720 → 4726"],
      answer: 0,
      explanation: "Explicit credential usage followed by successful logon and process creation may indicate lateral movement."
    },
    {
      level: "Advanced",
      question: "Which tool is commonly associated with service creation during remote execution?",
      options: ["PsExec", "Paint", "Explorer", "Snipping Tool"],
      answer: 0,
      explanation: "PsExec commonly creates temporary services for remote execution."
    },
    {
      level: "Advanced",
      question: "Which field can help identify remote target systems?",
      options: ["TargetServerName", "Opcode", "Keywords", "Version"],
      answer: 0,
      explanation: "TargetServerName helps identify the remote system being accessed."
    },
    {
      level: "Advanced",
      question: "Why is explicit credential usage risky?",
      options: ["Credentials may be exposed or abused", "It disables Kerberos", "It deletes logs", "It changes BIOS settings"],
      answer: 0,
      explanation: "Supplying credentials explicitly increases exposure and abuse opportunities."
    },
    {
      level: "Advanced",
      question: "Which account type is most sensitive when observed in suspicious 4648 activity?",
      options: ["Guest", "Domain Admin", "Local standard user", "DefaultAppPool"],
      answer: 1,
      explanation: "Domain Admin accounts provide broad privileges and are highly targeted by attackers."
    },
    {
      level: "Advanced",
      question: "Which security concept explains user access rights after authentication?",
      options: ["Security token", "ARP cache", "DHCP lease", "Routing table"],
      answer: 0,
      explanation: "Security tokens determine privileges and access rights after authentication."
    },
    {
      level: "Advanced",
      question: "What is the primary role of Kerberos TGTs?",
      options: ["Grant initial authentication", "Store DNS records", "Encrypt disks", "Create firewall rules"],
      answer: 0,
      explanation: "A TGT enables authenticated access to request additional service tickets."
    },
    {
      level: "Advanced",
      question: "Which event commonly records Kerberos service ticket requests?",
      options: ["4769", "1102", "4719", "4634"],
      answer: 0,
      explanation: "4769 records Kerberos service ticket requests."
    },
    {
      level: "Advanced",
      question: "Which behavior is most suspicious?",
      options: ["Single admin login", "Multiple hosts accessed rapidly with explicit credentials", "Scheduled patching", "Printer deployment"],
      answer: 1,
      explanation: "Rapid multi-host authentication may indicate automated lateral movement."
    },
    {
      level: "Advanced",
      question: "Which attack focuses on extracting service account tickets?",
      options: ["Kerberoasting", "Pharming", "Watering hole", "Smishing"],
      answer: 0,
      explanation: "Kerberoasting abuses service ticket requests to crack service account passwords offline."
    },
    {
      level: "Advanced",
      question: "Why should analysts baseline normal 4648 activity?",
      options: ["To identify anomalies and abuse", "To disable logging", "To increase CPU usage", "To reduce SIEM storage"],
      answer: 0,
      explanation: "Behavior baselining helps identify suspicious deviations."
    },
    {
      level: "Advanced",
      question: "What does Event ID 7045 commonly indicate alongside suspicious authentication activity?",
      options: ["Service creation", "DNS replication", "USB insertion", "Windows theme change"],
      answer: 0,
      explanation: "7045 may indicate malicious service creation during remote execution."
    },
    {
      level: "Advanced",
      question: "Which remote execution technique commonly leverages SMB and admin shares?",
      options: ["PsExec", "ARP spoofing", "DHCP starvation", "DNS poisoning"],
      answer: 0,
      explanation: "PsExec commonly leverages SMB administrative shares."
    },
    {
      level: "Advanced",
      question: "Which investigative action is best after detecting suspicious 4648 activity?",
      options: ["Correlate logs and isolate impacted hosts", "Delete all logs", "Disable antivirus", "Ignore the alert"],
      answer: 0,
      explanation: "Analysts should investigate related events and contain potentially compromised systems."
    },
    {
      level: "Expert",
      question: "Which authentication flow issues a Ticket Granting Ticket?",
      options: ["AS-REQ / AS-REP", "DNS lookup", "ARP request", "NTLM challenge only"],
      answer: 0,
      explanation: "Kerberos AS exchanges issue the initial Ticket Granting Ticket."
    },
    {
      level: "Expert",
      question: "Which attack abuses forged Kerberos TGTs?",
      options: ["Golden Ticket", "Pass-the-Ticket", "Phishing", "Clickjacking"],
      answer: 0,
      explanation: "Golden Ticket attacks abuse forged Kerberos TGTs for persistence and privilege abuse."
    },
    {
      level: "Expert",
      question: "Which process is heavily targeted by credential dumping attacks?",
      options: ["lsass.exe", "explorer.exe", "chrome.exe", "svchost.exe"],
      answer: 0,
      explanation: "Credential dumping tools commonly target LSASS memory."
    },
    {
      level: "Expert",
      question: "Which ATT&CK tactic most closely aligns with suspicious 4648 activity?",
      options: ["Lateral Movement", "Reconnaissance", "Impact", "Resource Development"],
      answer: 0,
      explanation: "4648 activity is strongly associated with credential use and lateral movement."
    },
    {
      level: "Expert",
      question: "What is a strong indicator of automated credential abuse?",
      options: ["Repeated 4648 events across many hosts", "Single user login", "Patch deployment", "Printer mapping"],
      answer: 0,
      explanation: "Large-scale authentication activity across hosts may indicate automated abuse."
    },
    {
      level: "Expert",
      question: "Which authentication protocol is vulnerable to relay attacks if protections are absent?",
      options: ["NTLM", "Kerberos", "SSH", "TLS"],
      answer: 0,
      explanation: "NTLM relay attacks abuse authentication forwarding weaknesses."
    },
    {
      level: "Expert",
      question: "What should defenders do with privileged accounts?",
      options: ["Restrict and monitor usage", "Share passwords broadly", "Disable MFA", "Reuse credentials"],
      answer: 0,
      explanation: "Privileged account usage should be tightly controlled and monitored."
    },
    {
      level: "Expert",
      question: "Which Microsoft technology helps reduce credential theft exposure?",
      options: ["Credential Guard", "Paint", "Remote Assistance", "Media Player"],
      answer: 0,
      explanation: "Credential Guard helps protect secrets stored by LSASS."
    },
    {
      level: "Expert",
      question: "Which investigative data source is critical for endpoint visibility?",
      options: ["EDR telemetry", "Wallpaper settings", "Mouse DPI", "Audio drivers"],
      answer: 0,
      explanation: "EDR telemetry provides detailed endpoint behavior visibility."
    },
    {
      level: "Expert",
      question: "Why is correlation important during SOC investigations?",
      options: ["Single logs rarely provide full context", "To reduce visibility", "To disable auditing", "To remove alerts"],
      answer: 0,
      explanation: "Correlating multiple events provides investigation context and attack sequencing."
    },
    {
      level: "Expert",
      question: "Which security model reduces standing administrative privilege?",
      options: ["Just-In-Time access", "Guest access", "Anonymous login", "Open shares"],
      answer: 0,
      explanation: "JIT access minimizes persistent privileged exposure."
    },
    {
      level: "Expert",
      question: "What is the main defensive goal when investigating suspicious 4648 activity?",
      options: ["Contain credential abuse and lateral movement", "Disable all logging", "Remove domain controllers", "Delete user profiles"],
      answer: 0,
      explanation: "The primary goal is stopping credential abuse and preventing attacker spread."
    }
  ], []);
  

  
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);

  const q = questions[current];

  const handleSubmit = () => {
    if (selected === null) return;

    setShowAnswer(true);

    if (selected === q.answer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setShowAnswer(false);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setCompleted(true);
    }
  };

  const restartQuiz = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setShowAnswer(false);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Event ID 4648 Practice Complete</h1>
          <p className="text-lg mb-4">
            Your Score: <span className="font-bold">{score}</span> / {questions.length}
          </p>

          <div className="mb-6 text-left">
            <h2 className="font-semibold text-xl mb-2">Skill Interpretation</h2>
            {score <= 3 && <p>Focus more on understanding authentication basics and Windows log fields.</p>}
            {score > 3 && score <= 7 && (
              <p>You understand the basics well. Continue practicing event correlation and attack scenarios.</p>
            )}
            {score > 7 && (
              <p>Strong understanding of Event ID 4648 and SOC investigation workflow.</p>
            )}
          </div>

          <button
            onClick={restartQuiz}
            className="px-6 py-3 rounded-2xl bg-black text-white hover:opacity-90"
          >
            Restart Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-3xl w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Windows Event ID 4648 Lab</h1>
            <p className="text-gray-500 mt-1">SOC Analyst Practice Portal</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Question</p>
            <p className="font-bold">{current + 1} / {questions.length}</p>
          </div>
        </div>

        <div className="mb-4">
          <span className="px-3 py-1 rounded-full bg-gray-200 text-sm font-medium">
            {q.level}
          </span>
        </div>

        <h2 className="text-2xl font-semibold mb-6">{q.question}</h2>

        <div className="space-y-4">
          {q.options.map((option, index) => {
            const isCorrect = index === q.answer;
            const isSelected = index === selected;

            let style = "border-gray-300";

            if (showAnswer) {
              if (isCorrect) {
                style = "border-green-500 bg-green-50";
              } else if (isSelected && !isCorrect) {
                style = "border-red-500 bg-red-50";
              }
            }

            return (
              <button
                key={index}
                disabled={showAnswer}
                onClick={() => setSelected(index)}
                className={`w-full text-left border-2 rounded-2xl p-4 transition ${style} ${isSelected ? "ring-2 ring-black" : ""}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <div className="mt-6 p-4 rounded-2xl bg-gray-100">
            <h3 className="font-semibold mb-2">Explanation</h3>
            <p>{q.explanation}</p>
          </div>
        )}

        <div className="mt-8 flex justify-between items-center">
          <div>
            <p className="font-medium">Score: {score}</p>
          </div>

          {!showAnswer ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-2xl bg-black text-white hover:opacity-90"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-2xl bg-black text-white hover:opacity-90"
            >
              Next Question
            </button>
          )}
        </div>

        <div className="mt-10 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3">Future Improvements You Can Add</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Add Splunk log analysis simulations</li>
            <li>Create AD attack scenario labs</li>
            <li>Store score history using local storage</li>
            <li>Add SIEM query challenges</li>
            <li>Add detection engineering practice</li>
            <li>Add timed blue-team investigations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
