"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";

/**
 * Componente `ThemeToggle`.
 * Permite al usuario alternar entre los temas "Princesa" y "Príncipe".
 * Utiliza el hook `useTheme` para interactuar con el tema global.
 *
 * @returns {JSX.Element} Un componente de alternancia de tema con un switch y etiquetas.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  /**
   * Maneja el cambio del switch.
   * Alterna entre los temas 'princesa' y 'principe'.
   */
  const handleToggle = () => {
    setTheme(theme === 'princesa' ? 'principe' : 'princesa');
  };

  return (
    <div className="flex items-center space-x-2 mt-4">
      <Label htmlFor="theme-toggle" className="text-lg font-semibold">
        Princesa
      </Label>
      <Switch
        id="theme-toggle"
        checked={theme === 'principe'}
        onCheckedChange={handleToggle}
        aria-label="Alternar tema entre princesa y príncipe"
        theme={theme}
      />
      <Label htmlFor="theme-toggle" className="text-lg font-semibold">
        Príncipe
      </Label>
    </div>
  );
}