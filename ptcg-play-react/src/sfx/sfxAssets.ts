// Private audio is optional in source-only/public checkouts. Licensed files
// at the original paths are bundled automatically; missing clips are no-ops.
const audioUrls = import.meta.glob<string>('../assets/sfx/ptcgo-sfx/*.mp3', {
  eager: true, query: '?url', import: 'default',
});
const carddraw = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-carddraw.mp3'] ?? '';
const cardreveal = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-cardreveal.mp3'] ?? '';
const coinflip = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-coinflip.mp3'] ?? '';
const colorlessAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-colorlessattackbig.mp3'] ?? '';
const colorlessAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-colorlessattackmedium.mp3'] ?? '';
const colorlessAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-colorlessattacksmall.mp3'] ?? '';
const damagetoken = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-damagetoken.mp3'] ?? '';
const damagetokenremoved = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-damagetokenremoved.mp3'] ?? '';
const darknessAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-darknessattackbig.mp3'] ?? '';
const darknessAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-darknessattackmedium.mp3'] ?? '';
const darknessAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-darknessattacksmall.mp3'] ?? '';
const energyattach = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-energyattach.mp3'] ?? '';
const evolution = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-evolution.mp3'] ?? '';
const fightingAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-fightingattackbig.mp3'] ?? '';
const fightingAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-fightingattackmedium.mp3'] ?? '';
const fightingAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-fightingattacksmall.mp3'] ?? '';
const fireAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-fireattackbig.mp3'] ?? '';
const fireAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-fireattackmedium.mp3'] ?? '';
const fireAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-fireattacksmall.mp3'] ?? '';
const gamelose = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-gamelose.mp3'] ?? '';
const gamewin = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-gamewin.mp3'] ?? '';
const grassAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-grassattackbig.mp3'] ?? '';
const grassAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-grassattackmedium.mp3'] ?? '';
const grassAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-grassattacksmall.mp3'] ?? '';
const heal = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-heal.mp3'] ?? '';
const knockout = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-knockout.mp3'] ?? '';
const knockoutinattack = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-knockoutinattack.mp3'] ?? '';
const lightningAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-lightningattackbig.mp3'] ?? '';
const lightningAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-lightningattackmedium.mp3'] ?? '';
const lightningAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-lightningattacksmall.mp3'] ?? '';
const metalAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-metalattackbig.mp3'] ?? '';
const metalAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-metalattackmedium.mp3'] ?? '';
const metalAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-metalattacksmall.mp3'] ?? '';
const newactivepokemon = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-newactivepokemon.mp3'] ?? '';
const opponentturnbegin = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-opponentturnbegin.mp3'] ?? '';
const opponentturnend = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-opponentturnend.mp3'] ?? '';
const playerturnbegin = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-playerturnbegin.mp3'] ?? '';
const playerturnend = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-playerturnend.mp3'] ?? '';
const playtrainer = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-playtrainer.mp3'] ?? '';
const pokemonplay = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-pokemonplay.mp3'] ?? '';
const prizecardselected = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-prizecardselected.mp3'] ?? '';
const psychicAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-psychicattackbig.mp3'] ?? '';
const psychicAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-psychicattackmedium.mp3'] ?? '';
const psychicAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-psychicattacksmall.mp3'] ?? '';
const specialAsleep = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-specialcondition-on-asleep.mp3'] ?? '';
const specialBurn = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-specialcondition-on-burn.mp3'] ?? '';
const specialConfused = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-specialcondition-on-confused.mp3'] ?? '';
const specialParalyze = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-specialcondition-on-paralyze.mp3'] ?? '';
const specialPoison = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-specialcondition-on-poison.mp3'] ?? '';
const waterAttackBig = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-waterattackbig.mp3'] ?? '';
const waterAttackMedium = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-waterattackmedium.mp3'] ?? '';
const waterAttackSmall = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-waterattacksmall.mp3'] ?? '';
const uiButton = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-ui-button.mp3'] ?? '';
const uiCheckboxOff = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-ui-checkbox-off.mp3'] ?? '';
const uiCheckboxOn = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-ui-checkbox-on.mp3'] ?? '';
const uiDropnav = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-ui-dropnav.mp3'] ?? '';
const uiMenuslideLanding = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-ui-menuslide-landing.mp3'] ?? '';
const uiModalClose = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-ui-modalclose.mp3'] ?? '';
const uiModalOpen = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-ui-modalopen.mp3'] ?? '';
const uiNavslide = audioUrls['../assets/sfx/ptcgo-sfx/ptcgo-ui-navslide.mp3'] ?? '';

