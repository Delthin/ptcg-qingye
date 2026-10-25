import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Orbeetle extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Dottler';
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Satellite Beam',
      cost: [G],
      damage: 30,
      damageCalculation: 'x' as const,
      text: 'This attack does 30 damage for each Energy card in your opponent\'s discard pile.',
    },
    {
      name: 'Brain Shake',
      cost: [C, C],
      damage: 100,
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '12';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Orbeetle';
  public fullName: string = 'Orbeetle PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const energyCards = opponent.discard.cards
        .filter(card => card.superType === SuperType.ENERGY).length;
      effect.damage = 30 * energyCards;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    return state;
  }
}
