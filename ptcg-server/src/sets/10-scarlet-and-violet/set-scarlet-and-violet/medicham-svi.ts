import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { OPPONENTS_POKEMON_CANNOT_USE_THAT_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Medicham extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Meditite';
  public cardType: CardType[] = [F];
  public hp: number = 90;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Acu-Punch-Ture',
      cost: [F],
      damage: 30,
      text: 'Choose 1 of your opponent\'s Active Pokémon\'s attacks. During your opponent\'s next turn, that Pokémon can\'t use that attack.',
    },
    {
      name: 'Kick Shot',
      cost: [F],
      damage: 90,
      text: 'Flip a coin. If tails, this attack does nothing.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '111';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Medicham';
  public fullName: string = 'Medicham SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Acu-Punch-Ture: disable one of the opponent's Active Pokemon's attacks next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = OPPONENTS_POKEMON_CANNOT_USE_THAT_ATTACK(store, state, effect, this);
    }

    // Kick Shot: flip a coin; if tails, this attack does nothing.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = COIN_FLIP_PROMPT(store, state, effect.player, result => {
        if (!result) {
          effect.damage = 0;
        }
      });
    }

    return state;
  }
}
