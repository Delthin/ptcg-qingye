import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DealDamageEffect } from '../../../game/store/effects/attack-effects';
import { SWITCH_IN_OPPONENT_BENCHED_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Lampent extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Litwick';
  public cardType: CardType[] = [R];
  public hp: number = 80;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Flare',
      cost: [R],
      damage: 20,
      text: ''
    },
    {
      name: 'Alluring Fireball',
      cost: [R, C],
      damage: 0,
      text: 'Switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. This attack does 30 damage to the new Active Pokémon.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '37';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lampent';
  public fullName: string = 'Lampent OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;
      const benched = opponent.bench.filter(b => b.cards.length > 0);

      // Nothing to switch in: the attack does nothing.
      if (benched.length === 0) {
        return state;
      }

      // Switch in 1 of your opponent's Benched Pokémon to the Active Spot.
      state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, effect.player);

      // This attack does 30 damage to the new Active Pokémon.
      const newActive = opponent.active;
      if (newActive.cards.length > 0) {
        const damageEffect = new DealDamageEffect(effect, 30);
        damageEffect.target = newActive;
        state = store.reduceEffect(state, damageEffect);
      }
    }

    return state;
  }
}
