/**
 * @module UseMobileModule
 * @description Este módulo contiene el hook `useIsMobile`,
 * que detecta si el dispositivo actual es móvil basándose en el ancho de la ventana del navegador.
 * Es útil para adaptar la interfaz de usuario a diferentes tamaños de pantalla.
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
