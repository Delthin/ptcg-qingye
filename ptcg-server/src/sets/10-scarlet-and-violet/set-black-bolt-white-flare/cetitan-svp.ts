import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Cetitan extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Cetoddle';
  public cardType: CardType[] = [W];
  public hp: number = 170;
  public weakness = [{ type: M }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Avalanche',
      cost: [W],
      damage: 30,
      text: 'This attack also does 10 damage to each of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
    {
      name: 'Rolling Slider',
      cost: [W, W, W],
      damage: 100,
      damageCalculation: 'x',
      text: 'Flip 3 coins. This attack does 100 damage for each heads.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '63';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cetitan';
  public fullName: string = 'Cetitan SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const benched = opponent.bench.filter(b => b.cards.length > 0);

      benched.forEach(target => {
        const damageEffect = new PutDamageEffect(effect, 10);
        damageEffect.target = target;
        store.reduceEffect(state, damageEffect);
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 100 * heads;
      });
    }

    return state;
  }
}
