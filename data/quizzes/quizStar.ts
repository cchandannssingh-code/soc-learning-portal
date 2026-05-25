const quiz = {
  title: "Windows Authentication and Active Directory Security Quiz",

  questions: [
    {
      question: "Which Windows process is primarily responsible for authentication and access token generation?",
      options: ["Winlogon.exe", "Explorer.exe", "LSASS.exe", "Services.exe"],
      answer: "LSASS.exe",
    },

    {
      question: "Which authentication protocol is the default in Active Directory environments?",
      options: ["NTLMv1", "NTLMv2", "Kerberos", "LDAP"],
      answer: "Kerberos",
    },

    {
      question: "Why does Pass-the-Hash work successfully?",
      options: [
        "Kerberos trusts NTLM hashes",
        "NTLM treats the hash itself as proof of identity",
        "LSASS stores plaintext credentials only",
        "PAC validation fails automatically",
      ],
      answer: "NTLM treats the hash itself as proof of identity",
    },

    {
      question: "Which authentication package handles NTLM authentication inside Windows?",
      options: ["Kerberos.dll", "Negotiate SSP", "MSV1_0", "SAMSRV"],
      answer: "MSV1_0",
    },

    {
      question: "A user logs into a domain-joined laptop without internet connectivity and still successfully authenticates. Which mechanism allows this?",
      options: [
        "Kerberos delegation",
        "NTLM relay",
        "DCC2 Cached Credentials",
        "SID caching",
      ],
      answer: "DCC2 Cached Credentials",
    },

    {
      question: "Which Kerberos component issues Service Tickets?",
      options: ["AS", "TGS", "PAC", "SPN"],
      answer: "TGS",
    },

    {
      question: "Which account hash is required to forge a Golden Ticket?",
      options: ["Administrator", "Service Account", "Machine Account", "KRBTGT"],
      answer: "KRBTGT",
    },

    {
      question: "Why can Silver Tickets sometimes avoid detection from the Domain Controller?",
      options: [
        "Silver Tickets bypass encryption",
        "Service validates the ticket locally without contacting KDC",
        "PAC validation is disabled",
        "NTLM fallback occurs automatically",
      ],
      answer: "Service validates the ticket locally without contacting KDC",
    },

    {
      question: "Which event ID is MOST associated with Kerberos Service Ticket requests?",
      options: ["4624", "4648", "4768", "4769"],
      answer: "4769",
    },

    {
      question: "What is the primary role of Negotiate SSP?",
      options: [
        "Store NTLM hashes",
        "Validate PAC signatures",
        "Decide between Kerberos and NTLM",
        "Encrypt LSASS memory",
      ],
      answer: "Decide between Kerberos and NTLM",
    },

    {
      question: "Which attack abuses Active Directory replication permissions to retrieve password hashes?",
      options: ["Pass-the-Hash", "Kerberoasting", "DCSync", "Silver Ticket"],
      answer: "DCSync",
    },

    {
      question: "Why are service accounts with weak passwords dangerous?",
      options: [
        "They disable Kerberos logging",
        "Their service tickets can be cracked offline",
        "They bypass LSASS authentication",
        "They automatically become Domain Admins",
      ],
      answer: "Their service tickets can be cracked offline",
    },

    {
      question: "A SOC analyst notices Event ID 4769 spikes, RC4 encryption usage, and multiple SPN requests. What attack is MOST likely occurring?",
      options: ["Golden Ticket", "DCSync", "Kerberoasting", "Password Spraying"],
      answer: "Kerberoasting",
    },

    {
      question: "Which Kerberos structure contains authorization-related information like group memberships?",
      options: ["SPN", "PAC", "TGS-REP", "AS-REQ"],
      answer: "PAC",
    },

    {
      question: "An attacker steals a TGT from LSASS and injects it into another session. Which attack technique is this?",
      options: ["Pass-the-Hash", "Pass-the-Ticket", "Silver Ticket", "DCSync"],
      answer: "Pass-the-Ticket",
    },

    {
      question: "Which condition MOST commonly forces Windows to fall back from Kerberos to NTLM?",
      options: [
        "AES encryption enabled",
        "PAC checksum mismatch",
        "SPN resolution failure",
        "TGT renewal request",
      ],
      answer: "SPN resolution failure",
    },

    {
      question: "Which attack allows an attacker to forge tickets for only a specific service?",
      options: ["Golden Ticket", "Silver Ticket", "Pass-the-Ticket", "Skeleton Key"],
      answer: "Silver Ticket",
    },

    {
      question: "Why is LSASS considered a high-value target?",
      options: [
        "It controls DNS resolution",
        "It stores GPOs",
        "It may contain hashes and Kerberos tickets",
        "It validates SPNs directly",
      ],
      answer: "It may contain hashes and Kerberos tickets",
    },

    {
      question: "A workstation that is NOT a Domain Controller starts making replication requests. What should defenders suspect FIRST?",
      options: ["Kerberoasting", "NTLM relay", "DCSync", "Password spraying"],
      answer: "DCSync",
    },

    {
      question: "Why is Kerberoasting often considered low-noise?",
      options: [
        "It disables security logs",
        "TGS requests are legitimate Kerberos operations",
        "It bypasses Event IDs",
        "LSASS is never accessed",
      ],
      answer: "TGS requests are legitimate Kerberos operations",
    },

    {
      question: "An attacker compromises a server configured with unconstrained delegation. Later, a Domain Admin authenticates to that server. What is the MOST likely risk?",
      options: [
        "Password spraying",
        "TGT theft and lateral movement",
        "SID History Injection",
        "NTLM downgrade attack",
      ],
      answer: "TGT theft and lateral movement",
    },

    {
      question: "Why is AES-only Kerberos enforcement recommended?",
      options: [
        "AES disables PAC validation",
        "RC4 Kerberos tickets are easier to crack offline",
        "AES prevents TGS requests",
        "AES blocks SPN registration",
      ],
      answer: "RC4 Kerberos tickets are easier to crack offline",
    },

    {
      question: "A forged Golden Ticket still works after the compromised user password is reset. Why?",
      options: [
        "Kerberos ignores password resets",
        "TGT validation depends on KRBTGT hash",
        "PAC validation skips disabled users",
        "NTLM fallback is automatically enabled",
      ],
      answer: "TGT validation depends on KRBTGT hash",
    },

    {
      question: "Which event ID is MOST associated with NTLM authentication?",
      options: ["4624", "4769", "4776", "4672"],
      answer: "4776",
    },

    {
      question: "A service accepts Kerberos authentication successfully, but no corresponding Event ID 4769 exists on the Domain Controller. What is the MOST likely explanation?",
      options: [
        "Pass-the-Hash",
        "NTLM fallback",
        "Silver Ticket forgery",
        "DCC2 authentication",
      ],
      answer: "Silver Ticket forgery",
    },
  ],
};

export default quiz;