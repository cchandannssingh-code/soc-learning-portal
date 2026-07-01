"use client"

import { VoiceCall } from "@/types/communication"

interface IncomingCallModalProps {
  call: VoiceCall
  onAccept: () => void
  onReject: () => void
}

export default function IncomingCallModal({ call, onAccept, onReject }: IncomingCallModalProps) {
  const callerName = call.participantNames[call.initiatorId] || "Unknown User"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in slide-in-from-bottom-4">
        {/* Caller Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
              {callerName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-white rounded-full animate-pulse" />
          </div>

          {/* Caller Name */}
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{callerName}</h2>
          <p className="text-slate-500 mb-8">Incoming voice call...</p>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full">
            {/* Reject Button */}
            <button
              onClick={onReject}
              className="
                flex-1 flex items-center justify-center gap-2
                bg-red-500 hover:bg-red-600
                text-white rounded-full
                py-4 px-6
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              "
              aria-label="Reject call"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-semibold">Decline</span>
            </button>

            {/* Accept Button */}
            <button
              onClick={onAccept}
              className="
                flex-1 flex items-center justify-center gap-2
                bg-green-500 hover:bg-green-600
                text-white rounded-full
                py-4 px-6
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              "
              aria-label="Accept call"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-semibold">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}