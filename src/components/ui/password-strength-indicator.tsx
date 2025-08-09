import React from "react";

interface PasswordStrengthIndicatorProps {
    password: string;
}

const PASSWORD_REQUIREMENTS = [
    {
        name: "length",
        label: "Al menos 8 caracteres",
        check: (p: string) => p.length >= 8,
    },
    {
        name: "uppercase",
        label: "Una mayúscula",
        check: (p: string) => /[A-Z]/.test(p),
    },
    {
        name: "number",
        label: "Un número",
        check: (p: string) => /[0-9]/.test(p),
    },
    {
        name: "symbol",
        label: "Un símbolo",
        check: (p: string) => /[^A-Za-z0-9]/.test(p),
    },
];

const getStrengthPercentage = (validCount: number) => {
    return (validCount / PASSWORD_REQUIREMENTS.length) * 100;
};

const getProgressColor = (validCount: number) => {
    switch (validCount) {
        case 0:
            return "bg-red-500";
        case 1:
            return "bg-orange-500";
        case 2:
            return "bg-yellow-500";
        case 3:
            return "bg-blue-500";
        case 4:
            return "bg-green-500";
        default:
            return "bg-gray-500";
    }
};

const getSecurityMessage = (validCount: number) => {
    switch (validCount) {
        case 0:
            return "Muy débil";
        case 1:
            return "Débil";
        case 2:
            return "Regular";
        case 3:
            return "Fuerte";
        case 4:
            return "Muy fuerte";
        default:
            return "";
    }
};

export const PasswordStrengthIndicator: React.FC<
    PasswordStrengthIndicatorProps
> = ({ password }) => {
    if (!password) return null;

    const validRequirements = PASSWORD_REQUIREMENTS.filter((req) =>
        req.check(password)
    );
    const validCount = validRequirements.length;
    const allValid = validCount === PASSWORD_REQUIREMENTS.length;

    const progressBarWidth = `${getStrengthPercentage(validCount)}%`;

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium">Fortaleza de contraseña:</div>

            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                        validCount
                    )}`}
                    style={{
                        width: progressBarWidth,
                        minWidth: validCount > 0 ? "0.5rem" : 0,
                    }}
                />
            </div>

            <div className="mt-2 text-xs space-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => (
                    <div
                        key={req.name}
                        className="flex items-center justify-between space-x-2 mt-2"
                    >
                        <span
                            className={
                                req.check(password)
                                    ? "text-green-600"
                                    : "text-red-600"
                            }
                        >
                            {req.check(password) ? "✓" : "✗"} {req.label}
                        </span>
                        <span
                            className={`h-2 rounded-full ${
                                req.check(password)
                                    ? "w-4 bg-green-500"
                                    : "w-2 bg-gray-300"
                            }`}
                        />
                    </div>
                ))}
            </div>

            <div
                className={`mt-2 font-bold text-center text-white ${getProgressColor(
                    validCount
                )}`}
            >
                {allValid
                    ? "Contraseña segura"
                    : getSecurityMessage(validCount)}
            </div>
        </div>
    );
};
