import GradientButton from "./gradient-button";
import {
    IoHomeOutline,
    IoVideocamOutline,
    IoCameraOutline,
    IoShareSocialOutline,
    IoHeartOutline,
} from "react-icons/io5";
const menuItems = [
    {
        title: "Home",
        icon: <IoHomeOutline />,
        gradientFrom: "#a955ff",
        gradientTo: "#ea51ff",
    },
    {
        title: "Video",
        icon: <IoVideocamOutline />,
        gradientFrom: "#56CCF2",
        gradientTo: "#2F80ED",
    },
    {
        title: "Photo",
        icon: <IoCameraOutline />,
        gradientFrom: "#FF9966",
        gradientTo: "#FF5E62",
    },
    {
        title: "Share",
        icon: <IoShareSocialOutline />,
        gradientFrom: "#80FF72",
        gradientTo: "#7EE8FA",
    },
    {
        title: "Tym",
        icon: <IoHeartOutline />,
        gradientFrom: "#ffa9c6",
        gradientTo: "#f434e2",
    },
];

/**
 * @brief Componente de menú con elementos de gradiente.
 *
 * Este componente renderiza una lista de elementos de menú, cada uno de los cuales es un `GradientButton`.
 * Los datos de los elementos del menú se definen en el array `menuItems`.
 *
 * @returns {JSX.Element} Un elemento `<div>` que contiene el menú de gradiente.
 */
export default function GradientMenu() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-dark">
            <ul className="flex gap-6">
                {menuItems.map(
                    ({ title, icon, gradientFrom, gradientTo }, idx) => (
                        <GradientButton
                            key={idx}
                            title={title}
                            icon={icon}
                            gradientFrom={gradientFrom}
                            gradientTo={gradientTo}
                        />
                    )
                )}
            </ul>
        </div>
    );
}
