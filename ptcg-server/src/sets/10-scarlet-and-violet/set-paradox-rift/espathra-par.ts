import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import {
  ADD_MARKER,
  CONFIRMATION_PROMPT,
  HAS_CARD_IN_DISCARD,
  HAS_MARKER,
  IS_ABILITY_BLOCKED,
  JUST_EVOLVED,
  REMOVE_MARKER,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

const STANCE_MARKER = 'STANCE_MARKER';
const TULIP = 'Tulip';

export class Espathra extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Flittle';
  public cardType: CardType[] = [P];
  public hp: number = 120;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public powers = [{
    name: 'Stance',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may prevent all damage from and effects of attacks from your opponent\'s Pokémon done to this Pokémon until the end of your opponent\'s next turn.',
  }];

  public attacks = [{
    name: 'Glittering Eyes',
    cost: [P, P],
    damage: 70,
    damageCalculation: '+',
    text: 'If Tulip is in your discard pile, this attack does 70 more damage.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '81';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Espathra';
  public fullName: string = 'Espathra PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Stance: triggered when this Pokémon is played from hand to evolve.
    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      state = CONFIRMATION_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        ADD_MARKER(STANCE_MARKER, this, this);
      });
    }

    // Stance: prevent damage done to this Pokémon while the marker is active.
    if (effect instanceof PutDamageEffect
      && effect.target?.cards.includes(this)
      && HAS_MARKER(STANCE_MARKER, this, this)) {
      effect.preventDefault = true;
      return state;
    }

    // Stance lasts through the opponent's next turn: the marker is cleared when
    // a turn ends while this Pokémon is on the other side of the table.
    if (effect instanceof EndTurnEffect && HAS_MARKER(STANCE_MARKER, this, this)) {
      const player = effect.player;
      const isOnTurnPlayersSide =
        player.active.cards.includes(this) ||
        player.bench.some(slot => slot.cards.includes(this));

      if (!isOnTurnPlayersSide) {
        REMOVE_MARKER(STANCE_MARKER, this, this);
      }
    }

    // Glittering Eyes
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (HAS_CARD_IN_DISCARD(player, { name: TULIP })) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 70);
      }
    }

    return state;
  }
}
