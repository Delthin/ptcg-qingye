import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { ADD_MARKER, HAS_MARKER, REMOVE_MARKER, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

const COMEUPPANCE_MARKER = 'COMEUPPANCE_MARKER';

export class Mabosstiff extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Maschiff';
  public cardType: CardType[] = [D];
  public hp: number = 140;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Comeuppance',
    cost: [C, C],
    damage: 20,
    text: 'During your opponent\'s next turn, if this Pokémon is damaged by an attack (even if it is Knocked Out), put damage counters on the Attacking Pokémon equal to the damage done to this Pokémon.'
  },
  {
    name: 'Darkness Fang',
    cost: [D, C, C],
    damage: 100,
    text: ''
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '143';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mabosstiff';
  public fullName: string = 'Mabosstiff PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Comeuppance marks this Pokémon, so that it retaliates if it is damaged during the opponent's next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_MARKER(COMEUPPANCE_MARKER, this, this);
    }

    // One of the opponent's Pokémon attacks this Pokémon: put damage counters on the Attacking Pokémon
    // equal to the damage done to this Pokémon (this also happens if this Pokémon is Knocked Out).
    if (effect instanceof AttackEffect
      && effect.target && effect.target.getPokemonCard() === this
      && HAS_MARKER(COMEUPPANCE_MARKER, this, this)) {
      REMOVE_MARKER(COMEUPPANCE_MARKER, this, this);

      const damageDone = effect.damage;
      if (damageDone > 0) {
        const attackingPokemon = effect.player.active;
        const damageEffect = new PutDamageEffect(effect, damageDone);
        damageEffect.target = attackingPokemon;
        store.reduceEffect(state, damageEffect);
      }
    }

    return state;
  }
}
