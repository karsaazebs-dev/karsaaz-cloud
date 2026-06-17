import { useState } from 'react'
import { MOCK_REQUESTS } from '../data/mockFiles'

const STATUS_STYLES = {
  pending: 'bg-[#fef3c7] text-[#d97706]',
  approved: 'bg-[#dcfce7] text-[#16a34a]',
  rejected: 'bg-[#fee2e2] text-[#dc2626]'
}

export default function Requests(): JSX.Element {
  const [requests, setRequests] = useState(MOCK_REQUESTS)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [gb, setGb] = useState('50')

  const submitRequest = (): void => {
    if (!email) return
    setRequests((prev) => [{
      id: `r-${Date.now()}`,
      user: email.split('@')[0],
      email,
      requestedGb: parseInt(gb, 10),
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    }, ...prev])
    setShowForm(false)
    setEmail('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold text-[#09090b]">Storage Requests</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white"
        >
          New Request
        </button>
      </div>

      {showForm && (
        <div className="rounded-[12px] bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-[16px] font-semibold">New Storage Request</h3>
          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="rounded-[8px] border border-[#e5e5e5] px-4 py-2 font-display text-[14px] outline-none focus:border-[#2b7fff]"
            />
            <input
              type="number"
              value={gb}
              onChange={(e) => setGb(e.target.value)}
              placeholder="GB requested"
              className="rounded-[8px] border border-[#e5e5e5] px-4 py-2 font-display text-[14px] outline-none focus:border-[#2b7fff]"
            />
            <div className="flex gap-2">
              <button onClick={submitRequest} className="rounded-[8px] bg-[#2b7fff] px-4 py-2 text-[13px] text-white">Submit</button>
              <button onClick={() => setShowForm(false)} className="rounded-[8px] border border-[#e5e5e5] px-4 py-2 text-[13px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-[12px] bg-white p-4 shadow-sm">
            <div>
              <p className="font-display text-[14px] font-semibold text-[#09090b]">{r.user}</p>
              <p className="font-display text-[12px] text-[#71717b]">{r.email} • {r.requestedGb} GB • {r.createdAt}</p>
            </div>
            <span className={`rounded-[6px] px-2.5 py-1 font-display text-[12px] font-medium capitalize ${STATUS_STYLES[r.status]}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
