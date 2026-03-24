import Card from '../ui/Card'

interface StatBoxProps {
  label: string
  count: number
  color: string
}

export default function StatBox({ label, count, color }: StatBoxProps) {
  return (
    <Card className="flex flex-col items-center justify-center text-center p-3! rounded-2xl! border border-base-300">
      <span className={`text-lg font-black ${color} mb-0.5 italic`}>{count}</span>
      <span className="text-foreground/40 text-[7px] font-black uppercase tracking-widest">{label}</span>
    </Card>
  )
}
