import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Heatmor extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 110;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Live Coal',
      cost: [R],
      damage: 20,
      text: '',
    },
    {
      name: 'Licking Flames',
      cost: [R, R, C],
      damage: 130,
      text: 'Flip 3 coins. For each tails, discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '31';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Heatmor';
  public fullName: string = 'Heatmor TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const attackEffect = effect;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const tails = results.filter(result => !result).length;

        if (tails === 0) {
          return;
        }

        DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(
          store, state, attackEffect, tails, {}, tails
        );
      });
    }

    return state;
  }
}
