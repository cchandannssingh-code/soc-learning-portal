const quiz = {
  title: "Windows Authentication Quiz",

  questions: [
    {
      question: "Which Event ID indicates successful login?",
      options: ["4625", "4624", "4104", "4688"],
      answer: "4624",
    },

    {
      question: "Which Event ID indicates failed login?",
      options: ["4104", "4625", "4672", "4688"],
      answer: "4625",
    },

    {
      question:
        "Which protocol is used in Active Directory authentication?",

      options: ["FTP", "Kerberos", "SMTP", "SNMP"],

      answer: "Kerberos",
    },
  ],
};

export default quiz;