import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { FLIP_UNTIL_TAILS_AND_COUNT_HEADS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Lugiaex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 220;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [{
    name: 'Hyper Whirlpool',
    cost: [C, C, C],
    damage: 140,
    text: 'Flip a coin until you get tails. For each heads, discard an Energy from your opponent\'s Active Pokémon.'
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '82';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lugia ex';
  public fullName: string = 'Lugia ex PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      const player = effect.player;

      state = FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store, state, player, heads => {
        if (heads > 0) {
          DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, attackEffect, undefined, heads);
        }
      });
    }
    return state;
  }
}
