import { CardManager } from '../../game/cards/card-manager';
import { setChineseStarters } from './index';
import { setupGame, padDeck } from '../tests/test-helpers';
import { useAttack, getDamage, getEnergyCount } from '../tests/card-test-helpers';

// Oracles: CSVH1C 008/059 (220, tails discards all Energy), 001/059 (10 + heal 10),
// and 002/059 (60 for one Grass Energy), from the simplified-Chinese printed cards.
describe('Simplified-Chinese happy starter effects', () => {
  beforeAll(() => CardManager.getInstance().defineSet(setChineseStarters));
  function game(card: string, energy: string[], damage = 0) {
    return setupGame({ turn: 2,
      player1: { active: { card, energy, damage }, deck: padDeck(10) },
      player2: { active: { card: 'Dragapult ex TWM' }, deck: padDeck(10) },
    });
  }
  it('Pikachu deals 220 on heads and retains its attached Energy', () => {
    const fixture = game('Pikachu ex CSVH1C', ['Lightning Energy SVE','Lightning Energy SVE','Water Energy SVE']);
    fixture.overridePrompt('Coin flip', () => true);
    useAttack(fixture.store, fixture.state, 0, 'Strong Volt');
    expect(getDamage(fixture.state, 1)).toBe(220);
    expect(getEnergyCount(fixture.state, 0)).toBe(3);
    expect(fixture.state.players[0].discard.cards.length).toBe(0);
  });
  it('Pikachu still deals 220 on tails, but discards every attached Energy', () => {
    const fixture = game('Pikachu ex CSVH1C', ['Lightning Energy SVE','Lightning Energy SVE','Water Energy SVE','Grass Energy SVE']);
    fixture.overridePrompt('Coin flip', () => false);
    useAttack(fixture.store, fixture.state, 0, 'Strong Volt');
    expect(getDamage(fixture.state, 1)).toBe(220);
    expect(getEnergyCount(fixture.state, 0)).toBe(0);
    expect(fixture.state.players[0].discard.cards.filter(card => card.fullName.includes('Energy')).length).toBe(4);
  });
  it('Shroomish deals 10 and heals exactly 10 damage', () => {
    const fixture = game('Shroomish CSVH1C', ['Grass Energy SVE'], 30);
    useAttack(fixture.store, fixture.state, 0, 'Absorb');
    expect(getDamage(fixture.state, 1)).toBe(10);
    expect(getDamage(fixture.state, 0)).toBe(20);
  });
  it('Shroomish healing cannot create negative damage', () => {
    const fixture = game('Shroomish CSVH1C', ['Grass Energy SVE'], 5);
    useAttack(fixture.store, fixture.state, 0, 'Absorb');
    expect(getDamage(fixture.state, 0)).toBe(0);
  });
  it('Breloom deals 60 with one Grass Energy', () => {
    const fixture = game('Breloom CSVH1C', ['Grass Energy SVE']);
    useAttack(fixture.store, fixture.state, 0, 'Mach Straight');
    expect(getDamage(fixture.state, 1)).toBe(60);
  });
});
