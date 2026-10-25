import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DealDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Carracosta extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Tirtouga';
  public cardType: CardType[] = [W];
  public hp: number = 160;
  public weakness = [{ type: L }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Primal Knowledge',
    powerType: PowerType.ABILITY,
    text: 'Attacks used by your Pokémon do 30 more damage to your opponent\'s Active Evolution Pokémon (before applying Weakness and Resistance).'
  }];

  public attacks = [{
    name: 'Tidal Wave',
    cost: [W, W],
    damage: 150,
    text: ''
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '38';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Carracosta';
  public fullName: string = 'Carracosta SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DealDamageEffect) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      // Only attacks that damage the opponent's Active Pokémon qualify.
      const target = effect.target;
      if (target === undefined || target !== opponent.active) {
        return state;
      }

      // "Evolution Pokémon": anything that is not a Basic Pokémon.
      const targetCard = target.getPokemonCard();
      if (targetCard === undefined || targetCard.stage === Stage.BASIC) {
        return state;
      }

      // This Pokémon must be in play on the attacking player's side (Active or Bench).
      let carracostaInPlay = false;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() === this) {
          carracostaInPlay = true;
        }
      });
      if (!carracostaInPlay) {
        return state;
      }

      // Check to see if anything is blocking our Ability.
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      effect.damage += 30;
    }

    return state;
  }
}
