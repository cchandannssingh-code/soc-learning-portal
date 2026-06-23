export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-2xs">
        
        {/* LIGHT GLOW EFFECT */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          
          {/* BADGE */}
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/50 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-6 shadow-2xs">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
            SOC • Detection Engineering • Blue Team
          </span>

          {/* TITLE */}
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight mb-6">
            About SOCForge
          </h1>

          {/* SUBTITLE */}
          <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl mb-10">
            SOCForge is an interactive educational framework designed to narrow the gap between theoretical security concepts and actual security operations. The platform teaches students how to analyze telemetry, isolate threat vectors, and engineer resilient detections.
          </p>

          {/* GRID */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* CARD 1 */}
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6 hover-lift">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold font-display text-slate-900 mb-2">
                Platform Vision
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Provide cybersecurity students and professionals with clean, high-fidelity log telemetry analyses, granular vulnerability breakdowns, and realtime knowledge checks.
              </p>
            </div>

            {/* CARD 2 */}
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6 hover-lift">
              <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold font-display text-slate-900 mb-2">
                Built & Maintained By
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Developed by Chandan with an emphasis on scalable defensive security education, hands-on active directory forensics, and detection engineering simulations.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}