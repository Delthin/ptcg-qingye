import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Floette extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Flabébé';
  public cardType: CardType[] = [CardType.PSYCHIC];
  public hp: number = 70;
  public weakness = [{ type: CardType.METAL }];
  public retreat = [CardType.COLORLESS];

  public attacks = [{
    name: 'Magical Leaf',
    cost: [CardType.PSYCHIC, CardType.COLORLESS],
    damage: 30,
    damageCalculation: '+' as const,
    text: 'Flip a coin. If heads, this attack does 30 more damage, and heal 30 damage from this Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '92';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Floette';
  public fullName: string = 'Floette SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }
        effect.damage += 30;
        HEAL_X_DAMAGE_FROM_THIS_POKEMON(30, effect, store, state);
      });
    }
    return state;
  }
}
