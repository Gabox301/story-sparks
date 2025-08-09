/**
 * @module LoginFormModule
 * @description Este módulo contiene el componente `LoginForm` y sus componentes auxiliares.
 * Proporciona la interfaz y la lógica para el inicio de sesión, registro, restablecimiento de contraseña
 * y verificación de email de los usuarios.
 */

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import logo from "../../../public/logo.png";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

/**
 * @interface FormFieldProps
 * @description Define las propiedades para el componente `AnimatedFormField`.
 * @property {string} type - El tipo de entrada del campo (por ejemplo, 'text', 'password', 'email').
 * @property {string} placeholder - El texto que se muestra como marcador de posición en el campo de entrada.
 * @property {string} value - El valor actual del campo de entrada.
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange - Función de devolución de llamada que se activa cuando el valor del campo de entrada cambia.
 * @property {React.ReactNode} icon - El icono que se muestra dentro del campo de entrada.
 * @property {boolean} [showToggle] - Opcional. Si es `true`, muestra un botón para alternar la visibilidad (útil para contraseñas).
 * @property {() => void} [onToggle] - Opcional. Función de devolución de llamada que se activa al hacer clic en el botón de alternar.
 * @property {boolean} [showPassword] - Opcional. Indica si la contraseña es visible cuando `showToggle` es `true`.
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
 * @description Un campo de formulario interactivo con animaciones sutiles. Incluye un efecto de brillo al pasar el ratón,
 * un marcador de posición flotante y un icono. Opcionalmente, puede mostrar un botón para alternar la visibilidad del texto (por ejemplo, para contraseñas).
 * @param {FormFieldProps} props - Las propiedades para configurar el campo de formulario.
 * @returns {React.FC<FormFieldProps>} El componente `AnimatedFormField`.
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
 * @component LoginForm
 * @description Componente principal del formulario de autenticación. Permite a los usuarios iniciar sesión o crear una cuenta.
 * Incluye campos de formulario animados, un logo, y un fondo dinámico de partículas flotantes.
 * Gestiona el estado del formulario, la simulación de envío y la alternancia entre los modos de inicio de sesión y registro.
 * @returns {React.FC} El componente `LoginForm`.
 */
