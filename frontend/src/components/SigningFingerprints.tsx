import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Check, KeyRound } from 'lucide-react'
import { appsApi } from '@/api/apps'

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 w-16 shrink-0 text-xs font-semibold">{label}</span>
      <code className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 font-mono text-[11px] text-slate-800 break-all select-all">{value}</code>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="p-1.5 text-slate-400 hover:text-slate-700 shrink-0"
        title="Copy"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

/** SHA-1 / SHA-256 fingerprints of the key this app is signed with — for
 *  Firebase Auth (Google Sign-In), Google Maps and other Google APIs. */
export default function SigningFingerprints({ appId }: { appId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['signing', appId],
    queryFn: () => appsApi.getSigning(appId).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!appId,
  })
  if (isLoading || !data?.available) return null
  return (
    <div className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
      <p className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
        <KeyRound className="w-3.5 h-3.5" /> Signing certificate fingerprints
      </p>
      <p className="text-slate-500 -mt-1 text-[11px]">Use these for Firebase (Google Sign-In), Google Maps and other Google APIs.</p>
      {data.sha1 && <CopyRow label="SHA-1" value={data.sha1} />}
      {data.sha256 && <CopyRow label="SHA-256" value={data.sha256} />}
      {data.note && <p className="text-slate-400 pt-0.5 text-[11px]">{data.note}</p>}
    </div>
  )
}
