import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { JUST_EVOLVED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { MEGA_EVOLUTION_END_TURN } from '../../../game/store/prefabs/tool-prefabs';

export class MGardevoirEX extends PokemonCard {
  public stage: Stage = Stage.MEGA;
  public evolvesFrom = 'Gardevoir-EX';
  public cardType: CardType[] = [Y];
  public hp: number = 210;
  public weakness = [{ type: M }];
  public resistance = [{ type: D, value: -20 }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_EX];

  public attacks = [{
    name: 'Brilliant Arrow',
    cost: [Y, C, C],
    damage: 30,
    damageCalculation: 'x',
    text: 'This attack does 30 damage times the number of Fairy Energy attached to all of your Pokémon.',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '106';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'M Gardevoir-EX';
  public fullName: string = 'M Gardevoir-EX 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Mega Evolution Rule: when this Pokémon becomes a Mega Evolution Pokémon, your turn ends.
    if (JUST_EVOLVED(effect, this)) {
      MEGA_EVOLUTION_END_TURN(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      let fairyEnergyCount = 0;

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, cardList);
        state = store.reduceEffect(state, checkProvidedEnergy);

        checkProvidedEnergy.energyMap.forEach(energy => {
          if (energy.provides.includes(CardType.FAIRY)) {
            fairyEnergyCount += 1;
          }
        });
      });

      effect.damage = 30 * fairyEnergyCount;
    }

    return state;
  }
}
