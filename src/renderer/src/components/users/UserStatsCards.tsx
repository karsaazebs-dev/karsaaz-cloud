import { Users, UserCheck, HardDrive, Share2 } from 'lucide-react'
import StatCard from '../ui/StatCard'
import { fmtPool } from '../../utils/storageFormat'

interface UserStatsCardsProps {
  totalUsers: number
  activeUsers: number
  serverStorageBytes: number
  allocatedBytes: number
}

export default function UserStatsCards({
  totalUsers,
  activeUsers,
  serverStorageBytes,
  allocatedBytes
}: UserStatsCardsProps): JSX.Element {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard label="Total Users" value={String(totalUsers)} sub="across all roles" Icon={Users} />
      <StatCard label="Active Users" value={String(activeUsers)} sub="currently active" Icon={UserCheck} />
      <StatCard label="Server Storage" value={fmtPool(serverStorageBytes)} sub="total provisioned" Icon={HardDrive} />
      <StatCard label="Allocated Storage" value={fmtPool(allocatedBytes)} sub="across all users" Icon={Share2} />
    </div>
  )
}
