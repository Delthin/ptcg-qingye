import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Card } from '../../../game/store/card/card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, SlotType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckPokemonTypeEffect } from '../../../game/store/effects/check-effects';
import { ATTACH_ENERGY_PROMPT, IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class IronTreads extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C];

  public powers = [{
    name: 'Dual Core',
    powerType: PowerType.ABILITY,
    text: 'As long as this Pokémon has a Future Booster Energy Capsule attached, it is Fighting and Metal type.',
  }];

  public attacks = [{
    name: 'Wheel Pass',
    cost: [M, C],
    damage: 60,
    text: 'Move an Energy from this Pokémon to 1 of your Benched Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '118';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Iron Treads';
  public fullName: string = 'Iron Treads TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Dual Core
    if (effect instanceof CheckPokemonTypeEffect && effect.target.getPokemonCard() === this) {
      const player = StateUtils.findOwner(state, effect.target);

      if (!IS_ABILITY_BLOCKED(store, state, player, this)) {
        const tools: Card[] = effect.target.tools;
        const hasFutureBooster = tools.some(tool => tool.name === 'Future Booster Energy Capsule');

        if (hasFutureBooster) {
          effect.cardTypes = [CardType.FIGHTING, CardType.METAL];
        }
      }
    }

    // Wheel Pass
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const attachedCards: Card[] = effect.target.cards;
      const hasEnergyAttached = attachedCards.some(card => card.superType === SuperType.ENERGY);
      const hasBenchedPokemon = player.bench.some(bench => bench.cards.length > 0);

      if (hasEnergyAttached && hasBenchedPokemon) {
        state = ATTACH_ENERGY_PROMPT(
          store,
          state,
          player,
          PlayerType.BOTTOM_PLAYER,
          SlotType.ACTIVE,
          [SlotType.BENCH]
        );
      }
    }

    return state;
  }
}
