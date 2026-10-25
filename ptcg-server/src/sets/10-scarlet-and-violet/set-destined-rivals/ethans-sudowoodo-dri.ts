import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';
import { COPY_OPPONENT_ACTIVE_ATTACK } from '../../../game/store/prefabs/attack-effects';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class EthansSudowoodo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 110;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Impound',
      cost: [F],
      damage: 20,
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.'
    },
    {
      name: 'Try to Imitate',
      cost: [C, C],
      damage: 0,
      text: 'Flip a coin. If heads, choose 1 of your opponent\'s Active Pokémon\'s attacks and use it as this attack.'
    }
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '93';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ethan\'s Sudowoodo';
  public fullName: string = 'Ethan\'s Sudowoodo DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          state = COPY_OPPONENT_ACTIVE_ATTACK(store, state, effect);
        }
      });
    }

    return state;
  }
}
