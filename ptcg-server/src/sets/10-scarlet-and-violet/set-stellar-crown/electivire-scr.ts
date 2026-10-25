import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_POKEMON_CANNOT_ATTACK_DURING_YOUR_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Electivire extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Electabuzz';
  public cardType: CardType[] = [L];
  public hp: number = 150;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Electroslug',
      cost: [L],
      damage: 40,
      text: '',
    },
    {
      name: 'Unleash Lightning',
      cost: [L, L],
      damage: 220,
      text: 'During your next turn, your Pokémon can\'t attack. (This includes new Pokémon that come into play.)',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '47';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Electivire';
  public fullName: string = 'Electivire SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = YOUR_POKEMON_CANNOT_ATTACK_DURING_YOUR_NEXT_TURN(store, state, effect, this);
    }

    return state;
  }
}
