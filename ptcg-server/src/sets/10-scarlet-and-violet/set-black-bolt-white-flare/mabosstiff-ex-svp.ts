import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_DOES_LESS_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Mabosstiffex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Maschiff';
  public cardType: CardType[] = [D];
  public hp: number = 260;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Daunt',
      cost: [C, C],
      damage: 30,
      text: 'During your opponent\'s next turn, attacks used by the Defending Pokémon do 50 less damage (before applying Weakness and Resistance).',
    },
    {
      name: 'Proud Fangs',
      cost: [D, C, C],
      damage: 100,
      damageCalculation: '+',
      text: 'If your Benched Pokémon have any damage counters on them, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '86';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mabosstiff ex';
  public fullName: string = 'Mabosstiff ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Daunt
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_DOES_LESS_DAMAGE(store, state, effect, this, 50);
    }

    // Proud Fangs
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const benchedHasDamageCounters = player.bench.some(bench => bench.cards.length > 0 && bench.damage > 0);

      if (benchedHasDamageCounters) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }

    return state;
  }
}
