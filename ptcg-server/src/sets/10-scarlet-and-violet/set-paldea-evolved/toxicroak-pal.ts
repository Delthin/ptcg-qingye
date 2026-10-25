import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_POISIONED } from '../../../game/store/prefabs/attack-effects';

export class Toxicroak extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Croagunk';
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Pierce',
      cost: [F],
      damage: 30,
      text: '',
    },
    {
      name: 'Knuckle Claws',
      cost: [F, C],
      damage: 60,
      text: 'Your opponent\'s Active Pokémon is now Poisoned.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '115';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Toxicroak';
  public fullName: string = 'Toxicroak PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_POISIONED(store, state, effect);
    }
    return state;
  }
}
