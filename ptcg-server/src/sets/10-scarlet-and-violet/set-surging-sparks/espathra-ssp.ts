import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DEVOLVE_POKEMON,
  HEAL_X_DAMAGE_FROM_THIS_POKEMON,
  SELECT_PROMPT,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Espathra extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Flittle';
  public cardType: CardType[] = [P];
  public hp: number = 120;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Mystical Eyes',
      cost: [C],
      damage: 0,
      text: 'Devolve 1 of your opponent\'s evolved Pokémon by putting the highest Stage Evolution card on it into your opponent\'s hand.',
    },
    {
      name: 'Spiral Drain',
      cost: [P, C],
      damage: 60,
      text: 'Heal 30 damage from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '95';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Espathra';
  public fullName: string = 'Espathra SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Mystical Eyes: devolve 1 of your opponent's evolved Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const candidates = [opponent.active, ...opponent.bench].filter(pokemon => {
        const card = pokemon.getPokemonCard();
        return card !== undefined && card.stage !== Stage.BASIC;
      });

      if (candidates.length === 0) {
        return state;
      }

      const labels = candidates.map(pokemon => {
        const card = pokemon.getPokemonCard();
        return card !== undefined ? card.name : 'Pokemon';
      });

      state = SELECT_PROMPT(store, state, player, labels, result => {
        if (result >= 0 && result < candidates.length) {
          DEVOLVE_POKEMON(store, state, candidates[result], opponent.hand);
        }
      });
    }

    // Spiral Drain: heal 30 damage from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 30);
    }

    return state;
  }
}
