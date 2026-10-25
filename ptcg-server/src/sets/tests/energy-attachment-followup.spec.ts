import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { CardManager } from '../../game/cards/card-manager';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { useAbility, useAttack } from './card-test-helpers';
import { padDeck, setupGame } from './test-helpers';
import { Latias } from '../09-sword-and-shield/set-fusion-strike/latias';
import { Latios } from '../09-sword-and-shield/set-fusion-strike/latios';
import { Manaphy } from '../06-black-and-white/set-plasma-storm/manaphy';
import { MSceptileEx } from '../07-x-and-y/set-ancient-origins/m-sceptile-ex';
import { Dedenne } from '../11-mega-evolution/set-perfect-order/dedenne';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { ...active, slot: SlotType.BENCH };
function define(cards: PokemonCard[]) {
  const manager = CardManager.getInstance();
  for (const card of cards) if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
}

describe('Energy-family followup malformed filters', () => {
  const cases = [
    { card: new Latias(), target: new Latios(), energy: 'Psychic Energy SVE', ability: true },
    { card: new Latios(), target: new Latias(), energy: 'Psychic Energy SVE', ability: true },
    { card: new Manaphy(), target: new Latias(), energy: 'Water Energy SVE', ability: false },
    { card: new MSceptileEx(), target: new Latias(), energy: 'Grass Energy SVE', ability: false },
    { card: new Dedenne(), target: new Dedenne(), energy: 'Lightning Energy SVE', ability: false },
  ];
  beforeAll(() => define(cases.flatMap(c => [c.card, c.target])));
  cases.forEach(({ card, target, energy, ability }) => {
    it(`${card.fullName} offers and accepts its legal energy with scalar filters`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: [energy, energy, energy] }, bench: [{ card: target.fullName }],
          hand: [energy, energy, energy], discard: [energy, energy, energy], deck: padDeck(10) },
        player2: { active: { card: 'Ralts SIT', energy: [energy] }, deck: padDeck(10) },
      });
      let answered = 0;
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        const count = Math.max(1, prompt.options.min);
        const raw = Array.from({ length: count }, (_, index) => ({ to: bench, index }));
        expect(prompt.validate(prompt.decode(raw, game.state), game.state)).toBe(true);
        answered++;
        return raw;
      });
      const implementation = game.player1.active.getPokemonCard()!;
      if (ability) useAbility(game.store, game.state, 0, implementation.powers[0].name);
      else useAttack(game.store, game.state, 0, implementation.attacks[0].name);
      expect(answered).toBe(1);
      expect(game.player1.bench[0].cards.some(c => c.name === energy.replace(' SVE', ''))).toBe(true);
    });
  });
});
