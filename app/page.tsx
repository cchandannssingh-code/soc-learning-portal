import Link from "next/link"

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 space-y-10">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/30 border border-indigo-100/40 rounded-3xl p-8 md:p-12 shadow-2xs">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-200/25 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-200/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/50 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-6 shadow-2xs"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />SOCForge Academy</span>
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight mb-4">Accelerate Your <span className="text-indigo-600">Cybersecurity</span> Capabilities</h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8">Master real-world detection engineering, Active Directory security architecture, Windows security log analysis, and enterprise-grade blue team operations through structured interactive learning.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/notes/kerberos/ad-credential-attacks" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/10 focus:outline-none hover:-translate-y-0.5">Start Learning</Link>
            <Link href="/quiz" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-6 py-3.5 rounded-xl text-sm transition-all duration-200 focus:outline-none hover:-translate-y-0.5">Launch Quiz</Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between"><h2 className="text-xl md:text-2xl font-extrabold font-display text-slate-900 tracking-tight">Learning Paths & Quizzes</h2><span className="text-xs text-slate-400 font-medium">4 Core Modules</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PathwayCard tone="purple" icon={<><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h3m-3 4h3m-6.25 3h.01M12 19h.01M8.25 15h.01M8.25 19h.01m-4.72-2h.01M4.72 15h.01m.08-6H12a2 2 0 012 2v8a2 2 0 01-2 2H4.8a2 2 0 01-2-2V11a2 2 0 012-2z" /></>} title="Active Directory Security" description="Deconstruct core Kerberos authentication mechanics. Study modern credential attacks, including Golden Ticket fabrication, Kerberoasting, DCSync, and Pass-the-Ticket mitigations." primary={{href:"/notes/kerberos/ad-credential-attacks",label:"View Syllabus"}} secondary={{href:"/assessment/kerberos/ad-credential-attacks",label:"Take Quiz"}} />
          <PathwayCard tone="indigo" icon={<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" /></>} title="Windows Event Log Analysis" description="Understand security event log collection and parsing. Analyze critical Event IDs such as 4624 (Logon), 4648 (Explicit Credentials), and 4688 (Process Creation) to spot anomalies." primary={{href:"/notes/windows/event-4624",label:"View Notes"}} secondary={{href:"/assessment/windows",label:"Take Quiz"}} />
          <PathwayCard tone="cyan" icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />} title="Detection Engineering & SIEM" description="Develop custom detection logic and search query structures. Implement Splunk searches, correlate alerts, identify false positives, and streamline security operations center workflows." primary={{href:"/notes/splunk/test",label:"Open Notes"}} />
          <PathwayCard tone="pink" icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />} title="Multiplayer Assessment Rooms" description="Test your security knowledge under pressure! Join real-time, synchronized multiplayer assessment lobbies with live leaderboards, active anti-cheat enforcement, and performance analytics." primary={{href:"/quiz",label:"Enter Lobbies"}} />
        </div>
      </div>

    </div>
  )
}

const tones = {
  purple: { box:"bg-purple-50 border-purple-100", icon:"text-purple-600", action:"bg-purple-50 hover:bg-purple-100 text-purple-700" },
  indigo: { box:"bg-indigo-50 border-indigo-100", icon:"text-indigo-600", action:"bg-indigo-50 hover:bg-indigo-100 text-indigo-700" },
  cyan: { box:"bg-cyan-50 border-cyan-100", icon:"text-cyan-600", action:"bg-cyan-50 hover:bg-cyan-100 text-cyan-700" },
  pink: { box:"bg-pink-50 border-pink-100", icon:"text-pink-600", action:"bg-pink-50 hover:bg-pink-100 text-pink-700" },
}

function PathwayCard({ tone, icon, title, description, primary, secondary }: { tone:keyof typeof tones; icon:React.ReactNode; title:string; description:string; primary:{href:string;label:string}; secondary?:{href:string;label:string} }) {
  const colors = tones[tone]
  return <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 hover-lift flex flex-col justify-between"><div><div className={`w-12 h-12 ${colors.box} border rounded-2xl flex items-center justify-center mb-6 shadow-2xs`}><svg className={`w-6 h-6 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{icon}</svg></div><h3 className="text-xl font-bold font-display text-slate-950 mb-2">{title}</h3><p className="text-slate-500 text-sm leading-relaxed mb-6">{description}</p></div><div className="flex gap-3 pt-4 border-t border-slate-50"><Link href={primary.href} className={`${secondary ? "flex-1" : "w-full"} text-center ${secondary ? "bg-slate-50 hover:bg-slate-100 text-slate-700" : colors.action} font-bold py-3.5 rounded-xl text-xs transition`}>{primary.label}</Link>{secondary && <Link href={secondary.href} className={`flex-1 text-center ${colors.action} font-bold py-3.5 rounded-xl text-xs transition`}>{secondary.label}</Link>}</div></div>
}