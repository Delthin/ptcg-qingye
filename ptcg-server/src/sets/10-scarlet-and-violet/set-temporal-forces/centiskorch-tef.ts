import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED } from '../../../game/store/prefabs/attack-effects';

export class Centiskorch extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Sizzlipede';
  public cardType: CardType[] = [R];
  public hp: number = 140;
  public weakness = [{ type: W }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Singe',
      cost: [R],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Burned.',
    },
    {
      name: 'Charring Breath',
      cost: [R, R],
      damage: 180,
      text: 'If your opponent\'s Active Pokémon isn\'t Burned, this attack does nothing.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '37';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Centiskorch';
  public fullName: string = 'Centiskorch TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      // "If your opponent's Active Pokémon isn't Burned, this attack does nothing."
      if (!effect.opponent.active.specialConditions.includes(SpecialCondition.BURNED)) {
        effect.damage = 0;
      }
    }

    return state;
  }
}
