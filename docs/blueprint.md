# **Nombre de la App**: Chispas de Historias

## Características Principales:

-   **Selección de Temas**: Permite a los usuarios seleccionar temas (por ejemplo, aventura, misterio, fantasía) para guiar la generación de historias.
-   **Selección de Personajes**: Permite a los usuarios especificar los personajes principales, incluyendo sus nombres y características. Por ejemplo, el usuario puede decidir si debe haber un zorro, y pueden especificar la personalidad del zorro.
-   **Generación de Historias**: Emplea IA generativa para crear historias únicas basadas en temas y personajes seleccionados, utilizando una herramienta que razona sobre el tema e incorpora aspectos del mismo a lo largo de la historia.
-   **Visualización de Historias**: Muestra la historia generada en un formato visualmente atractivo con secciones claras e ilustraciones. Se enfoca en capítulos cortos y escritura clara para lectores principiantes.
-   **Extensión Interactiva de Historias**: Agrega la capacidad de generar nuevos finales o continuar la historia basándose en la entrada del usuario. Al continuar la historia, utiliza una herramienta que recuerda elementos previos de la historia y asegura que el nuevo contenido no contradiga el contenido anterior.
-   **Guardado de Historias**: Da a los usuarios la opción de guardar sus historias generadas favoritas para lectura futura.
-   **Compartir Historias**: Permite compartir historias a través de varios canales de redes sociales.
-   **Sistema de Autenticación Seguro**:
    -   Registro de usuarios con verificación por email obligatoria
    -   Los usuarios deben verificar su dirección de correo electrónico antes de poder acceder completamente a la aplicación
    -   Envío automático de email de verificación durante el registro
    -   Sistema de tokens de verificación con expiración por seguridad
    -   Reenvío de email de verificación si es necesario

## Style Guidelines:

-   Background color: Soft pastel blue (#D1E0E9), creating a calm and inviting atmosphere.
-   Primary color: Gentle pastel purple (#B1AEE5), used for key interactive elements to add a touch of magic.
-   Accent color: Muted pastel yellow (#E7D8AC), applied sparingly for highlights and to draw attention to important details.
-   Font: 'Alegreya', a humanist serif with an elegant, intellectual, contemporary feel; suitable for both headlines or body text
-   Utilize whimsical and friendly icons, ensuring they align with the chosen pastel color scheme.
-   Employ a clean, user-friendly layout, focusing on ease of navigation and readability, especially for young users.
-   Incorporate subtle animations, such as page transitions or character movements, to enhance the overall interactive experience.

## Arquitectura Técnica:

### Frontend:

-   **Framework**: Next.js 15 con TypeScript
-   **Estilos**: Tailwind CSS con componentes de Radix UI
-   **Autenticación**: NextAuth.js con estrategia JWT
-   **Estado**: React Hooks y Context API
-   **Animaciones**: Framer Motion para transiciones suaves

### Backend:

-   **API Routes**: Next.js API Routes para endpoints del servidor
-   **Base de Datos**: PostgreSQL con Prisma ORM
-   **Autenticación**: Sistema personalizado con bcrypt para hash de contraseñas
-   **Rate Limiting**: Implementación nativa para prevenir abuso
-   **Emails**: Nodemailer con plantillas HTML personalizadas

### Seguridad:

-   **Verificación de Email**: Obligatoria para activar cuentas
-   **Tokens de Verificación**: SHA-256 hasheados con expiración de 24 horas
-   **Rate Limiting**: Por IP y por email para prevenir spam
-   **Validación de Datos**: Validación exhaustiva en frontend y backend
-   **Sesiones Seguras**: JWT con expiración de 24 horas

### Funcionalidades de Email:

-   **Email de Bienvenida**: Enviado automáticamente al registrarse
-   **Verificación de Cuenta**: Link único para activar la cuenta
-   **Recuperación de Contraseña**: Sistema seguro de reset de contraseña
-   **Reenvío de Verificación**: Posibilidad de solicitar nuevo email de verificación
