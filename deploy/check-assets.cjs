#!/usr/bin/env node
// Audio is optional: check file paths without reading media, env files or DBs.
const fs = require('fs');
const path = require('path');
const workspace = path.resolve(__dirname, '..');
const root = fs.existsSync(path.join(workspace, 'ptcg-server')) ? workspace : path.join(workspace, 'twinleafgg');
const source = path.join(root, 'ptcg-play-react/src/sfx/sfxAssets.ts');
const references = /['"]\.\.\/assets\/sfx\/ptcgo-sfx\/([\w-]+\.mp3)['"]/g;
const names = [...new Set([...fs.readFileSync(source, 'utf8').matchAll(references)].map(match => match[1]))];
const missing = names.filter(name => !fs.existsSync(path.join(root, 'ptcg-play-react/src/assets/sfx/ptcgo-sfx', name)));

// Battle BGM lives one directory per theme; the catalog lists what the player expects.
const catalogPath = path.join(root, 'ptcg-play-react/src/bgm/bgmCatalog.ts');
const bgmDir = path.join(root, 'ptcg-play-react/src/assets/bgm');
const bgmTracks = [];
if (fs.existsSync(catalogPath)) {
  let theme = null;
  for (const match of fs.readFileSync(catalogPath, 'utf8').matchAll(/\b(id|file):\s*"([^"]+)"/g)) {
    if (match[1] === 'id') theme = match[2];
    else if (theme) bgmTracks.push(`${theme}/${match[2]}`);
  }
}
const bgmMissing = bgmTracks.filter(rel => !fs.existsSync(path.join(bgmDir, rel)));

if ((missing.length || bgmMissing.length) && process.argv.includes('--require-audio')) {
  console.error(`Missing ${missing.length + bgmMissing.length} optional audio files. Legally prepare the referenced files before requiring sound.`);
  process.exit(1);
}
console.log(`Optional audio: ${names.length - missing.length}/${names.length} SFX paths, ${bgmTracks.length - bgmMissing.length}/${bgmTracks.length} BGM paths present. Missing clips are silent; build remains available. This does not verify media rights.`);
