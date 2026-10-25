import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';

export class Mudsdale extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Mudbray';
  public cardType: CardType[] = [F];
  public hp: number = 150;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Mud Coat',
    powerType: PowerType.ABILITY,
    text: 'This Pokémon takes 30 less damage from attacks (after applying Weakness and Resistance).'
  }];

  public attacks = [{
    name: 'Heavy Impact',
    cost: [F, F, C],
    damage: 130,
    text: ''
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '108';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mudsdale';
  public fullName: string = 'Mudsdale DRI';

  private readonly MUD_COAT_REDUCTION = 30;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Mud Coat: this Pokemon takes 30 less damage from attacks
    // (the reduction is applied to the damage that actually lands, i.e. after
    // Weakness and Resistance have been folded in).
    if (effect instanceof PutDamageEffect && effect.target !== undefined
      && effect.target.cards.includes(this)) {
      effect.damage = Math.max(0, effect.damage - this.MUD_COAT_REDUCTION);
    }
    return state;
  }
}
