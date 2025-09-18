'use client'

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react'

interface LocomotiveScrollContextType {
  scroll: any | null
  isReady: boolean
}

const LocomotiveScrollContext = createContext<LocomotiveScrollContextType>({
  scroll: null,
  isReady: false,
})

export const useLocomotiveScrollContext = () => {
  const context = useContext(LocomotiveScrollContext)
  if (!context) {
    throw new Error('useLocomotiveScrollContext must be used within LocomotiveScrollProvider')
  }
  return context
}

interface LocomotiveScrollProviderProps {
  children: ReactNode
  options?: any
}

export const LocomotiveScrollProvider: React.FC<LocomotiveScrollProviderProps> = ({
  children,
  options = {},
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const locomotiveScrollRef = useRef<any | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !scrollRef.current) return

    const initLocomotiveScroll = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const LocomotiveScroll = (await import('locomotive-scroll')).default

        const defaultOptions = {
          smooth: true,
          multiplier: 1,
          class: 'is-revealed',
          scrollbarContainer: false,
          scrollbarClass: 'c-scrollbar',
          scrollingClass: 'has-scroll-scrolling',
          draggingClass: 'has-scroll-dragging',
          smoothClass: 'has-scroll-smooth',
          initClass: 'has-scroll-init',
          getSpeed: false,
          getDirection: false,
          scrollFromAnywhere: false,
          inertia: 0.1,
          tablet: {
            smooth: false,
            direction: 'vertical',
            horizontalGesture: false,
          },
          smartphone: {
            smooth: false,
            direction: 'vertical',
            horizontalGesture: false,
          },
          ...options,
        }

        locomotiveScrollRef.current = new LocomotiveScroll({
          el: scrollRef.current,
          ...defaultOptions,
        })

        locomotiveScrollRef.current.on('ready', () => {
          setIsReady(true)
        })

        const handleResize = () => {
          if (locomotiveScrollRef.current) {
            locomotiveScrollRef.current.update()
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (locomotiveScrollRef.current) {
            locomotiveScrollRef.current.destroy()
            locomotiveScrollRef.current = null
          }
          setIsReady(false)
        }
      } catch (error) {
        console.warn('LocomotiveScroll failed to initialize:', error)
        setIsReady(true) // Set ready even if locomotive scroll fails
      }
    }

    const cleanup = initLocomotiveScroll()

    return () => {
      cleanup.then(cleanupFn => {
        if (cleanupFn) cleanupFn()
      })
    }
  }, [options])

  return (
    <LocomotiveScrollContext.Provider 
      value={{ 
        scroll: locomotiveScrollRef.current, 
        isReady 
      }}
    >
      <div ref={scrollRef} data-scroll-container>
        {children}
      </div>
    </LocomotiveScrollContext.Provider>
  )
}

export default LocomotiveScrollProvider