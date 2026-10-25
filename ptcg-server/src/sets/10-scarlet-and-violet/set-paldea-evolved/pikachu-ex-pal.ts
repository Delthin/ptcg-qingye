import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, DISCARD_ALL_ENERGY_FROM_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Pikachuex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 190;
  public weakness = [{ type: F }];
  public retreat = [];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Pika Punch',
      cost: [C],
      damage: 30,
      text: ''
    },
    {
      name: 'Dynamic Bolt',
      cost: [L, L, C],
      damage: 220,
      text: 'Flip a coin. If tails, discard all Energy from this Pokémon.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '63';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pikachu ex';
  public fullName: string = 'Pikachu ex PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const attackEffect = effect;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          DISCARD_ALL_ENERGY_FROM_POKEMON(store, state, attackEffect, this);
        }
      });
    }
    return state;
  }
}
