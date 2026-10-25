import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { StoreLike, State, SlotType, PlayerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_ENERGY_PROMPT,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Skeledirge extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Crocalor';
  public cardType: CardType[] = [R];
  public hp: number = 180;
  public weakness = [{ type: W }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Passionate Singing',
      cost: [R],
      damage: 50,
      text: 'Attach up to 2 Basic Energy cards from your discard pile to your Pokémon in any way you like.'
    },
    {
      name: 'Blazing Shout',
      cost: [R, R, C],
      damage: 190,
      text: 'This Pokémon also does 30 damage to itself.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '38';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Skeledirge';
  public fullName: string = 'Skeledirge SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Passionate Singing: attach up to 2 Basic Energy cards from the discard pile
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = ATTACH_ENERGY_PROMPT(store, state, player, PlayerType.BOTTOM_PLAYER, SlotType.DISCARD,
        [SlotType.ACTIVE, SlotType.BENCH], { energyType: EnergyType.BASIC },
        { min: 0, max: 2, allowCancel: false });
    }

    // Blazing Shout: this Pokémon also does 30 damage to itself
    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
