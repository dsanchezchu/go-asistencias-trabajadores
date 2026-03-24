// VortexBackground.tsx
// Fondo animado usando estilo Aurora de Aceternity
import React, { memo } from 'react'
import { Aurora } from './Aurora'

const VortexBackground = memo(() => {
  return (
    <div className="fixed inset-0 w-screen h-screen -z-50 bg-slate-950 overflow-hidden pointer-events-none">
      <Aurora className="opacity-70" />
    </div>
  )
})

export default VortexBackground
