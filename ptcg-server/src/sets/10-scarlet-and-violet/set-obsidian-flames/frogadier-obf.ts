import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SWITCH_ACTIVE_WITH_BENCHED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Frogadier extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Froakie';
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Strafe',
    cost: [W, W],
    damage: 40,
    text: 'You may switch this Pokémon with 1 of your Benched Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '57';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Frogadier';
  public fullName: string = 'Frogadier OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const hasBench = player.bench.some(b => b.cards.length > 0);

      if (hasBench) {
        state = SWITCH_ACTIVE_WITH_BENCHED(store, state, player) ?? state;
      }
    }
    return state;
  }
}
