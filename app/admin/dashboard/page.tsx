import { isAdminAuthenticated } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'

export default async function DashboardPage() {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect('/admin')

  return <AdminDashboard />
}
