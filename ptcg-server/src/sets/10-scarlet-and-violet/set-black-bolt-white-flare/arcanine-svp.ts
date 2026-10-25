import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Arcanine extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Growlithe';
  public cardType: CardType[] = [R];
  public hp: number = 130;
  public weakness = [{ type: W }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Crunch',
      cost: [R, C],
      damage: 30,
      text: 'Flip a coin. If heads, discard an Energy from your opponent\'s Active Pokémon.',
    },
    {
      name: 'Fire Mane',
      cost: [R, R, C],
      damage: 120,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '11';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Arcanine';
  public fullName: string = 'Arcanine SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      state = COIN_FLIP_PROMPT(store, state, attackEffect.player, result => {
        if (result) {
          DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, attackEffect);
        }
      });
    }
    return state;
  }
}
