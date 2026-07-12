import { useState, useEffect, useRef } from 'react'

export function useCountUp(target: number, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    setValue(0)
    const t = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(Math.round(target * eased))
        if (p < 1) raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(t)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [target, duration, delay])

  return value
}
