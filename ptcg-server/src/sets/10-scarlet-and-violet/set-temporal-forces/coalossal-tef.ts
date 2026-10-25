import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import {
  DISCARD_TOP_X_OF_OPPONENTS_DECK,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Coalossal extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Carkol';
  public cardType: CardType[] = [F];
  public hp: number = 180;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Gatling Tar',
      cost: [F],
      damage: 40,
      damageCalculation: '+',
      text: 'This attack does 80 more damage for each Fire Energy attached to this Pokémon.',
    },
    {
      name: 'Cragalanche',
      cost: [F, C, C, C],
      damage: 150,
      text: 'Discard the top 2 cards of your opponent\'s deck.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '95';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Coalossal';
  public fullName: string = 'Coalossal TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      let fireEnergyCount = 0;

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() !== this) {
          return;
        }

        const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, cardList);
        state = store.reduceEffect(state, checkProvidedEnergy);

        checkProvidedEnergy.energyMap.forEach(energy => {
          if (energy.provides.includes(CardType.FIRE)) {
            fireEnergyCount += 1;
          }
        });
      });

      if (fireEnergyCount > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 80 * fireEnergyCount);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      DISCARD_TOP_X_OF_OPPONENTS_DECK(store, state, effect.player, 2, this, effect);
    }

    return state;
  }
}
