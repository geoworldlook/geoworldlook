'use client'

import { useState, useEffect } from 'react'
import { DashboardClient } from '@/components/dashboard-client'
import { fetchAppData } from '@/lib/api'
import type { AppData } from '@/lib/data'

export default function Home() {
  const [data, setData] = useState<AppData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await fetchAppData()
        setData(dashboardData)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching data.')
        }
        console.error('Failed to fetch dashboard data:', err)
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
        {isLoading && <p>Loading live data...</p>}
        {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive">Database Connection Error</CardTitle>
                <CardDescription className="text-destructive/80">
                  Could not connect to the Supabase database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Error details:</p>
                <p className="text-sm font-mono p-2 bg-destructive/10 rounded-md my-2">{error}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Please ensure you have replaced the placeholder values in your <strong>.env.local</strong> file with your actual Supabase URL and anonymous key. You can find these in your Supabase project dashboard under Project Settings &gt; API.
                </p>
              </CardContent>
            </Card>
        )}
        {!isLoading && !error && data && <DashboardClient data={data} />}
      </div>
    </main>
  )
}
