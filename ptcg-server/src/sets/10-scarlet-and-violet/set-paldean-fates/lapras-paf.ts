import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  PUT_X_CARDS_FROM_YOUR_DISCARD_PILE_INTO_YOUR_HAND,
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED,
} from '../../../game/store/prefabs/attack-effects';

export class Lapras extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Into the Deep',
      cost: [C],
      damage: 0,
      text: 'Put up to 3 Basic Energy cards from your discard pile into your hand.',
    },
    {
      name: 'Freeze-Dry',
      cost: [W, C],
      damage: 50,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '16';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lapras';
  public fullName: string = 'Lapras PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      PUT_X_CARDS_FROM_YOUR_DISCARD_PILE_INTO_YOUR_HAND(
        3,
        card => card instanceof EnergyCard && card.energyType === EnergyType.BASIC,
        store,
        state,
        effect,
      );
      return state;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect: AttackEffect = effect;
      const player = effect.player;
      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, attackEffect);
        }
      });
    }

    return state;
  }
}
