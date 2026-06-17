import { ncFetch } from './nextcloud'
import type { ActivityEntry } from '../types/files'
import { MOCK_ACTIVITIES } from '../data/mockFiles'

export async function getActivities(): Promise<ActivityEntry[]> {
  try {
    const res = await ncFetch('/ocs/v2.php/apps/activity/api/v2/activity?format=json')
    if (!res.ok) throw new Error('Activity fetch failed')
    const data = await res.json()
    const items = data?.ocs?.data ?? []
    return items.map((item: Record<string, string>, i: number) => ({
      id: String(item.activity_id ?? i),
      user: item.user ?? 'Unknown',
      action: item.subject ?? 'performed an action on',
      target: item.object_name ?? '',
      timestamp: new Date(item.datetime ?? Date.now()),
      type: 'other' as const
    }))
  } catch {
    return MOCK_ACTIVITIES
  }
}
