import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [visible, setVisible] = useState(true)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    // When route changes, fade out then swap content
    setVisible(false)
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setVisible(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {displayChildren}
    </div>
  )
}
