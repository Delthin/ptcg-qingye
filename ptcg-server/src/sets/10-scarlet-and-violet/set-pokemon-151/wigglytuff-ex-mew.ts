import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag, EnergyType } from '../../../game/store/card/card-types';
import { StoreLike, State, PowerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckHpEffect, CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Wigglytuffex extends PokemonCard {
  public regulationMark = 'G';

  protected _tags = [CardTag.POKEMON_ex];

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Jigglypuff';

  public cardType: CardType[] = [C];

  public hp: number = 250;

  public weakness = [{ type: F }];

  public retreat = [C, C, C];

  public powers = [{
    name: 'Expanding Body',
    powerType: PowerType.ABILITY,
    useWhenInPlay: false,
    text: 'If this Pokémon has any Special Energy attached, it gets +100 HP.'
  }];

  public attacks = [
    {
      name: 'Friend Tackle',
      cost: [C, C, C],
      damage: 90,
      damageCalculation: '+',
      text: 'If you played a Supporter card from your hand during this turn, this attack does 90 more damage.'
    }
  ];

  public set: string = 'MEW';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '40';

  public name: string = 'Wigglytuff ex';

  public fullName: string = 'Wigglytuff ex MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Ability: Expanding Body
    // Ref: set-perfect-order/tyrantrum.ts, set-paldea-evolved/orthworm.ts (CheckHpEffect + Special/Metal Energy bonus)
    if (effect instanceof CheckHpEffect && effect.target.cards.includes(this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const checkEnergy = new CheckProvidedEnergyEffect(player, effect.target);
      store.reduceEffect(state, checkEnergy);

      const hasSpecialEnergy = checkEnergy.energyMap.some(em => em.card.energyType === EnergyType.SPECIAL);

      if (hasSpecialEnergy) {
        effect.hp += 100;
      }
    }

    // Attack: Friend Tackle
    // Ref: set-lost-thunder/virizion-gx.ts (supporterTurn damage bonus)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.supporterTurn > 0) {
        effect.damage += 90;
      }
    }

    return state;
  }
}
