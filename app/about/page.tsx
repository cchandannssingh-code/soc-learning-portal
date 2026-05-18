export default function AboutPage() {

  return (

    <div className="max-w-4xl mx-auto">

      <div className="relative overflow-hidden bg-gradient-to-br from-[#081120] via-[#0d1728] to-[#111c30] border border-white/[0.05] rounded-[32px] p-8 md:p-12 shadow-2xl backdrop-blur-xl">

        {/* GLOW EFFECT */}

        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full" />

        <div className="relative z-10">

          {/* BADGE */}

          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium mb-6 tracking-wide">

            SOC • Detection Engineering • Blue Team

          </div>

          {/* TITLE */}

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mb-6">

            About SOCForge

          </h1>

          {/* SUBTITLE */}

          <p className="text-lg md:text-xl tracking-wide text-slate-400 leading-relaxed max-w-3xl mb-10">

            SOCForge is a modern cybersecurity learning platform focused on
            real-world detection engineering, Active Directory security,
            Windows event analysis, and blue team operations.

          </p>

          {/* GRID */}

          <div className="grid md:grid-cols-2 gap-6">

            {/* CARD 1 */}

            <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-6 backdrop-blur-sm">

              <h2 className="text-xl font-bold text-white mb-4">

                Platform Vision

              </h2>

              <p className="text-slate-400 leading-relaxed">

                The platform is designed to provide structured cybersecurity
                learning, advanced assessments, and future SOC lab simulations
                with practical enterprise-focused scenarios.

              </p>

            </div>

            {/* CARD 2 */}

            <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-6 backdrop-blur-sm">

              <h2 className="text-xl font-bold text-white mb-4">

                Built By

              </h2>

              <p className="text-slate-400 leading-relaxed">

                Developed and maintained by Chandan with a focus on
                scalable SOC education, detection engineering,
                and hands-on cybersecurity learning.

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <footer className="mt-8 pb-6 text-center text-sm text-slate-400">

        © 2026 SOCForge. All rights reserved.

      </footer>

    </div>
  )
}