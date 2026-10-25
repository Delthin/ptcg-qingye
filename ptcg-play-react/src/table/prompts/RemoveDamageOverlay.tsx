import type { RemoveDamagePrompt } from 'ptcg-server';
import { DamageBoardPrompt, type DamageBoardPromptProps } from './DamageBoardPrompt';

export type RemoveDamageOverlayProps = Omit<DamageBoardPromptProps, 'prompt'> & { prompt: RemoveDamagePrompt };

export function RemoveDamageOverlay(props: RemoveDamageOverlayProps) {
  return <DamageBoardPrompt key={`${props.localGame.localId}:${props.prompt.id}`} {...props} />;
}
