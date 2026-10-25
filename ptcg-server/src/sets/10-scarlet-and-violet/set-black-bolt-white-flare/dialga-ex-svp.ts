import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { DRAW_CARDS, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Dialgaex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 220;
  public weakness = [{ type: R }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Time Bellow',
      cost: [M],
      damage: 20,
      text: 'Draw a card.',
    },
    {
      name: 'Metal Blast',
      cost: [C, C, C],
      damage: 100,
      damageCalculation: '+',
      text: 'This attack does 20 more damage for each [M] Energy attached to this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '180';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dialga ex';
  public fullName: string = 'Dialga ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DRAW_CARDS(store, state, effect.player, 1);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, player.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const metalEnergy = checkProvidedEnergy.energyMap
        .filter(energy => energy.provides.includes(M)).length;

      THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 20 * metalEnergy);
    }

    return state;
  }
}
