import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { FLIP_UNTIL_TAILS_AND_COUNT_HEADS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Krookodile extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Krokorok';
  public cardType: CardType[] = [F];
  public hp: number = 170;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Chomp Chomp Bite',
      cost: [F],
      damage: 50,
      text: 'Flip a coin until you get tails. For each heads, discard an Energy from your opponent\'s Active Pokémon.',
    },
    {
      name: 'Earthquake',
      cost: [F, F],
      damage: 180,
      text: 'This attack also does 30 damage to each of your Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '117';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Krookodile';
  public fullName: string = 'Krookodile SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Chomp Chomp Bite: flip until tails, then discard Energy from the opponent's Active Pokémon
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const attackEffect = effect;

      state = FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store, state, player, (heads: number) => {
        if (heads === 0) {
          return;
        }

        DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, attackEffect, undefined, heads);
      });
    }

    // Earthquake: 30 damage to each of your own Benched Pokémon (no Weakness / Resistance on the Bench)
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const benched = player.bench.filter(b => b.cards.length > 0);

      benched.forEach(target => {
        const damageEffect = new PutDamageEffect(effect, 30);
        damageEffect.target = target;
        store.reduceEffect(state, damageEffect);
      });
    }

    return state;
  }
}
