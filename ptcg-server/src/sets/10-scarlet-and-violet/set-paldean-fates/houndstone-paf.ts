import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Houndstone extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Greavard';
  public cardType: CardType[] = [P];
  public hp: number = 140;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Last Respects',
    cost: [P, P],
    damage: 80,
    damageCalculation: '+',
    text: 'This attack does 10 more damage for each Psychic Pokémon in your discard pile.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '168';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndstone';
  public fullName: string = 'Houndstone PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const psychicPokemonInDiscard = player.discard.cards.filter(card =>
        card instanceof PokemonCard && card.cardType.includes(CardType.PSYCHIC)
      ).length;

      if (psychicPokemonInDiscard > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 10 * psychicPokemonInDiscard);
      }
    }
    return state;
  }
}
