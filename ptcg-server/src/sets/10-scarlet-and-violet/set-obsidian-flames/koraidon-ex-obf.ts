import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Koraidonex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 230;
  public weakness = [{ type: P }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Splitting Beam',
      cost: [F],
      damage: 20,
      text: 'This attack also does 20 damage to 2 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
    {
      name: 'Gaia Press',
      cost: [F, F, C],
      damage: 230,
      text: 'This Pokémon also does 30 damage to itself.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '124';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Koraidon ex';
  public fullName: string = 'Koraidon ex OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Splitting Beam: also 20 damage to 2 of your opponent's Benched Pokémon
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON(
        20, effect, store, state, 2, 2, false, [SlotType.BENCH]
      );
    }

    // Gaia Press: this Pokémon also does 30 damage to itself
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
