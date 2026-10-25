import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED } from '../../../game/store/prefabs/attack-effects';

export class Togedemaru extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 80;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Electrifying Chance',
    cost: [L],
    damage: 30,
    text: 'If you have exactly 1 Prize card remaining, your opponent\'s Active Pokémon is now Paralyzed.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Togedemaru';
  public fullName: string = 'Togedemaru SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // 剩余的奖赏卡：未被取走的奖赏卡槽
      const prizesRemaining = player.prizes.filter(prize => prize.cards.length > 0).length;

      if (prizesRemaining === 1) {
        YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, effect);
      }
    }

    return state;
  }
}
