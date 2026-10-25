import { useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './Card3D.module.css';

interface Card3DProps {
  imageUrl: string;
  name: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'rare-holo' | 'ultra-rare' | 'secret';
  size?: 'sm' | 'md' | 'lg';
  holo?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Card3D({
  imageUrl,
  name,
  rarity = 'common',
  size = 'md',
  holo = false,
  onClick,
  className = '',
}: Card3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!holo) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const cardStyle: CSSProperties = {
    transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) ${isHovered ? 'translateY(-8px) scale(1.05)' : ''}`,
  };

  const shineStyle: CSSProperties = holo ? {
    backgroundPosition: `${50 + rotation.y * 2}% ${50 + rotation.x * 2}%`,
  } : {};

  return (
    <div
      className={`${styles.container} ${styles[size]} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={name}
    >
      <div className={styles.card} style={cardStyle}>
        <div className={`${styles.face} ${styles[rarity]}`}>
          <img
            src={imageUrl}
            alt={name}
            className={styles.image}
            loading="lazy"
          />
          {holo && <div className={styles.holo} style={shineStyle} />}
          <div className={styles.glare} />
        </div>
        <div className={styles.shadow} />
      </div>
    </div>
  );
}
