import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Mawile extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 100;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Mischievous Crunch',
    cost: [P],
    damage: 30,
    damageCalculation: 'x',
    text: 'This attack does 30 damage for each Psychic Energy attached to this Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '89';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mawile';
  public fullName: string = 'Mawile OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // 只有出战宝可梦能使用招式，因此 attack 的 user 一定是 player.active
      const cardList = player.active;

      if (cardList.getPokemonCard() !== this) {
        return state;
      }

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, cardList);
      state = store.reduceEffect(state, checkProvidedEnergy);

      let psychicEnergy = 0;
      checkProvidedEnergy.energyMap.forEach(energy => {
        if (energy.provides.includes(CardType.PSYCHIC)) {
          psychicEnergy += 1;
        }
      });

      effect.damage = 30 * psychicEnergy;
    }
    return state;
  }
}
