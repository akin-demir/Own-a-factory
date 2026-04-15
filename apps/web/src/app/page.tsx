import { redirect } from 'next/navigation'

export default function RootPage() {
  // Server-side: redirect to dashboard (client will handle auth check)
  redirect('/dashboard')
}
