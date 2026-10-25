import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_CONFUSION_TO_PLAYER_ACTIVE,
  ADD_POISON_TO_PLAYER_ACTIVE,
  FLIP_UNTIL_TAILS_AND_COUNT_HEADS,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Tentacruel extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Tentacool';
  public cardType: CardType[] = [CardType.WATER];
  public hp: number = 120;
  public weakness = [{ type: CardType.LIGHTNING }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Poisonous Whip',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Poisoned.'
    },
    {
      name: 'Tentacular Panic',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: 90,
      damageCalculation: 'x',
      text: 'Flip a coin until you get tails. This attack does 90 damage for each heads. ' +
        'If the first flip is tails, your opponent\'s Active Pokémon is now Confused.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '73';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tentacruel';
  public fullName: string = 'Tentacruel MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Poisonous Whip
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_POISON_TO_PLAYER_ACTIVE(store, state, effect.opponent, this);
    }

    // Tentacular Panic
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      state = FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store, state, player, heads => {
        effect.damage = 90 * heads;

        // No heads means the very first flip was tails.
        if (heads === 0) {
          ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, opponent, this);
        }
      });
    }

    return state;
  }
}
