/**
 * VibeUp — Framer Motion Utilities
 * Reusable animated wrappers for scroll-triggered fades,
 * staggered reveals, hover transitions, and 3D card effects.
 */
import React, { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  type Variants,
  type Transition,
} from 'framer-motion';

/* ──────────────────────────────────────────
   Re-exports
────────────────────────────────────────── */
export { motion, AnimatePresence, useMotionValue, useTransform, useSpring };

/* ──────────────────────────────────────────
   Transition Presets
────────────────────────────────────────── */
export const springBounce: Transition = { type: 'spring', stiffness: 300, damping: 20 };
export const springSmooth: Transition = { type: 'spring', stiffness: 200, damping: 24 };
export const springSnappy: Transition = { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 };
export const easeSlow: Transition = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] };
export const easeFast: Transition = { duration: 0.25, ease: 'easeOut' };

/* ──────────────────────────────────────────
   FadeInView — scroll-triggered fade-up
────────────────────────────────────────── */
interface FadeInViewProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  style?: React.CSSProperties;
  className?: string;
  once?: boolean;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 24,
  style,
  className,
  once = true,
}) => {
  const offset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  }[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ──────────────────────────────────────────
   StaggerContainer + StaggerItem
────────────────────────────────────────── */
const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

interface StaggerContainerProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  style,
  className,
  staggerDelay,
  once = true,
}) => (
  <motion.div
    variants={{
      ...staggerContainerVariants,
      visible: {
        transition: {
          staggerChildren: staggerDelay ?? 0.06,
          delayChildren: 0.05,
        },
      },
    }}
    initial="hidden"
    whileInView="visible"
    viewport={{ once, margin: '-30px' }}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

interface StaggerItemProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  style,
  className,
}) => (
  <motion.div
    variants={staggerItemVariants}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

/* ──────────────────────────────────────────
   HoverScale — interactive hover/tap wrapper
────────────────────────────────────────── */
interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  tapScale?: number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  scale = 1.04,
  tapScale = 0.97,
  style,
  className,
  onClick,
}) => (
  <motion.div
    whileHover={{ scale }}
    whileTap={{ scale: tapScale }}
    transition={springSnappy}
    style={{ ...style, cursor: 'pointer' }}
    className={className}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

/* ──────────────────────────────────────────
   MotionCard — 3D tilt card with glare
────────────────────────────────────────── */
interface MotionCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  intensity?: number;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  style,
  className,
  intensity = 8,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [intensity, -intensity]);
  const rotateY = useTransform(mouseX, [0, 1], [-intensity, intensity]);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const glareX = useTransform(mouseX, [0, 1], [0, 100]);
  const glareY = useTransform(mouseY, [0, 1], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeaveInternal = (e: React.MouseEvent) => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    onMouseLeave?.(e);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={handleMouseLeaveInternal}
      onClick={onClick}
      style={{
        ...style,
        perspective: '800px',
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      <motion.div
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {children}
        {/* Glare overlay */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            background: useTransform(
              [glareX, glareY],
              ([x, y]) =>
                `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
            ),
            zIndex: 10,
          }}
        />
      </motion.div>
    </motion.div>
  );
};

/* ──────────────────────────────────────────
   Overlay backdrop for modals
────────────────────────────────────────── */
interface ModalOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
  style?: React.CSSProperties;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  children,
  onClose,
  style,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    onClick={onClose}
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      ...style,
    }}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      transition={springSmooth}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

/* ──────────────────────────────────────────
   SlidePanel — for drawers and panels
────────────────────────────────────────── */
interface SlidePanelProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  style?: React.CSSProperties;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
  children,
  direction = 'right',
  style,
}) => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const sign = direction === 'right' || direction === 'down' ? 1 : -1;
  const offset = axis === 'x' ? 300 : '100%';

  return (
    <motion.div
      initial={{ [axis]: typeof offset === 'number' ? offset * sign : sign > 0 ? offset : `-${offset}`, opacity: 0 }}
      animate={{ [axis]: 0, opacity: 1 }}
      exit={{ [axis]: typeof offset === 'number' ? offset * sign : sign > 0 ? offset : `-${offset}`, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={style}
    >
      {children}
    </motion.div>
  );
};

/* ──────────────────────────────────────────
   Particle Burst — decorative effect
────────────────────────────────────────── */
interface ParticleBurstProps {
  count?: number;
  color?: string;
  size?: number;
}

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  count = 12,
  color = 'var(--accent)',
  size = 6,
}) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
    {Array.from({ length: count }).map((_, i) => {
      const angle = (360 / count) * i;
      const rad = (angle * Math.PI) / 180;
      const dist = 60 + Math.random() * 40;
      return (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(rad) * dist,
            y: Math.sin(rad) * dist,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.6 + Math.random() * 0.3, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            marginLeft: `-${size / 2}px`,
            marginTop: `-${size / 2}px`,
          }}
        />
      );
    })}
  </div>
);
