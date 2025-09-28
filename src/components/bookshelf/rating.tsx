export const ratingSteps: number[] = Array.from(
  { length: 10 },
  (_, index) => 0.5 + index * 0.5,
)

export const normalizeRating = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return null
  }
  return value > 5 ? value / 2 : value
}

export const denormalizeRating = (value: number | null) => {
  if (value === null) {
    return null
  }
  return Math.round(value * 2)
}

export const isValidHalfStep = (value: number) => Number.isInteger(value * 2)

export const RatingStars = ({ rating }: { rating: number }) => {
  const clampedRating = Math.max(0, Math.min(5, rating))
  const percentage = (clampedRating / 5) * 100

  return (
    <span
      className="inline-flex items-center gap-2"
      aria-label={`${clampedRating} out of 5 stars`}
    >
      <span className="relative inline-block text-lg">
        <span aria-hidden className="flex text-gray-300">★★★★★</span>
        <span
          aria-hidden
          className="absolute inset-0 overflow-hidden text-yellow-400"
          style={{ width: `${percentage}%` }}
        >
          <span className="flex">★★★★★</span>
        </span>
      </span>
      <span className="text-xs text-gray-500">{clampedRating.toFixed(1)}</span>
    </span>
  )
}
