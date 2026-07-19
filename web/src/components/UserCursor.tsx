import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    animate,
    type SpringOptions,
} from "framer-motion"

/**
 * UserCursor — a custom cursor follower that replaces the OS cursor inside
 * the viewport. An arrow glyph tracks the pointer with spring physics; a
 * colored label pill trails behind on a laggier spring, rocking with motion
 * and scaling while pressed.
 */
export default function UserCursor(props: Props) {
    const {
        name,
        arrow,
        label,
        color = "#a855f7",
        textColor = "#ffffff",
        size = 26,
        labelTiltStrength = 20,
        showLabel = true,
        offsetX = 0,
        offsetY = 0,
        labelOffsetX = 25,
        labelOffsetY = 12,
        labelOffsetUseDefault = true,
        pressScale = 0.85,
        classNames,
        offset: offsetOverride,
        labelOffset: labelOffsetOverride,
        style,
        fullScreen = true,
    } = props

    const hideNativeCursor = true
    const zIndex = 99999

    // --- touch detection -----------------------------------------------------
    const [isTouchActive, setIsTouchActive] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const handleTouchStart = () => setIsTouchActive(true)
        const handleMouseMove = () => setIsTouchActive(false)
        window.addEventListener("touchstart", handleTouchStart, { passive: true })
        window.addEventListener("mousemove", handleMouseMove, { passive: true })
        return () => {
            window.removeEventListener("touchstart", handleTouchStart)
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [])

    // --- container refs ------------------------------------------------------
    const containerRef = useRef<HTMLDivElement | null>(null)

    // --- visible state -------------------------------------------------------
    const [hovering, setHovering] = useState(false)
    const [pressed, setPressed] = useState(false)

    const arrowSpring = useMemo<SpringOptions>(
        () => ({ stiffness: 380, damping: 32, mass: 0.6 }),
        []
    )
    const labelSpringCfg = useMemo<SpringOptions>(
        () => ({ stiffness: 220, damping: 26, mass: 0.7 }),
        []
    )

    const resolvedOffset = useMemo(
        () => ({
            x: offsetOverride?.x ?? offsetX,
            y: offsetOverride?.y ?? offsetY,
        }),
        [offsetOverride?.x, offsetOverride?.y, offsetX, offsetY]
    )

    const resolvedLabelOffset = useMemo(() => {
        if (labelOffsetOverride) {
            return {
                x: labelOffsetOverride.x ?? size * 0.9,
                y: labelOffsetOverride.y ?? size * 0.2 + 6,
            }
        }
        if (labelOffsetUseDefault) {
            return { x: size * 0.9, y: size * 0.2 + 6 }
        }
        return { x: labelOffsetX, y: labelOffsetY }
    }, [
        labelOffsetOverride?.x,
        labelOffsetOverride?.y,
        labelOffsetUseDefault,
        labelOffsetX,
        labelOffsetY,
        size,
    ])

    // --- motion values --------------------------------------------------------
    const mouseX = useMotionValue(-9999)
    const mouseY = useMotionValue(-9999)

    const arrowX = useSpring(mouseX, arrowSpring)
    const arrowY = useSpring(mouseY, arrowSpring)
    const labelX = useSpring(mouseX, labelSpringCfg)
    const labelY = useSpring(mouseY, labelSpringCfg)

    // Press scale
    const scaleMV = useMotionValue(1)
    useEffect(() => {
        const controls = animate(scaleMV, pressed ? pressScale : 1, {
            type: "spring",
            stiffness: 500,
            damping: 28,
            mass: 0.5,
        })
        return () => controls.stop()
    }, [pressed, pressScale, scaleMV])

    // Label tilt
    const labelTiltTarget = useMotionValue(0)
    const labelRotation = useSpring(labelTiltTarget, {
        stiffness: 200,
        damping: 24,
        mass: 0.6,
    })

    // --- pointer listeners ---------------------------------------------------
    const lastSampleRef = useRef<{ x: number; y: number; t: number } | null>(
        null
    )

    useEffect(() => {
        if (isTouchActive) return
        if (typeof window === "undefined") return

        const container = containerRef.current
        if (!fullScreen && !container) return

        const getLocal = (clientX: number, clientY: number) => {
            if (fullScreen) return { x: clientX, y: clientY }
            const rect = container!.getBoundingClientRect()
            return { x: clientX - rect.left, y: clientY - rect.top }
        }

        const onMove = (e: MouseEvent) => {
            const { x, y } = getLocal(e.clientX, e.clientY)

            const now = typeof performance !== "undefined" ? performance.now() : Date.now()
            const last = lastSampleRef.current
            let vx = 0
            let vy = 0
            if (last) {
                const dt = Math.max(1, now - last.t)
                vx = ((x - last.x) / dt) * 1000
                vy = ((y - last.y) / dt) * 1000
            }
            lastSampleRef.current = { x, y, t: now }

            mouseX.set(x + resolvedOffset.x)
            mouseY.set(y + resolvedOffset.y)

            const speed = Math.hypot(vx, vy)
            const norm = Math.min(1, speed / 1500)
            const sign = vx === 0 ? 0 : vx > 0 ? 1 : -1
            labelTiltTarget.set(sign * norm * labelTiltStrength)

            if (fullScreen) setHovering(true)
        }

        const onDown = () => setPressed(true)
        const onUp = () => setPressed(false)

        const onEnter = () => setHovering(true)
        const onLeave = () => {
            setHovering(false)
            lastSampleRef.current = null
            labelTiltTarget.set(0)
        }

        if (fullScreen) {
            window.addEventListener("mousemove", onMove)
            window.addEventListener("mousedown", onDown)
            window.addEventListener("mouseup", onUp)
            // also listen to window mouseleave to hide cursor if mouse leaves window
            document.addEventListener("mouseleave", onLeave)
            document.addEventListener("mouseenter", onEnter)
        } else {
            const el = container!
            el.addEventListener("mousemove", onMove as EventListener)
            el.addEventListener("mousedown", onDown)
            el.addEventListener("mouseup", onUp)
            el.addEventListener("mouseenter", onEnter)
            el.addEventListener("mouseleave", onLeave)
        }

        return () => {
            if (fullScreen) {
                window.removeEventListener("mousemove", onMove)
                window.removeEventListener("mousedown", onDown)
                window.removeEventListener("mouseup", onUp)
                document.removeEventListener("mouseleave", onLeave)
                document.removeEventListener("mouseenter", onEnter)
            } else {
                const el = container!
                el.removeEventListener("mousemove", onMove as EventListener)
                el.removeEventListener("mousedown", onDown)
                el.removeEventListener("mouseup", onUp)
                el.removeEventListener("mouseenter", onEnter)
                el.removeEventListener("mouseleave", onLeave)
            }
            setPressed(false)
        }
    }, [
        isTouchActive,
        fullScreen,
        labelTiltStrength,
        resolvedOffset.x,
        resolvedOffset.y,
        mouseX,
        mouseY,
        labelTiltTarget,
    ])

    // Hide native cursor globally on desktop if fullScreen is active
    useEffect(() => {
        if (isTouchActive || !hideNativeCursor) return;
        if (fullScreen) {
            const styleEl = document.createElement("style")
            styleEl.innerHTML = `* { cursor: none !important; }`
            document.head.appendChild(styleEl)
            return () => {
                document.head.removeChild(styleEl)
            }
        }
    }, [isTouchActive, hideNativeCursor, fullScreen])

    const visible = useMemo(() => {
        if (isTouchActive) return false
        return hovering
    }, [isTouchActive, hovering])

    const labelTranslateX = useTransform(
        labelX,
        (v) => v + resolvedLabelOffset.x
    )
    const labelTranslateY = useTransform(
        labelY,
        (v) => v + resolvedLabelOffset.y
    )

    const arrowContent: React.ReactNode = useMemo(() => {
        if (typeof arrow === "function") {
            try {
                return (arrow as (c: string) => React.ReactNode)(color)
            } catch {
                return null
            }
        }
        if (arrow !== undefined && arrow !== null)
            return arrow as React.ReactNode
        
        // Custom neon-accented cursor path
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block", overflow: "visible", filter: "drop-shadow(0 0 4px var(--accent-glow))" }}
            >
                <path
                    d="M5 3 L23 14 L14 16 L11 24 Z"
                    fill={color}
                    stroke="var(--accent)"
                    strokeWidth={1}
                    strokeLinejoin="round"
                />
            </svg>
        )
    }, [arrow, color, size])

    const labelContent: React.ReactNode = useMemo(() => {
        if (label !== undefined && label !== null) return label
        return (
            <div
                className={classNames?.labelText}
                style={{
                    color: textColor,
                    fontSize: Math.max(8, size * 0.35),
                    lineHeight: 1.1,
                    fontWeight: 700,
                    fontFamily: 'var(--font)',
                    whiteSpace: "nowrap",
                    letterSpacing: 0.5,
                }}
            >
                {name}
            </div>
        )
    }, [label, name, textColor, size, classNames?.labelText])

    if (isTouchActive) return null

    const hostStyle: React.CSSProperties = fullScreen ? {
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex,
        ...style,
    } : {
        position: "relative",
        width: 200,
        height: 200,
        overflow: "hidden",
        cursor: hideNativeCursor ? "none" : undefined,
        ...style,
    }

    const layerStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex,
    }

    return (
        <div
            ref={containerRef}
            className={classNames?.root}
            style={hostStyle}
        >
            <div style={layerStyle}>
                {showLabel && (
                    <motion.div
                        className={classNames?.label}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            x: labelTranslateX,
                            y: labelTranslateY,
                            rotate: labelRotation,
                            scale: scaleMV,
                            background: color,
                            borderRadius: 999,
                            padding: `${size * 0.14}px ${size * 0.28}px`,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.3), 0 0 10px var(--accent-glow)",
                            opacity: visible ? 1 : 0,
                            transformOrigin: "0% 50%",
                            transition: "opacity 140ms ease",
                            willChange: "transform, opacity",
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    >
                        {labelContent}
                    </motion.div>
                )}

                <motion.div
                    className={classNames?.cursor}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        x: arrowX,
                        y: arrowY,
                        scale: scaleMV,
                        width: size,
                        height: size,
                        opacity: visible ? 1 : 0,
                        transformOrigin: "0% 0%",
                        transition: "opacity 140ms ease",
                        willChange: "transform, opacity",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        className={classNames?.arrow}
                        style={{ width: size, height: size }}
                    >
                        {arrowContent}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

type ClassNames = {
    root?: string
    cursor?: string
    arrow?: string
    label?: string
    labelText?: string
}

type Props = {
    name: string
    arrow?: React.ReactNode | ((color: string) => React.ReactNode)
    label?: React.ReactNode
    color?: string
    textColor?: string
    size?: number
    labelTiltStrength?: number
    showLabel?: boolean
    offsetX?: number
    offsetY?: number
    labelOffsetUseDefault?: boolean
    labelOffsetX?: number
    labelOffsetY?: number
    pressScale?: number
    offset?: { x?: number; y?: number }
    labelOffset?: { x?: number; y?: number }
    classNames?: ClassNames
    style?: React.CSSProperties
    fullScreen?: boolean
}

