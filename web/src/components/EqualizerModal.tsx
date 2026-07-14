import React from 'react';
import { X, RefreshCw, Zap } from 'lucide-react';
import { useAudio, PRESETS } from '../context/AudioContext';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BAND_LABELS = ['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'];

const PRESET_EMOJIS: Record<string, string> = {
  Normal: '🎵', Pop: '🎤', Rock: '🎸', Jazz: '🎷', Classical: '🎻', Vocal: '🗣️'
};

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
  const { eqEnabled, setEqEnabled, eqBands, setEqBand, bassBoost, setBassBoost, preset, applyPreset } = useAudio();

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #12112a 0%, #0a0918 100%)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          borderRadius: '20px',
          width: '100%', maxWidth: '480px',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          padding: '20px 24px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}>
              <Zap size={16} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Audio Equalizer</h3>
              <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '1px' }}>Fine-tune your listening experience</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Toggle Row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          marginBottom: '16px',
        }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700 }}>Equalizer Effects</p>
            <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>
              {eqEnabled ? `Active — ${preset} preset` : 'Bypassed — all bands flat'}
            </p>
          </div>
          {/* iOS-style toggle */}
          <button
            onClick={() => setEqEnabled(!eqEnabled)}
            style={{
              width: '46px', height: '24px',
              borderRadius: '12px',
              background: eqEnabled ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.1)',
              border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'background 0.3s ease',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: '2px',
              left: eqEnabled ? '24px' : '2px',
              width: '20px', height: '20px',
              borderRadius: '50%', background: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }} />
          </button>
        </div>

        {/* ── Presets ── */}
        <div style={{ marginBottom: '16px', opacity: eqEnabled ? 1 : 0.35, pointerEvents: eqEnabled ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#4B5563', marginBottom: '8px' }}>
            Presets
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.keys(PRESETS).map(p => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '100px',
                  border: `1.5px solid ${preset === p && eqEnabled ? '#7C3AED' : 'rgba(255,255,255,0.06)'}`,
                  background: preset === p && eqEnabled ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                  color: preset === p && eqEnabled ? '#A78BFA' : '#6B7280',
                  fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <span>{PRESET_EMOJIS[p]}</span> {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── 5-Band EQ Sliders ── */}
        <div style={{ marginBottom: '16px', opacity: eqEnabled ? 1 : 0.35, pointerEvents: eqEnabled ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#4B5563' }}>
              5-Band Equalizer
            </p>
            {preset === 'Custom' && (
              <button
                onClick={() => applyPreset('Normal')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#7C3AED', fontSize: '10px', fontWeight: 700,
                }}
              >
                <RefreshCw size={10} /> Reset
              </button>
            )}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px', padding: '14px 12px 10px',
            gap: '6px', height: '140px',
          }}>
            {eqBands.map((gain, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', gap: '6px' }}>
                {/* dB value */}
                <span style={{
                  fontSize: '9px', fontWeight: 700,
                  color: gain > 0 ? '#A78BFA' : gain < 0 ? '#60A5FA' : '#4B5563',
                  minHeight: '12px', lineHeight: 1,
                }}>
                  {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                </span>

                {/* Vertical slider */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <input
                    type="range"
                    min="-12" max="12" step="1"
                    value={gain}
                    onChange={e => setEqBand(i, parseFloat(e.target.value))}
                    style={{
                      writingMode: 'vertical-lr' as const,
                      direction: 'rtl' as const,
                      WebkitAppearance: 'slider-vertical' as any,
                      width: '6px',
                      height: '75px',
                      cursor: 'pointer',
                      accentColor: '#7C3AED',
                    }}
                  />
                </div>

                {/* Frequency label */}
                <span style={{ fontSize: '8px', color: '#374151', fontWeight: 700, textAlign: 'center' }}>
                  {BAND_LABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bass Boost ── */}
        <div style={{ opacity: eqEnabled ? 1 : 0.35, pointerEvents: eqEnabled ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#4B5563' }}>
              Bass Boost
            </p>
            <span style={{
              fontSize: '12px', fontWeight: 800,
              color: bassBoost > 50 ? '#10B981' : '#6B7280',
            }}>
              {bassBoost}%
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px', padding: '8px 12px',
          }}>
            <span style={{ fontSize: '14px' }}>🔈</span>
            <input
              type="range" min="0" max="100"
              value={bassBoost}
              onChange={e => setBassBoost(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: '#10B981' }}
            />
            <span style={{ fontSize: '14px' }}>🔊</span>
          </div>
        </div>
      </div>
    </div>
  );
};
