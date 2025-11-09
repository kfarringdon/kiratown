"use client"

import { useEffect, useState } from "react"

export function Weather() {
  const [temperature, setTemperature] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch("/api/weather")
        if (!response.ok) {
          throw new Error("Failed to fetch weather")
        }
        const data = await response.json()
        setTemperature(data.temperature)
      } catch (err) {
        setError("Error loading weather")
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  if (loading) {
    return <div className="text-sm">Loading...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>
  }

  return (
    <div className="text-sm">
      Brighton: {temperature !== null ? `${Math.round(temperature)}°C` : "—"}
    </div>
  )
}
