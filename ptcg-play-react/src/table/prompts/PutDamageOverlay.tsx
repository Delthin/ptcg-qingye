import type { PutDamagePrompt } from 'ptcg-server';
import { DamageBoardPrompt, type DamageBoardPromptProps } from './DamageBoardPrompt';

export type PutDamageOverlayProps = Omit<DamageBoardPromptProps, 'prompt'> & { prompt: PutDamagePrompt };

export function PutDamageOverlay(props: PutDamageOverlayProps) {
  return <DamageBoardPrompt key={`${props.localGame.localId}:${props.prompt.id}`} {...props} />;
}
