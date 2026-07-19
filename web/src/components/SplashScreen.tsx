import React from 'react';
import { motion } from 'framer-motion';
import logoImg from '../assets/image.png';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [leaving, setLeaving] = React.useState(false);

  // Start the fade-out after the intro plays.
  React.useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), 2600);
    return () => clearTimeout(timer);
  }, []);

  // Guaranteed removal even if onAnimationComplete never fires.
  React.useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onFinished, 750);
    return () => clearTimeout(timer);
  }, [leaving, onFinished]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.06 : 1 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
      onAnimationComplete={() => { if (leaving) onFinished(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(130% 100% at 50% 0%, #120a24 0%, #08060f 55%, #050409 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Drifting gradient mesh */}
      <div className="bg-mesh" style={{ opacity: 0.7 }} />
      <div className="bg-orbs" />
      <div className="bg-grid" />

      {/* Orbiting rings around the logo */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(168,85,247,0.45) 55deg, transparent 130deg, rgba(236,72,153,0.35) 250deg, transparent 360deg)',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
          opacity: 0.8,
        }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          border: '1px dashed rgba(168,85,247,0.18)',
        }}
      />

      {/* Logo badge — circular, glowing (not a raw square) */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: -25 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.15, type: 'spring', stiffness: 180, damping: 14 }}
        className="float-bob"
        style={{ position: 'relative', zIndex: 2, marginBottom: '34px' }}
      >
        <div
          className="logo-badge-glow"
          style={{
            position: 'relative',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            padding: '3px',
            background: 'linear-gradient(150deg, rgba(168,85,247,0.9), rgba(236,72,153,0.75))',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#0a0713',
              position: 'relative',
            }}
          >
            <img
              src={logoImg}
              alt="VibeUp"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)' }}
            />
            {/* Blend the square edges into the circular badge */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                boxShadow: 'inset 0 0 34px 12px #0a0713',
              }}
            />
            {/* Glossy sheen */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'linear-gradient(150deg, rgba(255,255,255,0.16), transparent 45%)',
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* App name */}
      <motion.h1
        initial={{ y: 22, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="text-flame"
        style={{
          fontSize: '46px',
          fontWeight: 900,
          letterSpacing: '-1.5px',
          position: 'relative',
          zIndex: 2,
          marginBottom: '10px',
        }}
      >
        VibeUp
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.6 }}
        className="shimmer-text"
        style={{
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 2,
          marginBottom: '46px',
        }}
      >
        Feel the Music
      </motion.p>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{
          position: 'relative',
          width: '210px',
          height: '3px',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '99px',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ delay: 1.1, duration: 1.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            height: '100%',
            borderRadius: '99px',
            background: 'var(--gradient-main)',
            boxShadow: '0 0 14px var(--magenta-glow)',
          }}
        />
      </motion.div>

      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0,
              scale: 0,
            }}
            animate={{
              y: [null, Math.random() * -220 - 90],
              opacity: [0, 0.7, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              borderRadius: '50%',
              background: i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--magenta)' : 'var(--accent-2)',
              boxShadow: `0 0 8px ${i % 3 === 0 ? 'var(--accent-glow)' : 'var(--magenta-glow)'}`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};
