import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Palossand extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Sandygast';
  public cardType: CardType[] = [P];
  public hp: number = 150;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Spooky Shot',
      cost: [P, C],
      damage: 40,
      text: '',
    },
    {
      name: 'Earthen Power',
      cost: [P, C, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If you have a Stadium in play, this attack does 80 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '96';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Palossand';
  public fullName: string = 'Palossand PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      // "If you have a Stadium in play" — the Stadium in play owned by this player's side.
      const hasStadiumInPlay = player.stadium.cards.length > 0;

      if (hasStadiumInPlay) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 80);
      }
    }

    return state;
  }
}
