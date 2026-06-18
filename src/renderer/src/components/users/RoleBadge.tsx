type Role = 'admin' | 'editor' | 'contributor' | 'viewer' | 'user'

const STYLES: Record<Role, string> = {
  admin: 'bg-[#eef2ff] text-[#4f39f6]',
  editor: 'bg-[#f3e8ff] text-[#9333ea]',
  contributor: 'bg-[#ccfbf1] text-[#0d9488]',
  viewer: 'bg-[#f3f4f6] text-[#6b7280]',
  user: 'bg-[#f3f4f6] text-[#6b7280]'
}

const LABELS: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Editor',
  contributor: 'Contributor',
  viewer: 'Viewer',
  user: 'User'
}

export function normalizeRole(role: string): Role {
  if (role === 'admin') return 'admin'
  if (role === 'editor') return 'editor'
  if (role === 'contributor') return 'contributor'
  if (role === 'viewer') return 'viewer'
  return 'user'
}

export default function RoleBadge({ role }: { role: string }): JSX.Element {
  const r = normalizeRole(role)
  return (
    <span className={`inline-flex rounded-full px-3 py-1 font-display text-[12px] font-medium capitalize ${STYLES[r]}`}>
      {LABELS[r]}
    </span>
  )
}
