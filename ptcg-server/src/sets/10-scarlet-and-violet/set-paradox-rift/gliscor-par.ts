import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_POISON_TO_PLAYER_ACTIVE, COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Gliscor extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Gligar';
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Pierce',
      cost: [C],
      damage: 40,
      text: ''
    },
    {
      name: 'Toxic Sting',
      cost: [C, C, C],
      damage: 80,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Poisoned. During Pokémon Checkup, put 2 damage counters on that Pokémon instead of 1.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '92';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gliscor';
  public fullName: string = 'Gliscor PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this, 20);
        }
      });
    }
    return state;
  }
}
