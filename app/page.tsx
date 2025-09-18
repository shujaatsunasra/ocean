'use client'

import { useApp } from './providers'
import { Preloader } from '@/components/Preloader'
import { AppLayout } from '@/components/layout/AppLayout'

export default function Home() {
  const { isLoading } = useApp()

  if (isLoading) {
    return <Preloader />
  }

  return <AppLayout />
}
