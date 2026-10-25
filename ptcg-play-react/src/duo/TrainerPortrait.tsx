import { useId } from 'react';

/** Muted accents harmonised with the dark-gold room; picked by name hash. */
const ACCENTS = ['#c9a06a', '#7ea995', '#8fa7c4', '#b98a9e', '#a4a2c9', '#c4837a'];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash;
}

/**
 * Original vector portraits for the two founding identities; any other lobby
 * account gets a deterministic monogram badge in the same dark-gold language.
 */
export function TrainerPortrait({ name, size = 84 }: { name: string; size?: number }) {
  const id = useId().replace(/:/g, '');
  const leaf = name === 'leaf';
  const red = name === 'red';
  if (!leaf && !red) {
    const accent = ACCENTS[hashName(name) % ACCENTS.length];
    const initial = (name.trim()[0] ?? '?').toUpperCase();
    return <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`${name} 的头像`}>
      <defs><linearGradient id={id} x2="1" y2="1"><stop stopColor={accent} stopOpacity=".28" /><stop offset="1" stopColor="#172333" /></linearGradient></defs>
      <circle cx="60" cy="60" r="58" fill={`url(#${id})`} />
      <circle cx="60" cy="60" r="51" fill="none" stroke={accent} strokeOpacity=".36" />
      <path d="M29 103 Q33 83 51 80 L69 80 Q87 83 91 103" fill={accent} fillOpacity=".55" />
      <circle cx="60" cy="53" r="20" fill="#141d29" stroke={accent} strokeOpacity=".5" />
      <text x="60" y="61" textAnchor="middle" fontFamily="-apple-system,BlinkMacSystemFont,Arial,sans-serif" fontSize="24" fontWeight="600" fill="#e8dcc4">{initial}</text>
    </svg>;
  }
  const accent = leaf ? '#7ea995' : '#c97b70';
  return <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={leaf ? '叶子角色头像' : '赤红角色头像'}>
    <defs><linearGradient id={id} x2="1" y2="1"><stop stopColor={leaf ? '#35594d' : '#66464a'} /><stop offset="1" stopColor="#172333" /></linearGradient></defs>
    <circle cx="60" cy="60" r="58" fill={`url(#${id})`} />
    <circle cx="60" cy="60" r="51" fill="none" stroke={accent} strokeOpacity=".36" />
    <path d="M29 103 Q33 83 51 80 L69 80 Q87 83 91 103" fill={accent} />
    <path d="M51 80 L60 91 L69 80 L65 76 L55 76Z" fill="#e6b7a1" />
    {leaf && <path d="M35 42 Q32 20 62 24 Q87 29 85 69 L82 90 L74 79 L43 82 L34 90Z" fill="#493c34" />}
    <path d="M38 48 Q40 31 60 31 Q81 33 82 49 L78 67 Q72 82 60 82 Q46 79 41 65Z" fill="#efc6ad" />
    <path d={leaf ? 'M37 49 L41 30 L64 29 L84 43 L78 53 L67 42 L44 48Z' : 'M37 46 L41 33 L74 32 L82 49 L73 42 L42 51Z'} fill="#403c3b" />
    <path d="M47 59 L52 59 M68 59 L73 59" stroke="#353a43" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M56 70 Q61 73 66 69" fill="none" stroke="#a56e64" strokeWidth="1.8" strokeLinecap="round" />
    {leaf ? <><ellipse cx="59" cy="32" rx="28" ry="10" fill="#e2d7b4" /><path d="M39 31 Q42 15 61 17 Q77 18 80 32" fill="#eee5c9" /><path d="M39 30 Q60 35 79 30" stroke={accent} strokeWidth="5" /></> : <><path d="M35 42 Q35 19 61 20 Q82 22 85 42Z" fill="#b85551" /><path d="M38 38 L88 41 Q99 46 89 49 L55 45Z" fill="#e5dcd2" /><path d="M52 22 L52 38 L70 39 L70 23" fill="#eadfd6" /><circle cx="61" cy="31" r="4" fill="#b85551" /></>}
    <path d="M46 91 L46 105 M75 91 L75 105" stroke="#dfd8cf" strokeWidth="5" />
  </svg>;
}
