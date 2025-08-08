"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { SparklesCore } from "@/components/ui/sparkles-compare";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IconDotsVertical } from "@tabler/icons-react";

interface CompareProps {
    firstImage?: string;
    secondImage?: string;
    className?: string;
    firstImageClassName?: string;
    secondImageClassname?: string;
    initialSliderPercentage?: number;

    autoplay?: boolean;
    autoplayDuration?: number;
}
export const Compare = ({
    firstImage = "",
    secondImage = "",
    className,
    firstImageClassName,
    secondImageClassname,
    initialSliderPercentage = 50,

    autoplay = false,
    autoplayDuration = 5000,
}: CompareProps) => {
    const [sliderXPercent, setSliderXPercent] = useState(
        initialSliderPercentage
    );
    const sliderRef = useRef<HTMLDivElement>(null);

    const autoplayRef = useRef<NodeJS.Timeout | null>(null);

    const startAutoplay = useCallback(() => {
        if (!autoplay) return;

        const startTime = Date.now();
        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress =
                (elapsedTime % (autoplayDuration * 2)) / autoplayDuration;
            const percentage =
                progress <= 1 ? progress * 100 : (2 - progress) * 100;

            setSliderXPercent(percentage);
            autoplayRef.current = setTimeout(animate, 16); // ~60fps
        };

        animate();
    }, [autoplay, autoplayDuration]);

    const stopAutoplay = useCallback(() => {
        if (autoplayRef.current) {
            clearTimeout(autoplayRef.current);
            autoplayRef.current = null;
        }
    }, []);

    useEffect(() => {
        startAutoplay();
        return () => stopAutoplay();
    }, [startAutoplay, stopAutoplay]);

    return (
        <div
            ref={sliderRef}
            className={cn("w-full h-full overflow-hidden", className)}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 0,
            }}
        >
            <AnimatePresence initial={false}>
                <motion.div
                    className="h-full w-px absolute top-0 m-auto z-30 bg-gradient-to-b from-transparent from-[5%] to-[95%] via-indigo-500 to-transparent"
                    style={{
                        left: `${sliderXPercent}%`,
                        top: "0",
                        zIndex: 40,
                    }}
                    transition={{ duration: 0 }}
                >
                    <div className="w-36 h-full [mask-image:radial-gradient(100px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-indigo-400 via-transparent to-transparent z-20 opacity-50" />
                    <div className="w-10 h-1/2 [mask-image:radial-gradient(50px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-cyan-400 via-transparent to-transparent z-10 opacity-100" />
                    <div className="w-10 h-3/4 top-1/2 -translate-y-1/2 absolute -right-10 [mask-image:radial-gradient(100px_at_left,white,transparent)]">
                        <MemoizedSparklesCore
                            background="transparent"
                            minSize={0.4}
                            maxSize={1}
                            particleDensity={1200}
                            className="w-full h-full"
                            particleColor="#FFFFFF"
                        />
                    </div>
                </motion.div>
            </AnimatePresence>
            <div className="overflow-hidden w-full h-full relative z-20 pointer-events-none">
                <AnimatePresence initial={false}>
                    {firstImage ? (
                        <motion.div
                            className={cn(
                                "absolute inset-0 z-20 rounded-2xl flex-shrink-0 w-full h-full select-none overflow-hidden",
                                firstImageClassName
                            )}
                            style={{
                                clipPath: `inset(0 ${
                                    100 - sliderXPercent
                                }% 0 0)`,
                            }}
                            transition={{ duration: 0 }}
                        >
                            <img
                                alt="first image"
                                src={firstImage}
                                className={cn(
                                    "absolute inset-0  z-20 rounded-2xl flex-shrink-0 w-full h-full select-none object-cover",
                                    firstImageClassName
                                )}
                                draggable={false}
                            />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
                {secondImage ? (
                    <motion.img
                        className={cn(
                            "absolute top-0 left-0 z-[19]  rounded-2xl w-full h-full select-none object-cover",
                            secondImageClassname
                        )}
                        alt="second image"
                        src={secondImage}
                        draggable={false}
                    />
                ) : null}
            </AnimatePresence>
        </div>
    );
};

const MemoizedSparklesCore = React.memo(SparklesCore);
