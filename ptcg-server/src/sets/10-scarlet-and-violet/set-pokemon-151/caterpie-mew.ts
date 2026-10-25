import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { StoreLike, State, StateUtils } from '../../../game';
import { CheckPokemonTypeEffect } from '../../../game/store/effects/check-effects';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Caterpie extends PokemonCard {

  public regulationMark = 'G';

  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.GRASS];
  public hp: number = 50;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS];
  public attacks = [
    {
      name: 'Leaf Munch',
      cost: [CardType.GRASS],
      damage: 10,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is a Grass Pokémon, this attack does 30 more damage.',
    }
  ];
  public set: string = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '10';
  public name: string = 'Caterpie';
  public fullName: string = 'Caterpie MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Leaf Munch: If the opponent's Active Pokémon is a Grass Pokémon, +30 damage.
    // Ref: set-x-and-y/weedle.ts (Leaf Munch) / set-sun-and-moon/spearow.ts (Peck Bugs)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const checkType = new CheckPokemonTypeEffect(opponent.active);
      store.reduceEffect(state, checkType);

      if (checkType.cardTypes.includes(CardType.GRASS)) {
        effect.damage += 30;
      }
    }

    return state;
  }

}
