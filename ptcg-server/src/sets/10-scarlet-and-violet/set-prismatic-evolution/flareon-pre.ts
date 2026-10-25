import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  COIN_FLIP_PROMPT,
  DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Flareon extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Eevee';
  public cardType: CardType[] = [CardType.FIRE];
  public hp: number = 130;
  public weakness = [{ type: CardType.WATER }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Destructive Flame',
      cost: [CardType.FIRE],
      damage: 30,
      text: 'Flip a coin. If heads, discard an Energy from your opponent\'s Active Pokémon.',
    },
    {
      name: 'Fighting Blaze',
      cost: [CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS],
      damage: 90,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is a Pokémon ex or Pokémon V, this attack does 90 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PRE';
  public setNumber: string = '13';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Flareon';
  public fullName: string = 'Flareon PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const attackEffect = effect;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }
        DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, attackEffect);
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      DEAL_MORE_DAMAGE_IF_OPPONENT_ACTIVE_HAS_CARD_TAG(
        effect, state, 90, CardTag.POKEMON_ex, CardTag.POKEMON_V);
    }

    return state;
  }
}
