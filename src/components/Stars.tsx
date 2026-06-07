/**
 * Star rating display: filled amber stars + gray remainder + numeric value,
 * so there's never any doubt about the rating.
 */
export default function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="tracking-tight">
        <span className="text-amber-500">{'★'.repeat(r)}</span>
        <span className="text-gray-300">{'★'.repeat(5 - r)}</span>
      </span>
      <span className="font-medium text-gray-600">{r}/5</span>
    </span>
  )
}
