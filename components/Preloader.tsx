// Legacy preloader - replaced by components/ui/Preloader.tsx
// This file is kept for backward compatibility

'use client'

import { Preloader as NewPreloader } from './ui/Preloader'

export function Preloader() {
  return <NewPreloader />
}