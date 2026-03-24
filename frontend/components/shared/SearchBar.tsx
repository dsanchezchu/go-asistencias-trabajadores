import { Search } from 'lucide-react'
import React from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="relative group">
      <input
        type="text"
        placeholder={placeholder || 'Buscar...'}
        className="w-full bg-base-200 border border-base-300 text-foreground font-medium text-sm p-3 rounded-xl outline-none focus:border-primary focus:bg-base-100 transition-all pl-10"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" size={16} />
    </div>
  )
}
