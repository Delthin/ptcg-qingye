import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ABILITY_USED, IS_ABILITY_BLOCKED, USE_ABILITY_ONCE_PER_TURN, WAS_POWER_USED
} from '../../../game/store/prefabs/prefabs';

export class Oricorio extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 90;
  public weakness = [{ type: W }];
  public retreat = [C];

  public powers = [{
    name: 'Ardent Dancing',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may heal 20 damage from your Active Evolution Pokémon.'
  }];

  public attacks = [{
    name: 'Flap',
    cost: [R, C],
    damage: 30,
    text: ''
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '33';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Oricorio';
  public fullName: string = 'Oricorio PAL';

  private readonly ARDENT_DANCING_MARKER = 'ARDENT_DANCING_MARKER';
  private readonly HEAL_AMOUNT = 20;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      // Check to see if anything is blocking our Ability
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const active = player.active.getPokemonCard();
      if (active === undefined) {
        return state;
      }

      // Evolution Pokemon only: Basic and Restored Pokemon are not Evolution Pokemon.
      if (active.stage === Stage.BASIC || active.stage === Stage.RESTORED) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, this.ARDENT_DANCING_MARKER, this);

      player.active.damage = Math.max(0, player.active.damage - this.HEAL_AMOUNT);

      ABILITY_USED(player, this);
    }
    return state;
  }
}
