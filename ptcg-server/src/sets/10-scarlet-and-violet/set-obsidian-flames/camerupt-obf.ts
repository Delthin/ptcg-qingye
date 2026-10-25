import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { MOVE_CARDS, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Camerupt extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Numel';
  public cardType: CardType[] = [R];
  public hp: number = 140;
  public weakness = [{ type: W }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Eruption',
      cost: [R, C],
      damage: 50,
      damageCalculation: '+',
      text: 'Discard the top card of each player\'s deck. This attack does 100 more damage for each Energy card discarded in this way.',
    },
    {
      name: 'Steaming Stomp',
      cost: [R, R, C],
      damage: 120,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '32';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Camerupt';
  public fullName: string = 'Camerupt OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      let discardedEnergy = 0;

      for (const deckOwner of [player, opponent]) {
        if (deckOwner.deck.cards.length === 0) {
          continue;
        }

        const topCard = deckOwner.deck.cards[0];

        if (topCard instanceof EnergyCard) {
          discardedEnergy += 1;
        }

        state = MOVE_CARDS(store, state, deckOwner.deck, deckOwner.discard, {
          cards: [topCard],
          sourceCard: this,
          sourceEffect: effect,
        });
      }

      if (discardedEnergy > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 100 * discardedEnergy);
      }
    }

    return state;
  }
}
