import React from 'react';
import {
  Play, Music2, Mic2, SlidersHorizontal, Languages, Search, Disc3,
  Sparkles, Heart, ArrowRight, Headphones,
} from 'lucide-react';
import {
  motion, FadeInView, StaggerContainer, StaggerItem, HoverScale, MotionCard,
} from '../components/motion';
import logoImg from '../assets/image.png';

interface LandingProps {
  onEnter: () => void;
}

const FEATURES = [
  { icon: Mic2, title: 'Synced Lyrics', desc: 'Word-perfect LRC lyrics that scroll in real time. Tap any line to jump right to it.', tint: 'var(--accent)' },
  { icon: SlidersHorizontal, title: '5-Band Equalizer', desc: 'Sculpt your sound with a pro equalizer, bass boost and curated presets.', tint: 'var(--magenta)' },
  { icon: Music2, title: 'Millions of Tracks', desc: 'Stream a vast catalogue of songs across every era and every mood.', tint: 'var(--fuchsia)' },
  { icon: Languages, title: 'Multilingual', desc: 'Tamil, Telugu, Hindi, Punjabi, English and more — all in one place.', tint: 'var(--cyan)' },
  { icon: Search, title: 'Smart Search', desc: 'Popularity-ranked results find the exact track you meant, instantly.', tint: 'var(--accent-2)' },
  { icon: Disc3, title: 'Immersive Player', desc: 'A spinning vinyl, 3D cover tilt and ambient glow make every song a moment.', tint: 'var(--pink)' },
];

const GENRES = ['Romantic', 'Party', 'Chill', 'Focus', 'Workout', 'Lo-Fi', 'Indie', 'Classical', 'Hip-Hop', 'Devotional'];

const STATS = [
  { value: '10M+', label: 'Songs' },
  { value: '5', label: 'Languages' },
  { value: '∞', label: 'Playlists' },
  { value: 'HD', label: 'Audio' },
];

