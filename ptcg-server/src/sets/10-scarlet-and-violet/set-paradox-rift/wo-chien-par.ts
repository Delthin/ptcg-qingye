import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_ATTACKS_COST_MORE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class WoChien extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Leaf Bringer',
      cost: [G],
      damage: 0,
      text: 'Attach up to 2 Basic Grass Energy cards from your discard pile to 1 of your Pokémon.',
    },
    {
      name: 'Binding Greed',
      cost: [G, G, G, C],
      damage: 140,
      text: 'During your opponent\'s next turn, attacks used by the Defending Pokémon cost [C][C] more.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '18';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Wo-Chien';
  public fullName: string = 'Wo-Chien PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(store, state, player, 2, CardType.GRASS);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DEFENDING_POKEMON_ATTACKS_COST_MORE(store, state, effect, 2);
    }

    return state;
  }
}
