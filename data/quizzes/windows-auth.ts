const quiz = {
  title: "Windows Authentication & Security Events Quiz",
   duration: 15, // minutes

  questions: [
    {
      question: "Which Event ID indicates a successful logon?",
      options: ["4625", "4624", "4768", "4771"],
      answer: "4624",
    },

    {
      question: "Which Event ID indicates a failed logon attempt?",
      options: ["4624", "4625", "4769", "4688"],
      answer: "4625",
    },

    {
      question:
        "A user logs directly into a workstation using keyboard and monitor. Which Logon Type would typically appear in Event ID 4624?",
      options: ["2", "3", "5", "10"],
      answer: "2",
    },

    {
      question:
        "A user accesses a file share on a remote server. Which Logon Type is most commonly observed?",
      options: ["2", "3", "5", "10"],
      answer: "3",
    },

    {
      question:
        "Which Logon Type is commonly associated with Remote Desktop (RDP) logins?",
      options: ["2", "3", "7", "10"],
      answer: "10",
    },

    {
      question:
        "Which Logon Type is typically generated when a Windows service starts using a service account?",
      options: ["2", "5", "7", "10"],
      answer: "5",
    },

    {
      question:
        "Which Logon Type indicates that a workstation was unlocked?",
      options: ["2", "7", "10", "11"],
      answer: "7",
    },

    {
      question:
        "Which Logon Type indicates cached domain credentials were used?",
      options: ["3", "5", "10", "11"],
      answer: "11",
    },

    {
      question:
        "A user launches cmd.exe using 'Run as different user'. Which Event ID would most likely be generated?",
      options: ["4648", "4688", "4720", "4698"],
      answer: "4648",
    },

    {
      question:
        "Which Event ID indicates explicit credentials were supplied for authentication?",
      options: ["4624", "4648", "4771", "4728"],
      answer: "4648",
    },

    {
      question:
        "Which Event ID is generated when a Kerberos Ticket Granting Ticket (TGT) is requested?",
      options: ["4768", "4769", "4771", "4776"],
      answer: "4768",
    },

    {
      question:
        "Which Event ID indicates a Kerberos Service Ticket request?",
      options: ["4768", "4769", "4624", "4771"],
      answer: "4769",
    },

    {
      question:
        "Which Event ID indicates Kerberos pre-authentication failure?",
      options: ["4768", "4769", "4771", "4776"],
      answer: "4771",
    },

    {
      question:
        "A domain controller validates NTLM credentials. Which Event ID would you expect?",
      options: ["4624", "4768", "4771", "4776"],
      answer: "4776",
    },

    {
      question:
        "A large number of Event ID 4771 failures from a single source may indicate which activity?",
      options: [
        "Password spraying",
        "Service installation",
        "Registry modification",
        "Process injection",
      ],
      answer: "Password spraying",
    },

    {
      question:
        "Which Event ID is most commonly investigated during Kerberoasting attacks?",
      options: ["4769", "4728", "4688", "4657"],
      answer: "4769",
    },

    {
      question:
        "A new user account was created in Active Directory. Which Event ID would be generated?",
      options: ["4720", "4722", "4725", "4726"],
      answer: "4720",
    },

    {
      question:
        "An administrator enables a previously disabled account. Which Event ID is generated?",
      options: ["4720", "4722", "4725", "4726"],
      answer: "4722",
    },

    {
      question:
        "A user changes their own password. Which Event ID would you investigate?",
      options: ["4723", "4724", "4725", "4726"],
      answer: "4723",
    },

    {
      question:
        "A helpdesk analyst resets another user's password. Which Event ID is generated?",
      options: ["4723", "4724", "4725", "4726"],
      answer: "4724",
    },

    {
      question:
        "Which Event ID indicates that a user account has been disabled?",
      options: ["4722", "4725", "4726", "4732"],
      answer: "4725",
    },

    {
      question:
        "Which Event ID indicates that a user account has been deleted?",
      options: ["4720", "4725", "4726", "4728"],
      answer: "4726",
    },

    {
      question:
        "A user was added to a Domain Admins group. Which Event ID would most likely be generated?",
      options: ["4728", "4732", "4720", "4624"],
      answer: "4728",
    },

    {
      question:
        "Which Event ID is generated when a new process starts on a Windows system?",
      options: ["4688", "4698", "7045", "4657"],
      answer: "4688",
    },

    {
      question:
        "An attacker creates persistence using a scheduled task. Which Event ID should be reviewed?",
      options: ["4698", "7045", "4688", "4720"],
      answer: "4698",
    },

    {
      question:
        "An attacker installs a malicious Windows service for persistence. Which Event ID would most likely be generated?",
      options: ["7045", "4698", "4657", "4726"],
      answer: "7045",

    },
    {
  question:
    "An attacker uses RunAs, launches PowerShell, and creates a scheduled task. Which sequence best matches the attack?",
  options: [
    "4648 → 4688 → 4698",
    "4768 → 4769 → 4771",
    "4720 → 4725 → 4726",
    "4624 → 4625 → 4776",
  ],
  answer: "4648 → 4688 → 4698",
}



  ],
};

export default quiz;