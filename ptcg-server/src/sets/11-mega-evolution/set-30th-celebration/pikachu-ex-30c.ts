import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag, SuperType, EnergyType } from '../../../game/store/card/card-types';
import { PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_ENERGY_PROMPT,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Pikachuex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.LIGHTNING];
  public hp: number = 190;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Zip-Zap Frenzy',
      cost: [CardType.LIGHTNING],
      damage: 0,
      text: 'You may attach any number of Basic Energy cards from your hand to your Pokémon in any way you like.'
    },
    {
      name: 'Thunder',
      cost: [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS],
      damage: 200,
      text: 'This Pokémon also does 30 damage to itself.'
    }
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pikachu ex';
  public fullName: string = 'Pikachu ex 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Zip-Zap Frenzy: optionally attach any number of Basic Energy cards from
    // your hand to your Pokémon in any way you like.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.HAND,
        [SlotType.ACTIVE, SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
        { min: 0, max: 99, allowCancel: true }
      );
    }

    // Thunder: this Pokémon also does 30 damage to itself.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
