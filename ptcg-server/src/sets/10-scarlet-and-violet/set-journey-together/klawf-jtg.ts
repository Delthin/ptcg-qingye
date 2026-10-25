import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Klawf extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Snipping Pincers',
      cost: [C, C],
      damage: 0,
      text: 'Flip 2 coins. For each heads, discard an Energy from your opponent\'s Active Pokémon.',
    },
    {
      name: 'Hammer In',
      cost: [F, C, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '90';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Klawf';
  public fullName: string = 'Klawf JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      const player = attackEffect.player;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;

        if (heads === 0) {
          return;
        }

        DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, attackEffect, undefined, heads);
      });
    }

    return state;
  }
}
