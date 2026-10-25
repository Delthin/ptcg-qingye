import { AbstractAttackEffect } from '../../../game/store/effects/attack-effects';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { PlayerType, PowerType, StateUtils } from '../../..';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { IS_POKEBODY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Cloyster extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Shelder';
  public cardType: CardType[] = [F];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public retreat = [C];

  public powers = [
    {
      name: 'Solid Shell',
      powerType: PowerType.POKEBODY,
      text: "Prevent all effects of attacks, including damage, done by your opponent's Pokémon to each of your Benched Pokémon that has delta on its card.",
    },
  ];

  public attacks = [
    {
      name: 'Grind',
      cost: [F],
      damage: 10,
      damageCalculation: '+',
      text: 'Does 10 damage plus 10 more damage for each Energy attached to Cloyster.',
    },
  ];

  public set: string = 'DF';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '14';
  public name: string = 'Cloyster';
  public fullName: string = 'Cloyster DF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, player.active);
      store.reduceEffect(state, checkProvidedEnergy);

      const damagePerEnergy = 10;
      effect.damage += checkProvidedEnergy.energyMap.length * damagePerEnergy;
    }

    if (effect instanceof AbstractAttackEffect) {
      const owner = StateUtils.findOwner(state, effect.target);
      if (owner === effect.player || effect.target === owner.active || !effect.target.getPokemonCard()?.hasTag(CardTag.DELTA_SPECIES)) return state;
      let inPlay = false;
      owner.forEachPokemon(PlayerType.BOTTOM_PLAYER, (_list, card) => { if (card === this) inPlay = true; });
      if (!inPlay || IS_POKEBODY_BLOCKED(store, state, owner, this)) return state;
      effect.preventDefault = true;
    }
    return state;
  }
}
