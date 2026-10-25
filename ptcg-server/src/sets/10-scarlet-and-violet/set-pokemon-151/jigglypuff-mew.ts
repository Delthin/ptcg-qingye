import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike, TrainerCard } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MULTIPLE_COIN_FLIPS_PROMPT,
  SEARCH_DECK_FOR_CARDS_TO_HAND,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Jigglypuff extends PokemonCard {

  public regulationMark = 'G';

  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.COLORLESS];
  public hp: number = 70;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Lead',
      cost: [CardType.COLORLESS],
      damage: 0,
      text: 'Search your deck for a Supporter card, reveal it, and put it into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Stompy Stomp',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 20,
      damageCalculation: 'x',
      text: 'Flip 2 coins. This attack does 20 damage for each heads.',
    },
  ];

  public set: string = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '39';
  public name: string = 'Jigglypuff';
  public fullName: string = 'Jigglypuff MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 1: Lead
    // Ref: set-shrouded-fable/zubat.ts (Lead, SEARCH_DECK_FOR_CARDS_TO_HAND with Supporter filter)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this,
        { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER } as Partial<TrainerCard>,
        { min: 0, max: 1, allowCancel: true }
      );
    }

    // Attack 2: Stompy Stomp
    // Ref: set-crown-zenith/oddish.ts (MULTIPLE_COIN_FLIPS_PROMPT for X damage per heads)
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(r => r).length;
        effect.damage = 20 * heads;
      });
    }

    return state;
  }

}
