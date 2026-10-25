import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { StoreLike, State, SlotType, PlayerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ATTACH_ENERGY_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Lycanroc extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rockruff';
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Turbo Edge',
    cost: [C],
    damage: 50,
    text: 'Attach up to 2 Basic [F] Energy cards from your discard pile to your Benched Pokémon in any way you like.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '90';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lycanroc';
  public fullName: string = 'Lycanroc TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = ATTACH_ENERGY_PROMPT(store, state, player, PlayerType.BOTTOM_PLAYER, SlotType.DISCARD,
        [SlotType.BENCH], { energyType: EnergyType.BASIC, name: 'Fighting Energy' },
        { min: 0, max: 2, allowCancel: false });
    }

    return state;
  }
}
