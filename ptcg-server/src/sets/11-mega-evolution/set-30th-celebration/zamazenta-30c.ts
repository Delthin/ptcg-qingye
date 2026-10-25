import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';
import { THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Zamazenta extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Fend Off',
      cost: [M],
      damage: 20,
      text: 'Before doing damage, discard all Pokémon Tools from your opponent\'s Active Pokémon.'
    },
    {
      name: 'Shield Press',
      cost: [M, M, C],
      damage: 100,
      text: 'During your opponent\'s next turn, this Pokémon takes 50 less damage from attacks (after applying Weakness and Resistance).'
    }
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '107';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zamazenta';
  public fullName: string = 'Zamazenta 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Fend Off: discard all Pokémon Tools from the opponent's Active Pokémon before damage
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const tools = opponent.active.tools.slice();

      if (tools.length > 0) {
        state = MOVE_CARDS(store, state, opponent.active, opponent.discard, { cards: tools });
      }
    }

    // Shield Press: this Pokémon takes 50 less damage from attacks during the opponent's next turn
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = THIS_POKEMON_TAKES_LESS_DAMAGE_FROM_ATTACKS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, 50);
    }

    return state;
  }
}
