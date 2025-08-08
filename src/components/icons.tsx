import { SVGProps } from "react";

/**
 * Objeto que contiene componentes de iconos SVG.
 * Cada propiedad es un componente de función que renderiza un icono SVG.
 */
export const Icons = {
    /**
     * Icono de spinner (cargando).
     * @param {SVGProps<SVGSVGElement>} props - Propiedades SVG para el icono.
     * @returns {JSX.Element} El componente SVG del spinner.
     */
    spinner: (props: SVGProps<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
        </svg>
    ),
    /**
     * Icono de GitHub.
     * @param {SVGProps<SVGSVGElement>} props - Propiedades SVG para el icono.
     * @returns {JSX.Element} El componente SVG de GitHub.
     */
    gitHub: (props: SVGProps<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M15 22v-4.12c0-.88-.92-1.48-1.92-1.48H12c-1.08 0-2 .6-2 1.48V22" />
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.6c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1-.07 1.53 1.03 1.53 1.03.88 1.52 2.3 1.08 2.86.82.09-.64.34-1.08.62-1.33-2.2-.25-4.5-1.1-4.5-4.9A3.77 3.77 0 0 1 7.2 7.67c.09-.64-.4-1.34-.09-1.48 0 0 .7-.22 2.3.82A8.8 8.8 0 0 1 12 6.8c.85 0 1.7.11 2.5.32 1.6-.94 2.3-.82 2.3-.82.3 0-.2 1.1-.09 1.48A3.77 3.77 0 0 1 19 12.18c0 3.8-2.3 4.65-4.5 4.9.35.3.68.9.68 1.9v2.8c0 .26.18.57.68.48C20.13 20.17 23 16.42 23 12 23 6.48 18.52 2 12 2z" />
        </svg>
    ),
};
