import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DEVOLVE_DEFENDING_AFTER_ATTACK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Aerodactyl extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Antique Old Amber';
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat: CardType[] = [];

  public attacks = [
    {
      name: 'Glide',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Devolution Ray',
      cost: [C, C],
      damage: 100,
      text: 'If your opponent\'s Active Pokémon is an evolved Pokémon, devolve it by putting the highest Stage Evolution card on it into your opponent\'s hand.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '142';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Aerodactyl';
  public fullName: string = 'Aerodactyl MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DEVOLVE_DEFENDING_AFTER_ATTACK(store, state, effect, 1, this);
    }
    return state;
  }
}
