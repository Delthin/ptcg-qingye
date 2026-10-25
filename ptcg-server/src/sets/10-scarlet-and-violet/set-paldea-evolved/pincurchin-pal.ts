import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_MARKER,
  COIN_FLIP_PROMPT,
  HAS_MARKER,
  REMOVE_MARKER,
  REMOVE_MARKER_AT_END_OF_TURN,
  REPLACE_MARKER_AT_END_OF_TURN,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED } from '../../../game/store/prefabs/attack-effects';

const STUN_NEEDLE_THIS_TURN = 'PINCHURCHIN_STUN_NEEDLE_THIS_TURN';
const STUN_NEEDLE_LAST_TURN = 'PINCHURCHIN_STUN_NEEDLE_LAST_TURN';

export class Pincurchin extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Stun Needle',
      cost: [L],
      damage: 20,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.',
    },
    {
      name: 'Follow-Up Kerzap',
      cost: [L],
      damage: 100,
      text: 'You can use this attack only if this Pokémon used Stun Needle during your last turn.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '73';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pincurchin';
  public fullName: string = 'Pincurchin PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const attackEffect = effect;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, attackEffect);
        }
      });

      // Record the use of Stun Needle so that Follow-Up Kerzap becomes
      // available during your next turn ("during your last turn").
      ADD_MARKER(STUN_NEEDLE_THIS_TURN, player, this);
      REPLACE_MARKER_AT_END_OF_TURN(effect, STUN_NEEDLE_THIS_TURN, STUN_NEEDLE_LAST_TURN, this);
      REMOVE_MARKER_AT_END_OF_TURN(effect, STUN_NEEDLE_LAST_TURN, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      if (HAS_MARKER(STUN_NEEDLE_LAST_TURN, player, this)) {
        // The condition is consumed once Follow-Up Kerzap is used.
        REMOVE_MARKER(STUN_NEEDLE_LAST_TURN, player, this);
      } else {
        // Follow-Up Kerzap may only be used if Stun Needle was used during
        // your last turn; the attack does nothing otherwise.
        effect.damage = 0;
      }
    }

    return state;
  }
}
