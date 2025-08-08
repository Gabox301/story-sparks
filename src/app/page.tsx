/**
 * @module AuthenticationPage
 * @description Este módulo define el componente de la página de autenticación de la aplicación.
 * Incluye la lógica para el formulario de inicio de sesión/registro y la visualización de los modales
 * de Términos de Servicio y Política de Privacidad.
 */

"use client";

import Link from "next/link";
import { LoginForm } from "@/app/login/form";
import { Compare } from "@/components/ui/compare";
import { RouteGuard } from "@/components/route-guard";
import { useState } from "react";

/**
 * Componente de la página de autenticación.
 * Renderiza la interfaz de usuario para el inicio de sesión o la creación de cuentas.
 * Incluye un formulario de autenticación y enlaces a términos de servicio y política de privacidad.
 */
export default function AuthenticationPage() {
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const handleTermsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowTermsModal(true);
    };

    const handlePrivacyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowPrivacyModal(true);
    };

    return (
        <RouteGuard requireAuth={false}>
        <div className="relative min-h-screen flex-col items-center justify-center flex lg:px-0 overflow-hidden w-full">
            <Compare
                firstImage="/princess.png"
                secondImage="/prince.png"
                autoplay={true}
            />
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                <div className="lg:p-8 w-full flex justify-center">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                        <LoginForm />
                        <p className="px-8 text-center text-sm text-muted-foreground">
                            Al crear tu cuenta, aceptas nuestros{" "}
                            <button
                                onClick={handleTermsClick}
                                className="underline underline-offset-4 hover:text-primary text-primary cursor-pointer"
                            >
                                Términos de Servicio
                            </button>{" "}
                            y{" "}
                            <button
                                onClick={handlePrivacyClick}
                                className="underline underline-offset-4 hover:text-primary text-primary cursor-pointer"
                            >
                                Política de Privacidad
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de Términos de Servicio */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowTermsModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl font-bold"
                        >
                            ×
                        </button>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-6 text-center">
                                Términos de Servicio
                            </h2>
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <h3 className="text-lg font-semibold text-foreground">
                                    1. Aceptación de los Términos
                                </h3>
                                <p>
                                    Al utilizar Chispas de Historias, usted
                                    acepta estar sujeto a estos Términos de
                                    Servicio. Si no está de acuerdo con estos
                                    términos, no utilice nuestros servicios.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    2. Descripción del Servicio
                                </h3>
                                <p>
                                    Chispas de Historias es una plataforma de
                                    generación de historias interactivas powered
                                    by AI que permite a los usuarios crear y
                                    experimentar narrativas personalizadas.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    3. Cuentas de Usuario
                                </h3>
                                <p>
                                    Usted es responsable de mantener la
                                    confidencialidad de su cuenta y contraseña.
                                    Acepta notificarnos inmediatamente sobre
                                    cualquier uso no autorizado de su cuenta.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    4. Uso Aceptable
                                </h3>
                                <p>
                                    Usted se compromete a utilizar nuestro
                                    servicio de manera responsable y no para
                                    crear contenido ofensivo, ilegal o que viole
                                    los derechos de terceros.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    5. Propiedad Intelectual
                                </h3>
                                <p>
                                    Las historias que usted crea usando nuestra
                                    plataforma le pertenecen. Sin embargo, nos
                                    otorga una licencia para almacenar y
                                    procesar su contenido para proporcionarle el
                                    servicio.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    6. Limitación de Responsabilidad
                                </h3>
                                <p>
                                    Chispas de Historias se proporciona "tal
                                    como es" sin garantías de ningún tipo. No
                                    seremos responsables de daños directos,
                                    indirectos o consecuentes.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    7. Modificaciones
                                </h3>
                                <p>
                                    Nos reservamos el derecho de modificar estos
                                    términos en cualquier momento. Los cambios
                                    entrarán en vigor inmediatamente después de
                                    su publicación.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Política de Privacidad */}
            {showPrivacyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowPrivacyModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl font-bold"
                        >
                            ×
                        </button>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-6 text-center">
                                Política de Privacidad
                            </h2>
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <h3 className="text-lg font-semibold text-foreground">
                                    1. Información que Recopilamos
                                </h3>
                                <p>
                                    Recopilamos información que usted nos
                                    proporciona directamente, como su nombre,
                                    dirección de correo electrónico y las
                                    historias que crea en nuestra plataforma.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    2. Cómo Utilizamos su Información
                                </h3>
                                <p>Utilizamos su información para:</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>
                                        Proporcionar y mejorar nuestros
                                        servicios
                                    </li>
                                    <li>Personalizar su experiencia</li>
                                    <li>
                                        Comunicarnos con usted sobre su cuenta
                                    </li>
                                    <li>
                                        Generar historias basadas en sus
                                        preferencias
                                    </li>
                                </ul>

                                <h3 className="text-lg font-semibold text-foreground">
                                    3. Compartir Información
                                </h3>
                                <p>
                                    No vendemos, alquilamos o compartimos su
                                    información personal con terceros, excepto
                                    en las siguientes circunstancias:
                                </p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Con su consentimiento explícito</li>
                                    <li>
                                        Para cumplir con obligaciones legales
                                    </li>
                                    <li>
                                        Para proteger nuestros derechos y
                                        propiedad
                                    </li>
                                </ul>

                                <h3 className="text-lg font-semibold text-foreground">
                                    4. Seguridad de Datos
                                </h3>
                                <p>
                                    Implementamos medidas de seguridad técnicas
                                    y organizativas apropiadas para proteger su
                                    información personal contra acceso no
                                    autorizado, alteración, divulgación o
                                    destrucción.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    5. Retención de Datos
                                </h3>
                                <p>
                                    Conservamos su información personal mientras
                                    sea necesario para proporcionar nuestros
                                    servicios y cumplir con nuestras
                                    obligaciones legales.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    6. Sus Derechos
                                </h3>
                                <p>
                                    Usted tiene derecho a acceder, actualizar,
                                    corregir o eliminar su información personal.
                                    Puede contactarnos para ejercer estos
                                    derechos.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    7. Cookies
                                </h3>
                                <p>
                                    Utilizamos cookies y tecnologías similares
                                    para mejorar su experiencia en nuestro sitio
                                    web y analizar el uso del servicio.
                                </p>

                                <h3 className="text-lg font-semibold text-foreground">
                                    8. Contacto
                                </h3>
                                <p>
                                    Si tiene preguntas sobre esta Política de
                                    Privacidad, puede contactarnos en
                                    chispasdehistorias@gmail.com
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </RouteGuard>
    );
}
