"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TagProps {
    text: string;
    onRemove: () => void;
    tagThemeClass?: string;
}

const Tag = ({ text, onRemove, tagThemeClass }: TagProps) => {
    // Siempre usa el tagThemeClass actualizado
    const bgColor = tagThemeClass === "pink" ? "bg-secondary" : "bg-primary";
    return (
        <motion.span
            className={cn(
                "px-2 py-1 rounded-xl text-sm flex items-center gap-1 shadow-[0_0_10px_rgba(0,0,0,0.2)] backdrop-blur-sm text-white",
                bgColor
            )}
        >
            {text}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                    onClick={onRemove}
                    className={cn(
                        "bg-transparent text-xs h-fit flex items-center rounded-full justify-center p-1 text-white"
                    )}
                >
                    <X className="w-4 h-4" />
                </Button>
            </motion.div>
        </motion.span>
    );
};

interface InputWithTagsProps {
    placeholder?: string;
    className?: string;
    value?: string[];
    onChange?: (tags: string[]) => void;
    tagThemeClass?: string;
}

const InputWithTags = ({
    placeholder,
    className,
    value,
    onChange,
    tagThemeClass,
}: InputWithTagsProps) => {
    const isControlled = value !== undefined && onChange !== undefined;
    const [internalTags, setInternalTags] = useState<string[]>([]);
    const tags = isControlled ? value! : internalTags;
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState<string>("");

    const MAX_TAGS = 5;
    const MAX_TAG_LENGTH = 20;
    const ALLOWED_CHARS_REGEX = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]*$/;

    const validateInput = (value: string): boolean => {
        if (!ALLOWED_CHARS_REGEX.test(value)) {
            setError("Solo se permiten letras y espacios");
            return false;
        }
        if (value.length > MAX_TAG_LENGTH) {
            setError(`Máximo ${MAX_TAG_LENGTH} caracteres por rasgo`);
            return false;
        }
        setError("");
        return true;
    };

    const addTag = () => {
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) return;
        if (!validateInput(trimmedValue)) return;
        if (tags.length >= MAX_TAGS) {
            setError(`Máximo ${MAX_TAGS} rasgos permitidos`);
            return;
        }
        if (tags.includes(trimmedValue)) {
            setError("Este rasgo ya existe");
            return;
        }
        const newTags = [...tags, trimmedValue];
        if (isControlled) {
            onChange?.(newTags);
        } else {
            setInternalTags(newTags);
        }
        setInputValue("");
        setError("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (value.length > MAX_TAG_LENGTH) {
            value = value.slice(0, MAX_TAG_LENGTH);
        }
        if (value && !ALLOWED_CHARS_REGEX.test(value)) {
            setError("Solo se permiten letras y espacios");
        } else if (value.length > MAX_TAG_LENGTH) {
            setError(`Máximo ${MAX_TAG_LENGTH} caracteres por rasgo`);
        } else {
            setError("");
        }
        setInputValue(value);
    };

    const handleInputBlur = () => {
        if (inputValue.trim()) {
            addTag();
        }
    };

    const handleSpaceDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === " " && inputValue.trim()) {
            e.preventDefault();
            addTag();
        }
    };

    const removeTag = (indexToRemove: number) => {
        const newTags = tags.filter((_, index) => index !== indexToRemove);
        if (isControlled) {
            onChange?.(newTags);
        } else {
            setInternalTags(newTags);
        }
        setError("");
    };

    const isMaxTags = tags.length >= MAX_TAGS;

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            >
                <motion.input
                    type="text"
                    value={inputValue}
                    maxLength={MAX_TAG_LENGTH}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        handleKeyDown(e);
                        handleSpaceDown(e);
                    }}
                    onBlur={handleInputBlur}
                    placeholder={
                        isMaxTags
                            ? "Límite de rasgos alcanzado"
                            : placeholder ||
                              `Máx. ${MAX_TAG_LENGTH} caracteres por rasgo`
                    }
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                        // Match Input component styles for visual coherence
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        error && "ring-2 ring-red-500/50"
                    )}
                    disabled={isMaxTags}
                />
            </motion.div>
            <div className="flex flex-col gap-1">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-sm flex items-center gap-1"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}
                {tags.length === 0 && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-gray-400 text-sm"
                    >
                        No hay rasgos aún
                    </motion.div>
                )}
                {tags.length > 0 && (
                    <div className="text-gray-400 text-sm">
                        {tags.length} de {MAX_TAGS} rasgos
                    </div>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                    {tags.map((tag, index) => (
                        <Tag
                            key={`${tag}-${index}-${tagThemeClass}`}
                            text={tag}
                            onRemove={() => removeTag(index)}
                            tagThemeClass={tagThemeClass}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export { InputWithTags };