/* Decorative equalizer bars */
const EqBars: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '46px' }}>
    {[0.5, 0.9, 0.4, 1, 0.65, 0.85, 0.3, 0.7, 0.5].map((h, i) => (
      <motion.span
        key={i}
        animate={{ scaleY: [h * 0.4, h, h * 0.5] }}
        transition={{ duration: 0.6 + (i % 4) * 0.18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        style={{
          width: '5px', height: '100%', borderRadius: '99px', transformOrigin: 'bottom',
          background: i % 2 === 0 ? 'var(--accent)' : 'var(--magenta)',
          boxShadow: `0 0 8px ${i % 2 === 0 ? 'var(--accent-glow)' : 'var(--magenta-glow)'}`,
        }}
      />
    ))}
  </div>
);

const LogoBadge: React.FC<{ size?: number }> = ({ size = 46 }) => (
  <div
    style={{
      width: size, height: size, borderRadius: '50%', padding: '2px', flexShrink: 0,
      background: 'linear-gradient(150deg, rgba(168,85,247,0.9), rgba(236,72,153,0.75))',
    }}
  >
    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#0a0713', position: 'relative' }}>
      <img src={logoImg} alt="VibeUp" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `inset 0 0 ${size / 4}px ${size / 12}px #0a0713` }} />
    </div>
  </div>
);

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  const [leaving, setLeaving] = React.useState(false);
  const enter = React.useCallback(() => setLeaving(true), []);

  // Guaranteed hand-off to the app even if onAnimationComplete never fires.
  React.useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onEnter, 600);
    return () => clearTimeout(timer);
  }, [leaving, onEnter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.03 : 1 }}
      transition={{ duration: leaving ? 0.5 : 0.5 }}
      onAnimationComplete={() => { if (leaving) onEnter(); }}
      className="hide-scrollbar"
      style={{
        position: 'fixed', inset: 0, zIndex: 500, overflowY: 'auto', overflowX: 'hidden',
        background: 'radial-gradient(130% 90% at 50% 0%, #130b26 0%, #08060f 55%, #050409 100%)',
        color: 'var(--text-primary)',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      {/* ── Ambient backdrops ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div className="bg-mesh" />
        <div className="bg-orbs" />
        <div className="bg-grid" />
        <div className="bg-spotlight" />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ══ Top Nav ══ */}
        <motion.header
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'sticky', top: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px clamp(20px, 5vw, 64px)',
            backdropFilter: 'blur(14px)',
            background: 'linear-gradient(180deg, rgba(8,6,15,0.75), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogoBadge size={40} />
            <span className="text-flame" style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.6px' }}>VibeUp</span>
          </div>
          <HoverScale scale={1.05} tapScale={0.95}>
            <button
              onClick={enter}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '99px', cursor: 'pointer',
                border: '1px solid var(--border-strong)', color: 'var(--text-primary)',
                background: 'rgba(168,85,247,0.10)', fontFamily: 'var(--font)',
                fontSize: '13px', fontWeight: 700,
              }}
            >
              Open App <ArrowRight size={15} />
            </button>
          </HoverScale>
        </motion.header>

        {/* ══ Hero ══ */}
        <section style={{ padding: 'clamp(48px, 9vh, 110px) clamp(20px, 5vw, 64px) 70px', textAlign: 'center', position: 'relative' }}>
          {/* Announcement chip */}
          <FadeInView direction="down" delay={0.05} style={{ display: 'inline-block', marginBottom: '30px' }}>
            <div className="glow-chip" style={{
              display: 'inline-flex', alignItems: 'center', gap: '9px',
              padding: '7px 16px', borderRadius: '99px',
              background: 'rgba(20,14,36,0.8)', border: '1px solid var(--border-medium)',
              fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
            }}>
              <Sparkles size={13} color="var(--magenta)" />
              Synced lyrics · Hi-Fi equalizer · Now playing reimagined
            </div>
          </FadeInView>

          {/* Floating logo badge */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 }}
            className="float-bob"
            style={{ display: 'inline-flex', marginBottom: '26px' }}
          >
            <div className="logo-badge-glow" style={{ borderRadius: '50%' }}>
              <LogoBadge size={104} />
            </div>
          </motion.div>

          <FadeInView direction="up" delay={0.15}>
            <h1 style={{ fontSize: 'clamp(42px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-2.5px', margin: '0 auto', maxWidth: '15ch' }}>
              Feel every <span className="text-flame">beat</span>.
            </h1>
          </FadeInView>

          <FadeInView direction="up" delay={0.28}>
            <p style={{ fontSize: 'clamp(15px, 2.2vw, 19px)', color: 'var(--text-secondary)', maxWidth: '54ch', margin: '22px auto 0', lineHeight: 1.6, fontWeight: 400 }}>
              Your music, elevated. Millions of tracks, real-time synced lyrics, a studio-grade
              equalizer and a now-playing experience that turns every song into a moment.
            </p>
          </FadeInView>

          <FadeInView direction="up" delay={0.4}>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '38px' }}>
              <HoverScale scale={1.05} tapScale={0.95}>
                <button
                  onClick={enter}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '15px 32px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                    background: 'var(--gradient-main)', color: '#fff', fontFamily: 'var(--font)',
                    fontSize: '15px', fontWeight: 800, letterSpacing: '0.2px',
                    boxShadow: '0 10px 34px rgba(168,85,247,0.4), 0 0 0 1px rgba(255,255,255,0.06) inset',
                  }}
                >
                  <Play size={17} fill="#fff" /> Start Listening
                </button>
              </HoverScale>
              <HoverScale scale={1.05} tapScale={0.95}>
                <a
                  href="#features"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '15px 28px', borderRadius: '99px', textDecoration: 'none',
                    border: '1px solid var(--border-strong)', color: 'var(--text-primary)',
                    background: 'rgba(255,255,255,0.03)', fontFamily: 'var(--font)',
                    fontSize: '15px', fontWeight: 700,
                  }}
                >
                  <Headphones size={17} /> Explore features
                </a>
              </HoverScale>
            </div>
          </FadeInView>

          {/* Live equalizer flourish */}
          <FadeInView direction="up" delay={0.55} style={{ display: 'flex', justifyContent: 'center', marginTop: '54px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '20px',
              padding: '16px 26px', borderRadius: 'var(--radius-xl)',
              background: 'rgba(20,14,36,0.6)', border: '1px solid var(--border-medium)',
              backdropFilter: 'blur(14px)',
            }}>
              <EqBars />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '13px', fontWeight: 700 }}>Now vibing</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Studio-grade audio engine</p>
              </div>
            </div>
          </FadeInView>
        </section>

        {/* ══ Stats strip ══ */}
        <StaggerContainer
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
            maxWidth: '820px', margin: '0 auto', padding: '0 clamp(20px, 5vw, 64px) 30px',
          }}
        >
          {STATS.map((s) => (
            <StaggerItem key={s.label}>
              <div style={{ textAlign: 'center', padding: '18px 8px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <p className="text-flame" style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, letterSpacing: '-1px' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '2px' }}>{s.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* ══ Features ══ */}
        <section id="features" style={{ padding: 'clamp(60px, 10vh, 110px) clamp(20px, 5vw, 64px)', maxWidth: '1180px', margin: '0 auto' }}>
          <FadeInView direction="up" style={{ textAlign: 'center', marginBottom: '54px' }}>
            <p className="section-label" style={{ color: 'var(--magenta)', marginBottom: '12px' }}>Everything you need</p>
            <h2 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.05 }}>
              Built for people who <span className="text-flame">love</span> music
            </h2>
          </FadeInView>

          <StaggerContainer
            staggerDelay={0.09}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <StaggerItem key={f.title}>
                  <MotionCard
                    intensity={6}
                    style={{
                      height: '100%', borderRadius: 'var(--radius-lg)', padding: '28px 26px',
                      background: 'linear-gradient(160deg, rgba(23,19,46,0.9), rgba(14,11,28,0.9))',
                      border: '1px solid var(--border-medium)',
                    }}
                    className="song-card-glow"
                  >
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px', marginBottom: '20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `color-mix(in srgb, ${f.tint} 16%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${f.tint} 40%, transparent)`,
                      boxShadow: `0 0 24px color-mix(in srgb, ${f.tint} 22%, transparent)`,
                    }}>
                      <Icon size={24} color={f.tint} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '9px' }}>{f.title}</h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                  </MotionCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>

        {/* ══ Now Playing showcase ══ */}
        <section style={{ padding: 'clamp(30px, 6vh, 70px) clamp(20px, 5vw, 64px)', maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px',
            alignItems: 'center',
            borderRadius: 'var(--radius-xl)', padding: 'clamp(28px, 5vw, 56px)',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(236,72,153,0.06))',
            border: '1px solid var(--border-medium)', overflow: 'hidden', position: 'relative',
          }}>
            <FadeInView direction="right">
              <p className="section-label" style={{ color: 'var(--accent-2)', marginBottom: '14px' }}>Immersive now playing</p>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: '18px' }}>
                A player that <span className="text-flame">spins</span> with you
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '26px', maxWidth: '46ch' }}>
                Tap the artwork to flip between a spinning vinyl and a 3D-tilting cover with a
                holographic sheen. Ambient glow reacts to your track while synced lyrics glide beside it.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Spinning vinyl & 3D cover tilt', 'Real-time synced lyric scroll', 'Full artist details & discovery'].map((t) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '11px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-main)', flexShrink: 0 }}>
                      <Heart size={11} fill="#fff" color="#fff" />
                    </span>
                    {t}
                  </div>
                ))}
              </div>
            </FadeInView>

            {/* Spinning vinyl mock */}
            <FadeInView direction="left" style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 'min(260px, 70vw)', aspectRatio: '1/1' }}>
                <div className="prismatic-ring" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #17132e, #2a1a44, #3a1f52, #17132e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px var(--accent-glow)',
                    position: 'relative',
                  }}
                >
                  {/* grooves */}
                  {[0.86, 0.68, 0.5].map((s) => (
                    <div key={s} style={{ position: 'absolute', width: `${s * 100}%`, height: `${s * 100}%`, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
                  ))}
                  <div style={{
                    width: '30%', height: '30%', borderRadius: '50%',
                    background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 26px var(--magenta-glow)',
                  }}>
                    <Disc3 size={30} color="#fff" />
                  </div>
                </motion.div>
              </div>
            </FadeInView>
          </div>
        </section>

        {/* ══ Genre marquee ══ */}
        <section style={{ padding: '20px 0 60px', overflow: 'hidden' }}>
          <div className="marquee-track" style={{ gap: '14px' }}>
            {[...GENRES, ...GENRES].map((g, i) => (
              <span key={i} style={{
                flexShrink: 0, padding: '11px 22px', borderRadius: '99px', fontSize: '14px', fontWeight: 700,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)', whiteSpace: 'nowrap',
              }}>
                {g}
              </span>
            ))}
          </div>
        </section>

        {/* ══ Final CTA ══ */}
        <section style={{ padding: '0 clamp(20px, 5vw, 64px) 80px', maxWidth: '900px', margin: '0 auto' }}>
          <FadeInView direction="up">
            <div style={{
              textAlign: 'center', borderRadius: 'var(--radius-xl)',
              padding: 'clamp(40px, 7vw, 72px) 28px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.14), rgba(236,72,153,0.10))',
              border: '1px solid var(--border-strong)', position: 'relative', overflow: 'hidden',
            }}>
              <div className="bg-spotlight" style={{ opacity: 0.6 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.08, marginBottom: '16px' }}>
                  Ready to <span className="text-flame">vibe up</span>?
                </h2>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '44ch', margin: '0 auto 30px', lineHeight: 1.6 }}>
                  No sign-up, no clutter. Just press play and let the music take over.
                </p>
                <HoverScale scale={1.06} tapScale={0.95} style={{ display: 'inline-block' }}>
                  <button
                    onClick={enter}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '10px',
                      padding: '16px 40px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                      background: 'var(--gradient-main)', color: '#fff', fontFamily: 'var(--font)',
                      fontSize: '16px', fontWeight: 800,
                      boxShadow: '0 12px 40px rgba(168,85,247,0.45)',
                    }}
                  >
                    <Play size={18} fill="#fff" /> Enter VibeUp
                  </button>
                </HoverScale>
              </div>
            </div>
          </FadeInView>
        </section>

        {/* ══ Footer ══ */}
        <footer style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
          padding: '28px clamp(20px, 5vw, 64px)', borderTop: '1px solid var(--border)',
          color: 'var(--text-tertiary)', fontSize: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogoBadge size={26} />
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>VibeUp</span>
            <span>· Feel the Music</span>
          </div>
          <span>Built with React · framer-motion</span>
        </footer>
      </div>
    </motion.div>
  );
};
