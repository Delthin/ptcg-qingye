import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullscreen?: boolean;
}

export function Loading({ size = 'md', text, fullscreen = false }: LoadingProps) {
  const content = (
    <div className={`${styles.container} ${fullscreen ? styles.fullscreen : ''}`}>
      <div className={`${styles.pokeball} ${styles[size]}`}>
        <div className={styles.pokeballTop} />
        <div className={styles.pokeballBottom} />
        <div className={styles.pokeballCenter}>
          <div className={styles.pokeballButton} />
        </div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className={styles.overlay}>
        {content}
      </div>
    );
  }

  return content;
}

// 简单的旋转加载器
export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`${styles.spinner} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="32"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="8"
      />
    </svg>
  );
}
