import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from '../../config';

let cached: Set<string> | undefined;
/** The curated pool is a release artifact. Restart the server after regenerating it. */
export function duoCardPool(): Set<string> | undefined {
  if (!config.duo.enabled) return undefined;
  if (!cached) {
    const data = JSON.parse(readFileSync(join(config.sets.scansDir, 'duo', 'catalog.json'), 'utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid Chinese card catalog');
    cached = new Set(Object.keys(data));
  }
  return cached;
}
