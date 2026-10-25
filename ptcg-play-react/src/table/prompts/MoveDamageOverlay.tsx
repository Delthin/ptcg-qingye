import type { MoveDamagePrompt } from 'ptcg-server';
import { DamageBoardPrompt, type DamageBoardPromptProps } from './DamageBoardPrompt';

export type MoveDamageOverlayProps = Omit<DamageBoardPromptProps, 'prompt'> & { prompt: MoveDamagePrompt };

export function MoveDamageOverlay(props: MoveDamageOverlayProps) {
  return <DamageBoardPrompt key={`${props.localGame.localId}:${props.prompt.id}`} {...props} />;
}
