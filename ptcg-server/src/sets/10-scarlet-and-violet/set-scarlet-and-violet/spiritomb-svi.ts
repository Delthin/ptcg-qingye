import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MULTIPLE_COIN_FLIPS_PROMPT,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Spiritomb extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Taunt',
      cost: [D],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot.',
    },
    {
      name: 'Doom Decree',
      cost: [D, D],
      damage: 0,
      text: 'Flip 2 coins. If both of them are heads, your opponent\'s Active Pokémon is Knocked Out.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '129';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Spiritomb';
  public fullName: string = 'Spiritomb SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Taunt: switch in 1 of your opponent's Benched Pokemon to the Active Spot.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const hasBenchedPokemon = opponent.bench.some(bench => bench.cards.length > 0);

      if (hasBenchedPokemon) {
        state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, effect.player);
      }
    }

    // Doom Decree: flip 2 coins; if both are heads, the opponent's Active Pokemon is Knocked Out.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect = effect;
      const player = effect.player;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        if (results.every(result => result)) {
          state = KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON(store, state, attackEffect);
        }
      });
    }

    return state;
  }
}
