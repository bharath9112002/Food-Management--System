import { useState } from 'react'
import QuickActions from '../components/dashboard/QuickActions'
import RecentOrders from '../components/dashboard/RecentOrders'
import RevenueChart from '../components/dashboard/RevenueChart'
import StatCard from '../components/dashboard/StatCard'
import { useAuth } from '../context/AuthContext'
import { MONTHLY_REVENUE, RECENT_ORDERS, STATS } from '../data/dashboardData'

function getToday() {
  const now = new Date()
  const hour = now.getHours()
  return {
    greeting: hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening',
    date: now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [today] = useState(getToday)

  return (
    <main className="dashboard">
      <div className="page-head">
        <div>
          <h1>
            {today.greeting}, {user.name.split(' ')[0]} 👋
          </h1>
          <p>Here&apos;s what&apos;s happening with FoodHub today.</p>
        </div>
        <span className="page-date">{today.date}</span>
      </div>

      <section className="stats-grid" aria-label="Key metrics">
        {STATS.map((s) => (
          <StatCard key={s.key} {...s} />
        ))}
      </section>

      <div className="dashboard-grid">
        <RevenueChart data={MONTHLY_REVENUE} />
        <QuickActions />
      </div>

      <RecentOrders orders={RECENT_ORDERS} />
    </main>
  )
}
