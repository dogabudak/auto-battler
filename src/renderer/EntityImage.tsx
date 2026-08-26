import { useEffect, useState } from 'react';

/**
 * Entity artwork (flag / crest) with a graceful fallback.
 *
 * Not every entity in every pack has an asset on disk — the football pack is
 * missing a couple of crests, and future packs will land before their art does.
 * Without this, those entities render as a broken-image icon, which is far
 * worse on camera than a clean initials badge.
 */
export const EntityImage: React.FC<{
  imageUrl?: string;
  name: string;
  size: number;
}> = ({ imageUrl, name, size }) => {
  const [failed, setFailed] = useState(false);

  // A pack switch can reuse this slot for a different entity; retry the new art.
  useEffect(() => setFailed(false), [imageUrl]);

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{ objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
      />
    );
  }

  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b4560, #232a3d)',
        border: '1px solid #4a5570',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(8, Math.round(size * 0.38)),
        fontWeight: 'bold',
        color: '#c7d0e4',
        letterSpacing: 0.5,
        pointerEvents: 'none',
      }}
    >
      {initials(name)}
    </div>
  );
};

function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
