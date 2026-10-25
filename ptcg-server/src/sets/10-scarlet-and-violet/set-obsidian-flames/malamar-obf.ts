import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  IS_ABILITY_BLOCKED, SHOW_CARDS_TO_PLAYER, USE_ABILITY_ONCE_PER_TURN,
  WAS_ATTACK_USED, WAS_POWER_USED
} from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Malamar extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Inkay';
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public powers = [{
    name: 'Psychic Insight',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may look at the top card of your opponent\'s deck. If you do, look at the top card of your deck.',
  }];

  public attacks = [{
    name: 'Hypnotic Ray',
    cost: [D, C, C],
    damage: 90,
    text: 'Your opponent\'s Active Pokémon is now Asleep.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '138';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Malamar';
  public fullName: string = 'Malamar OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'PSYCHIC_INSIGHT', this);

      if (opponent.deck.cards.length > 0) {
        state = SHOW_CARDS_TO_PLAYER(store, state, player, [opponent.deck.cards[0]]);
      }

      if (player.deck.cards.length > 0) {
        state = SHOW_CARDS_TO_PLAYER(store, state, player, [player.deck.cards[0]]);
      }
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    return state;
  }
}
