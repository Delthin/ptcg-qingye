import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED } from '../../../game/store/prefabs/attack-effects';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Turtonator extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 130;
  public weakness = [{ type: W }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Ring of Fire',
      cost: [R, C, C],
      damage: 50,
      text: 'Your opponent\'s Active Pokémon is now Burned. During your opponent\'s next turn, that Pokémon can\'t retreat.',
    },
    {
      name: 'Inferno Onrush',
      cost: [R, R, C, C],
      damage: 180,
      text: 'This Pokémon also does 60 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '25';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Turtonator';
  public fullName: string = 'Turtonator SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED(store, state, effect);
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 60);
    }

    return state;
  }
}
