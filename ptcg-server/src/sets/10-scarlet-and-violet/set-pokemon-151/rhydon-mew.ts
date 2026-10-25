import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HAS_MARKER, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

const GIOVANNIS_CHARISMA_MARKER = 'PLAYED_GIOVANNIS_CHARISMA_THIS_TURN';

export class Rhydon extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rhyhorn';
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Wrack Down',
      cost: [F, C],
      damage: 30,
      text: '',
    },
    {
      name: 'Charismatic Drill',
      cost: [F, F, C],
      damage: 40,
      damageCalculation: '+',
      text: 'If you played Giovanni\'s Charisma from your hand during this turn, this attack does 140 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '112';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rhydon';
  public fullName: string = 'Rhydon MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      if (HAS_MARKER(GIOVANNIS_CHARISMA_MARKER, player)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 140);
      }
    }

    return state;
  }
}
