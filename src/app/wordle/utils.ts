export function getTodaysWord() {
  const june1 = new Date("2025-06-01")
  const now = new Date()

  const todaysWordNumber = Math.floor(
    (now.getTime() - june1.getTime()) / 1000 / 60 / 60 / 24,
  )
  return todaysWordNumber
}
