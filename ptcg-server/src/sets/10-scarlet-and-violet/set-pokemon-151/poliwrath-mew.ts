import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE,
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED,
} from '../../../game/store/prefabs/attack-effects';

export class Poliwrath extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Poliwhirl';
  public cardType: CardType[] = [W];
  public hp: number = 160;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Bubble Beam',
    cost: [W],
    damage: 50,
    text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.'
  }, {
    name: 'Heroic Punch',
    cost: [W, C, C],
    damage: 100,
    damageCalculation: '+',
    text: 'Flip a coin. If heads, this attack does 150 more damage.'
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '62';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Poliwrath';
  public fullName: string = 'Poliwrath MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, effect);
        }
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 150);
    }

    return state;
  }
}
