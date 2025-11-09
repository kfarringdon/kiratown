import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch(
      "https://api.openweathermap.org/data/2.5/weather?units=metric&lat=50.8214626&lon=-0.1400561&appid=5c94f19e376a12c4c88d734934b50a28",
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch weather data" },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Extract temperature from the response (temperature is in Kelvin)
    const temperature = data.main?.temp

    if (temperature === undefined) {
      return NextResponse.json(
        { error: "Temperature data not found" },
        { status: 500 },
      )
    }

    return NextResponse.json({ temperature })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