export type SfxId =
  | 'carddraw'
  | 'cardreveal'
  | 'coinflip'
  | 'damagetoken'
  | 'damagetokenremoved'
  | 'energyattach'
  | 'evolution'
  | 'gamelose'
  | 'gamewin'
  | 'heal'
  | 'knockout'
  | 'knockoutinattack'
  | 'newactivepokemon'
  | 'opponentturnbegin'
  | 'opponentturnend'
  | 'playerturnbegin'
  | 'playerturnend'
  | 'playtrainer'
  | 'pokemonplay'
  | 'prizecardselected'
  | 'specialAsleep'
  | 'specialBurn'
  | 'specialConfused'
  | 'specialParalyze'
  | 'specialPoison'
  | 'colorlessAttackBig'
  | 'colorlessAttackMedium'
  | 'colorlessAttackSmall'
  | 'darknessAttackBig'
  | 'darknessAttackMedium'
  | 'darknessAttackSmall'
  | 'fightingAttackBig'
  | 'fightingAttackMedium'
  | 'fightingAttackSmall'
  | 'fireAttackBig'
  | 'fireAttackMedium'
  | 'fireAttackSmall'
  | 'grassAttackBig'
  | 'grassAttackMedium'
  | 'grassAttackSmall'
  | 'lightningAttackBig'
  | 'lightningAttackMedium'
  | 'lightningAttackSmall'
  | 'metalAttackBig'
  | 'metalAttackMedium'
  | 'metalAttackSmall'
  | 'psychicAttackBig'
  | 'psychicAttackMedium'
  | 'psychicAttackSmall'
  | 'waterAttackBig'
  | 'waterAttackMedium'
  | 'waterAttackSmall'
  | 'uiButton'
  | 'uiCheckboxOff'
  | 'uiCheckboxOn'
  | 'uiDropnav'
  | 'uiMenuslideLanding'
  | 'uiModalClose'
  | 'uiModalOpen'
  | 'uiNavslide';

export const SFX_URLS: Record<SfxId, string> = {
  carddraw,
  cardreveal,
  coinflip,
  damagetoken,
  damagetokenremoved,
  energyattach,
  evolution,
  gamelose,
  gamewin,
  heal,
  knockout,
  knockoutinattack,
  newactivepokemon,
  opponentturnbegin,
  opponentturnend,
  playerturnbegin,
  playerturnend,
  playtrainer,
  pokemonplay,
  prizecardselected,
  specialAsleep,
  specialBurn,
  specialConfused,
  specialParalyze,
  specialPoison,
  colorlessAttackBig,
  colorlessAttackMedium,
  colorlessAttackSmall,
  darknessAttackBig,
  darknessAttackMedium,
  darknessAttackSmall,
  fightingAttackBig,
  fightingAttackMedium,
  fightingAttackSmall,
  fireAttackBig,
  fireAttackMedium,
  fireAttackSmall,
  grassAttackBig,
  grassAttackMedium,
  grassAttackSmall,
  lightningAttackBig,
  lightningAttackMedium,
  lightningAttackSmall,
  metalAttackBig,
  metalAttackMedium,
  metalAttackSmall,
  psychicAttackBig,
  psychicAttackMedium,
  psychicAttackSmall,
  waterAttackBig,
  waterAttackMedium,
  waterAttackSmall,
  uiButton,
  uiCheckboxOff,
  uiCheckboxOn,
  uiDropnav,
  uiMenuslideLanding,
  uiModalClose,
  uiModalOpen,
  uiNavslide,
};
