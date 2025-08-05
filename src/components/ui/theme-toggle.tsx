"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";

/**
 * Componente `ThemeToggle`.
 * Permite al usuario alternar entre los temas "Princesa" y "Príncipe".
 * Utiliza el hook `useTheme` para interactuar con el tema global.
 * @returns {JSX.Element} Un componente de alternancia de tema con un switch y etiquetas.
 */
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [animatePrincess, setAnimatePrincess] = React.useState(false);
    const [animatePrince, setAnimatePrince] = React.useState(false);

    React.useEffect(() => {
        if (theme === "princesa") {
            setAnimatePrincess(true);
            const timer = setTimeout(() => setAnimatePrincess(false), 500); // Duración de la animación
            return () => clearTimeout(timer);
        } else if (theme === "principe") {
            setAnimatePrince(true);
            const timer = setTimeout(() => setAnimatePrince(false), 500); // Duración de la animación
            return () => clearTimeout(timer);
        }
    }, [theme]);

    /**
     * Maneja el cambio del switch.
     * Alterna entre los temas 'princesa' y 'principe'.
     */
    const handleToggle = () => {
        setTheme(theme === "princesa" ? "principe" : "princesa");
    };

    return (
        <div className="flex items-center space-x-2 mt-4">
            <Label
                htmlFor="theme-toggle"
                className={`text-lg font-semibold ${
                    theme === "princesa" ? "text-pink-500" : "text-gray-500"
                } ${animatePrincess ? "animate-jump" : ""}`}
            >
                👸🏻 Princesa
            </Label>
            <Switch
                id="theme-toggle"
                checked={theme === "principe"}
                onCheckedChange={handleToggle}
                aria-label="Alternar tema entre princesa y príncipe"
                theme={theme}
            />
            <Label
                htmlFor="theme-toggle"
                className={`text-lg font-semibold ${
                    theme === "principe" ? "text-blue-500" : "text-gray-500"
                } ${animatePrince ? "animate-jump" : ""}`}
            >
                Príncipe 🤴🏻
            </Label>
        </div>
    );
}
