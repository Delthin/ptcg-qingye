import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_TOP_X_CARDS_FROM_YOUR_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Quagsire extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Wooper';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Rollout',
      cost: [W],
      damage: 30,
      text: '',
    },
    {
      name: 'Drenched Headbutt',
      cost: [W, C, C],
      damage: 80,
      damageCalculation: 'x',
      text: 'Discard the top 3 cards of your deck, and this attack does 80 damage for each Energy card you discarded in this way.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '156';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Quagsire';
  public fullName: string = 'Quagsire SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const cardsInDiscardBefore = player.discard.cards.slice();
      state = DISCARD_TOP_X_CARDS_FROM_YOUR_DECK(store, state, player, 3, this, effect);

      const discardedInThisWay = player.discard.cards.filter(card => !cardsInDiscardBefore.includes(card));
      const energyDiscarded = discardedInThisWay.filter(card => card instanceof EnergyCard).length;

      effect.damage = 80 * energyDiscarded;
    }
    return state;
  }
}
