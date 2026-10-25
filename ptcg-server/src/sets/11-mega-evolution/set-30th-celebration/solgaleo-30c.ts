import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType, SuperType } from '../../../game/store/card/card-types';
import { Power, PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  DISCARD_ALL_ENERGY_FROM_POKEMON,
  IS_ABILITY_BLOCKED,
  USE_ABILITY_ONCE_PER_TURN,
  WAS_ATTACK_USED,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class Solgaleo extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public cardType: CardType[] = [CardType.METAL];
  public hp: number = 170;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [{ type: CardType.GRASS, value: -30 }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers: Power[] = [{
    name: 'Sunrise',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, if this Pokémon is on your Bench, you may use this Ability. Search your deck for up to 2 Basic Metal Energy cards and attach them to this Pokémon. Then, shuffle your deck.',
    useFromBench: true,
  } as Power];

  public attacks = [{
    name: 'Sunsteel Strike',
    cost: [CardType.METAL, CardType.METAL, CardType.COLORLESS, CardType.COLORLESS],
    damage: 220,
    text: 'Discard all Energy from this Pokémon.',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '105';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Solgaleo';
  public fullName: string = 'Solgaleo 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // 特性「日出」：备战区才能发动，每回合 1 次，从牌库找最多 2 张基本【钢】能量附着到自己身上
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const isOnBench = player.bench.some(bench => bench.getPokemonCard() === this);
      if (!isOnBench) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'SUNRISE', this);

      const basicMetalEnergy = {
        superType: SuperType.ENERGY,
        energyType: EnergyType.BASIC,
        provides: [CardType.METAL],
      };

      state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 1, {
        filter: basicMetalEnergy,
        energyFilter: basicMetalEnergy,
        sourceCard: this,
      } as unknown as Parameters<typeof ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON>[5]);
    }

    // 招式「流星闪冲」：丢弃这只宝可梦身上附着的全部能量
    if (WAS_ATTACK_USED(effect, 0, this)) {
      DISCARD_ALL_ENERGY_FROM_POKEMON(store, state, effect, this);
    }

    return state;
  }
}