export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] =
        useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState("");

    // Manejar mensajes de URL parameters al cargar la página
    useEffect(() => {
        const verified = searchParams.get("verified");
        const error = searchParams.get("error");
        const message = searchParams.get("message");
        const reset = searchParams.get("reset");

        if (verified === "true" && message) {
            toast({
                title: "¡Email verificado!",
                description: message,
                variant: "default",
            });
        } else if (error && message) {
            toast({
                title: "Error de verificación",
                description: message,
                variant: "destructive",
            });
        } else if (reset === "success") {
            toast({
                title: "¡Contraseña restablecida!",
                description:
                    "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.",
                variant: "default",
            });
        }
    }, [searchParams, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (isSignUp) {
            try {
                const response = await api.post("/api/register", {
                    email,
                    password,
                    name,
                });

                if (response.ok) {
                    const responseData = await response.json();
                    console.log("Registro exitoso!");

                    toast({
                        title: "¡Cuenta creada exitosamente!",
                        description: responseData.message,
                        variant: "default",
                    });

                    // Cambiar a modo de login y limpiar formulario
                    setIsSignUp(false);
                    setName("");
                    setPassword("");
                    // Mantener el email para facilitar el login

                    // Mostrar información adicional sobre verificación
                    if (responseData.requiresVerification) {
                        setUnverifiedEmail(email);
                        setShowResendVerification(true);
                    }
                } else {
                    try {
                        const errorData = await response.json();
                        console.error(
                            "Error en el registro:",
                            errorData.message
                        );
                        toast({
                            title: "Error en el registro",
                            description:
                                errorData.message ||
                                "No se pudo crear la cuenta. Por favor, intenta de nuevo.",
                            variant: "destructive",
                        });
                    } catch (jsonError) {
                        const errorText = await response.text();
                        console.error(
                            "Error en el registro (respuesta no JSON):",
                            errorText
                        );
                        toast({
                            title: "Error en el registro",
                            description:
                                "No se pudo crear la cuenta. Por favor, intenta de nuevo.",
                            variant: "destructive",
                        });
                    }
                }
            } catch (error) {
                console.error("Error de red durante el registro:", error);
                toast({
                    title: "Error de conexión",
                    description:
                        "No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.",
                    variant: "destructive",
                });
            }
        } else {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                console.error("Error de inicio de sesión:", result.error);

                // Verificar si el error contiene el mensaje de email no verificado
                if (result.error.includes("verificar tu email")) {
                    setUnverifiedEmail(email);
                    setShowResendVerification(true);
                }

                toast({
                    title: "Error de inicio de sesión",
                    description:
                        result.error === "CredentialsSignin"
                            ? "Credenciales incorrectas. Verifica tu email y contraseña."
                            : result.error.includes("verificar tu email")
                            ? result.error
                            : "Error al iniciar sesión. Por favor, intenta de nuevo.",
                    variant: "destructive",
                });
            } else if (result?.ok) {
                console.log("Inicio de sesión exitoso!");
                toast({
                    title: "¡Bienvenido!",
                    description: "Has iniciado sesión correctamente.",
                    variant: "default",
                });
                // Redirigir manualmente tras mostrar el toast
                setTimeout(() => {
                    router.push("/home");
                }, 500); // Da tiempo a que el toast se muestre
            }
        }

        setIsSubmitting(false);
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setEmail("");
        setPassword("");
        setName("");
        setShowPassword(false);
    };

    /**
     * @function handleForgotPasswordSubmit
     * @description Maneja el envío del formulario de "Olvidé mi contraseña".
     * Envía una solicitud al endpoint de la API para iniciar el proceso de restablecimiento de contraseña.
     * @param {React.FormEvent} e - El evento del formulario.
     */
    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await api.post("/api/forgot-password", {
                email: forgotPasswordEmail,
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Éxito",
                    description:
                        data.message ||
                        "Se ha enviado un enlace de restablecimiento de contraseña a su correo electrónico.",
                    variant: "default",
                });
                setShowForgotPasswordModal(false);
                setForgotPasswordEmail("");
            } else {
                toast({
                    title: "Error",
                    description:
                        data.error ||
                        "Error al solicitar el restablecimiento de contraseña. Por favor, intente de nuevo.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(
                "Error de red al solicitar restablecimiento de contraseña:",
                error
            );
            toast({
                title: "Error de red",
                description:
                    "Error de red. Por favor, intente de nuevo más tarde.",
                variant: "destructive",
            });
        }
    };

    /**
     * @function handleResendVerification
     * @description Maneja el reenvío del email de verificación.
     */
    const handleResendVerification = async () => {
        try {
            const response = await api.post("/api/verify-email", {
                email: unverifiedEmail,
            });

            const data = await response.json();

            toast({
                title: response.ok ? "Éxito" : "Error",
                description: data.message,
                variant: response.ok ? "default" : "destructive",
            });
        } catch (error) {
            console.error("Error reenviando email de verificación:", error);
            toast({
                title: "Error de red",
                description: "Error al reenviar el email de verificación.",
                variant: "destructive",
            });
        }
    };

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
                        {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isSignUp
                            ? "Crea tu cuenta para comenzar la aventura"
                            : "Inicia sesión para continuar tu aventura"}
                    </p>
                </div>

                {showForgotPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full relative">
                            <button
                                onClick={() =>
                                    setShowForgotPasswordModal(false)
                                }
                                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                            >
                                &times;
                            </button>
                            <h2 className="text-2xl font-bold mb-6 text-center">
                                Restablecer Contraseña
                            </h2>
                            <form
                                onSubmit={handleForgotPasswordSubmit}
                                className="space-y-4"
                            >
                                <AnimatedFormField
                                    type="email"
                                    placeholder="Correo Electrónico"
                                    value={forgotPasswordEmail}
                                    onChange={(e) =>
                                        setForgotPasswordEmail(e.target.value)
                                    }
                                    icon={<Mail size={18} />}
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    Enviar Restablecimiento
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Mensaje de verificación de email */}
                {showResendVerification && !isSignUp && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                    Verifica tu email
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                    Te hemos enviado un email de verificación a{" "}
                                    <strong>{unverifiedEmail}</strong>. Revisa
                                    tu bandeja de entrada y haz clic en el
                                    enlace para activar tu cuenta.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
                                >
                                    Reenviar email de verificación
                                </button>
                                &nbsp;&middot;&nbsp;
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowResendVerification(false)
                                    }
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {isSignUp && (
                        <AnimatedFormField
                            type="text"
                            placeholder="Nombre Completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            icon={<User size={18} />}
                        />
                    )}

                    <AnimatedFormField
                        type="email"
                        placeholder="Correo Electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={18} />}
                    />

                    <AnimatedFormField
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock size={18} />}
                        showToggle
                        onToggle={() => setShowPassword(!showPassword)}
                        showPassword={showPassword}
                    />
                    {isSignUp && (
                        <PasswordStrengthIndicator password={password} />
                    )}

                    <div className="flex items-center justify-center">
                        {!isSignUp && (
                            <button
                                type="button"
                                onClick={() => setShowForgotPasswordModal(true)}
                                className="text-sm text-muted-foreground hover:underline mt-2 block text-center"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={
                            isSubmitting ||
                            (isSignUp
                                ? !email.trim() &&
                                  !password.trim() &&
                                  !name.trim()
                                : !email.trim() && !password.trim())
                        }
                        className="w-full relative group bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium transition-all duration-300 ease-in-out hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <span
                            className={`transition-opacity duration-200 ${
                                isSubmitting ? "opacity-0" : "opacity-100"
                            }`}
                        >
                            {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
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
                    <p className="text-sm text-muted-foreground">
                        {isSignUp
                            ? "¿Ya tienes una cuenta?"
                            : "¿No tienes una cuenta?"}{" "}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-primary hover:underline font-medium"
                        >
                            {isSignUp ? "Iniciar Sesión" : "Crear Cuenta"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
