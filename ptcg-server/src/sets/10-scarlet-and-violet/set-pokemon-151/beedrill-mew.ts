import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED,
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_POISIONED,
} from '../../../game/store/prefabs/attack-effects';

export class Beedrill extends PokemonCard {
  public stage = Stage.STAGE_2;
  public evolvesFrom = 'Kakuna';
  public cardType: CardType[] = [G];
  public hp = 130;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Nadir Needle',
      cost: [C, C],
      damage: 30,
      damageCalculation: '+',
      text: 'If you have no cards in your hand, this attack does 120 more damage, ' +
        'and your opponent\'s Active Pokémon is now Paralyzed and Poisoned.'
    },
    {
      name: 'Pierce',
      cost: [G, G],
      damage: 110,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber = '15';
  public name = 'Beedrill';
  public fullName = 'Beedrill MEW';

  reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Nadir Needle
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.hand.cards.length === 0) {
        effect.damage += 120;
        YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, effect);
        YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_POISIONED(store, state, effect);
      }
    }

    // Attack 2: Pierce is vanilla damage handled by the attack pipeline.
    return state;
  }
}
