/**
 * @module ResetPasswordFormModule
 * @description Este módulo contiene el componente `ResetPasswordForm` y sus componentes auxiliares.
 * Proporciona la interfaz y la lógica para que los usuarios puedan restablecer su contraseña
 * utilizando un token de restablecimiento.
 */

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import logo from "../../../public/logo.png";
import {
    Eye,
    EyeOff,
    Lock,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/**
 * @interface FormFieldProps
 * @description Define las propiedades para el componente `AnimatedFormField`.
 */
interface FormFieldProps {
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: React.ReactNode;
    showToggle?: boolean;
    onToggle?: () => void;
    showPassword?: boolean;
}

/**
 * @component AnimatedFormField
 * @description Un campo de formulario interactivo con animaciones sutiles.
 */
const AnimatedFormField: React.FC<FormFieldProps> = ({
    type,
    placeholder,
    value,
    onChange,
    icon,
    showToggle,
    onToggle,
    showPassword,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div className="relative group">
            <div
                className="relative overflow-hidden rounded-lg border border-border bg-background transition-all duration-300 ease-in-out"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary">
                    {icon}
                </div>

                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full bg-transparent pl-10 pr-12 pt-6 pb-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
                    placeholder=""
                />

                <label
                    className={`absolute transition-all duration-200 ease-in-out pointer-events-none ${
                        isFocused || value
                            ? "left-3 top-1 text-xs text-primary font-medium"
                            : "left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    }`}
                >
                    {placeholder}
                </label>

                {showToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff size={18} />
                        ) : (
                            <Eye size={18} />
                        )}
                    </button>
                )}

                {isHovering && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 70%)`,
                        }}
                    />
                )}
            </div>
        </div>
    );
};

/**
 * @component ResetPasswordForm
 * @description Componente principal del formulario de restablecimiento de contraseña.
 */
export const ResetPasswordForm: React.FC = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    // Validar token al cargar el componente
    useEffect(() => {
        if (!token) {
            setIsValidToken(false);
            setIsLoading(false);
            toast({
                title: "Token inválido",
                description: "No se proporcionó un token de restablecimiento válido.",
                variant: "destructive",
            });
            return;
        }

        // Verificar si el token es válido (esto se podría hacer con una API call)
        setIsValidToken(true);
        setIsLoading(false);
    }, [token, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            toast({
                title: "Error",
                description: "Token de restablecimiento no válido.",
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Las contraseñas no coinciden.",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 8) {
            toast({
                title: "Error",
                description: "La contraseña debe tener al menos 8 caracteres.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    newPassword: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "¡Éxito!",
                    description: "Tu contraseña ha sido restablecida correctamente.",
                    variant: "default",
                });
                router.push("/?reset=success");
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Error al restablecer la contraseña.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error al restablecer contraseña:", error);
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor. Intenta de nuevo.",
                variant: "destructive",
            });
        }

        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Validando token...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isValidToken) {
        return (
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <AlertCircle className="w-16 h-16 text-destructive" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Token Inválido
                        </h1>
                        <p className="text-muted-foreground">
                            El enlace de restablecimiento es inválido o ha expirado.
                        </p>
                    </div>

                    <div className="space-y-4">
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors hover:bg-primary/90"
                    >
                        <ArrowLeft size={18} />
                        Volver al Login
                    </Link>
                    <p className="text-center text-sm text-muted-foreground">
                        ¿Necesitas un nuevo enlace?{" "}
                        <Link href="/" className="text-primary hover:underline">
                            Solicítalo aquí
                        </Link>
                    </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative z-10 w-full max-w-md">
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src={logo}
                            alt="Chispas de Historias Logo"
                            width={100}
                            height={100}
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Nueva Contraseña
                    </h1>
                    <p className="text-muted-foreground">
                        Ingresa tu nueva contraseña para completar el restablecimiento
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <AnimatedFormField
                        type={showPassword ? "text" : "password"}
                        placeholder="Nueva Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock size={18} />}
                        showToggle
                        onToggle={() => setShowPassword(!showPassword)}
                        showPassword={showPassword}
                    />

                    <AnimatedFormField
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmar Contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={<Lock size={18} />}
                        showToggle
                        onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                        showPassword={showConfirmPassword}
                    />

                    {/* Indicador de fortaleza de contraseña */}
                    {password && (
                        <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                                Fortaleza de la contraseña:
                            </div>
                            <div className="flex space-x-1">
                                <div
                                    className={`h-1 flex-1 rounded ${
                                        password.length >= 8
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                    }`}
                                />
                                <div
                                    className={`h-1 flex-1 rounded ${
                                        password.length >= 8 && /[A-Z]/.test(password)
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                    }`}
                                />
                                <div
                                    className={`h-1 flex-1 rounded ${
                                        password.length >= 8 && /[0-9]/.test(password)
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                    }`}
                                />
                                <div
                                    className={`h-1 flex-1 rounded ${
                                        password.length >= 8 && /[^A-Za-z0-9]/.test(password)
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                    }`}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className={password.length >= 8 ? "text-green-600" : "text-red-600"}>
                                    {password.length >= 8 ? "✓" : "×"} Al menos 8 caracteres
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Validación de confirmación */}
                    {confirmPassword && (
                        <div className="flex items-center gap-2 text-xs">
                            {password === confirmPassword ? (
                                <>
                                    <CheckCircle size={14} className="text-green-600" />
                                    <span className="text-green-600">Las contraseñas coinciden</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={14} className="text-red-600" />
                                    <span className="text-red-600">Las contraseñas no coinciden</span>
                                </>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || password !== confirmPassword || password.length < 8}
                        className="w-full relative group bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium transition-all duration-300 ease-in-out hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <span
                            className={`transition-opacity duration-200 ${
                                isSubmitting ? "opacity-0" : "opacity-100"
                            }`}
                        >
                            Restablecer Contraseña
                        </span>

                        {isSubmitting && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Volver al Login
                    </Link>
                </div>
            </div>
        </div>
    );
};
