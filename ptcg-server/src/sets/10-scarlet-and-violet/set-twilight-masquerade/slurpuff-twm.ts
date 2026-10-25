import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_CONFUSION_TO_PLAYER_ACTIVE, MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Slurpuff extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Swirlix';
  public cardType: CardType[] = [P];
  public hp: number = 120;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Slurp Slurp',
    cost: [P, C],
    damage: 90,
    damageCalculation: 'x',
    text: 'Flip 2 coins. This attack does 90 damage for each heads. If both of them are tails, your opponent\'s Active Pokémon is now Confused.',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '90';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slurpuff';
  public fullName: string = 'Slurpuff TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;

        effect.damage = 90 * heads;

        if (heads === 0) {
          ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, opponent, this);
        }
      });
    }
    return state;
  }
}
