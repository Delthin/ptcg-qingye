import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_CANNOT_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Scrafty extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Scraggy';
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Lambaste',
      cost: [C],
      damage: 30,
      text: 'If the Defending Pokémon is a Basic Pokémon, it can\'t attack during your opponent\'s next turn.',
    },
    {
      name: 'Headbang',
      cost: [D, D, C],
      damage: 130,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '61';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Scrafty';
  public fullName: string = 'Scrafty PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const defending = effect.opponent.active.getPokemonCard();

      if (defending !== undefined && defending.stage === Stage.BASIC) {
        state = DEFENDING_POKEMON_CANNOT_ATTACK(store, state, effect, this);
      }
    }

    return state;
  }
}
