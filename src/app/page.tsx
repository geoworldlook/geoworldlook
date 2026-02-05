'use client'

import { useState, useEffect } from 'react'
import { DashboardClient } from '@/components/dashboard-client'
import { getAppData, AppData } from '@/lib/data'

export default function Home() {
  const [data, setData] = useState<AppData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getAppData()
        setData(dashboardData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl font-headline">
            Alpine Snow Watch
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Real-time snow condition monitoring for key alpine locations.
          </p>
        </header>
        {isLoading || !data ? (
          <p>Loading live data...</p>
        ) : (
          <DashboardClient data={data} />
        )}
      </div>
    </main>
  )
}
