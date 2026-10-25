import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';
import { PREVENT_EFFECTS_OF_ATTACKS } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Bronzong extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Bronzor';
  public cardType: CardType[] = [M];
  public hp: number = 140;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Oracle Press',
      cost: [M],
      damage: 20,
      text: 'During your opponent\'s next turn, prevent all effects of attacks used by your opponent\'s Pokémon done to this Pokémon. (Damage is not an effect.)'
    },
    {
      name: 'Extrasensory',
      cost: [M, M],
      damage: 70,
      damageCalculation: '+' as const,
      text: 'If you have the same number of cards in your hand as your opponent, this attack does 90 more damage.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '145';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bronzong';
  public fullName: string = 'Bronzong OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PREVENT_EFFECTS_OF_ATTACKS(store, state, effect, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      if (player.hand.cards.length === opponent.hand.cards.length) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }
    }

    return state;
  }
}
