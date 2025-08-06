import React from "react";

interface GradientButtonProps {
    title: string;
    icon: React.ReactNode;
    gradientFrom: string;
    gradientTo: string;
    onClick?: () => void;
}

/**
 * @brief Componente de botón con efecto de gradiente y hover.
 *
 * Este componente renderiza un botón con un fondo de gradiente que aparece al pasar el ratón por encima,
 * junto con un efecto de brillo y la transición de un icono a un título.
 *
 * @param {GradientButtonProps} props Las propiedades del componente.
 * @param {string} props.title El texto que se mostrará como título del botón al pasar el ratón.
 * @param {React.ReactNode} props.icon El icono que se mostrará cuando el botón no esté en estado hover.
 * @param {string} props.gradientFrom El color inicial del gradiente CSS (por ejemplo, "#a955ff").
 * @param {string} props.gradientTo El color final del gradiente CSS (por ejemplo, "#ea51ff").
 * @param {() => void} [props.onClick] Función opcional a ejecutar cuando se hace clic en el botón.
 *
 * @returns {JSX.Element} Un elemento `<li>` que representa el botón con gradiente.
 */
export default function GradientButton({
    title,
    icon,
    gradientFrom,
    gradientTo,
    onClick,
}: GradientButtonProps) {
    return (
        <li
            style={
                {
                    "--gradient-from": gradientFrom,
                    "--gradient-to": gradientTo,
                } as React.CSSProperties
            }
            className="relative w-[60px] h-[60px] bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-500 hover:w-[120px] hover:shadow-none group cursor-pointer"
            onClick={onClick}
        >
            {/* Fondo de gradiente al pasar el ratón */}
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100"></span>
            {/* Brillo difuminado */}
            <span className="absolute top-[10px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] opacity-0 -z-10 transition-all duration-500 group-hover:opacity-50"></span>

            {/* Icono */}
            <span className="relative z-10 transition-all duration-500 group-hover:scale-0 delay-0">
                <span className="text-2xl text-gray-500">{icon}</span>
            </span>

            {/* Título */}
            <span className="absolute text-black uppercase tracking-wide text-sm transition-all duration-500 scale-0 group-hover:scale-100 delay-150">
                {title}
            </span>
        </li>
    );
}
