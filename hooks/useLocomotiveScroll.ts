import { useEffect, useRef, MutableRefObject } from 'react'
import LocomotiveScroll from 'locomotive-scroll'

interface UseLocomotiveScrollOptions {
  start?: boolean
  smooth?: boolean
  multiplier?: number
  class?: string
  scrollbarContainer?: boolean
  scrollbarClass?: string
  scrollingClass?: string
  draggingClass?: string
  smoothClass?: string
  initClass?: string
  getSpeed?: boolean
  getDirection?: boolean
  scrollFromAnywhere?: boolean
  inertia?: number
  tablet?: {
    smooth?: boolean
    direction?: 'vertical' | 'horizontal'
    horizontalGesture?: boolean
  }
  smartphone?: {
    smooth?: boolean
    direction?: 'vertical' | 'horizontal'
    horizontalGesture?: boolean
  }
}

export const useLocomotiveScroll = (
  options: UseLocomotiveScrollOptions = {}
): {
  scrollRef: MutableRefObject<HTMLDivElement | null>
  locomotiveScroll: MutableRefObject<LocomotiveScroll | null>
} => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const locomotiveScroll = useRef<LocomotiveScroll | null>(null)

  useEffect(() => {
    if (!scrollRef.current) return

    const defaultOptions: UseLocomotiveScrollOptions = {
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

    locomotiveScroll.current = new LocomotiveScroll({
      el: scrollRef.current,
      ...defaultOptions,
      scrollbarContainer: defaultOptions.scrollbarContainer === true ? undefined : defaultOptions.scrollbarContainer,
    } as any)

    // Update scroll on window resize
    const handleResize = () => {
      if (locomotiveScroll.current) {
        locomotiveScroll.current.update()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (locomotiveScroll.current) {
        locomotiveScroll.current.destroy()
        locomotiveScroll.current = null
      }
    }
  }, [])

  return { scrollRef, locomotiveScroll }
}

export default useLocomotiveScroll