import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Tinkaton extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Tinkatuff';
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Crushing Blow',
      cost: [P],
      damage: 30,
      text: 'Discard an Energy from your opponent\'s Active Pokémon.',
    },
    {
      name: 'Alloyed Hammer',
      cost: [P],
      damage: 60,
      damageCalculation: '+',
      text: 'If this Pokémon has any Metal Energy attached, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '85';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tinkaton';
  public fullName: string = 'Tinkaton PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect = effect;
      const player = effect.player;

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() !== this) {
          return;
        }

        const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, cardList);
        state = store.reduceEffect(state, checkProvidedEnergy);

        const hasMetalEnergy = checkProvidedEnergy.energyMap
          .some(energy => energy.provides.includes(CardType.METAL));

        if (hasMetalEnergy) {
          THIS_ATTACK_DOES_X_MORE_DAMAGE(attackEffect, store, state, 120);
        }
      });
    }

    return state;
  }
}
