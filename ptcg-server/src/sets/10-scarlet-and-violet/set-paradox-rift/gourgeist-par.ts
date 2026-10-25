import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED, MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Gourgeist extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Pumpkaboo';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public powers = [{
    name: 'Startling Pumpkin',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is Knocked Out by damage from an attack from your opponent\'s Pokémon, discard 2 random cards from your opponent\'s hand.',
  }];

  public attacks = [{
    name: 'Shadow Bind',
    cost: [P, C, C],
    damage: 100,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '78';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gourgeist';
  public fullName: string = 'Gourgeist PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    if (effect instanceof AfterDamageEffect && effect.target.getPokemonCard() === this) {
      const target = effect.target;
      const player = StateUtils.findOwner(state, target);

      // Startling Pumpkin
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // Only triggers when this Pokémon is Knocked Out by the damage it just took.
      if (target.damage >= this.hp) {
        const opponent = StateUtils.getOpponent(state, player);

        for (let i = 0; i < 2; i++) {
          const hand = opponent.hand.cards;

          if (hand.length === 0) {
            break;
          }

          const randomIndex = Math.floor(Math.random() * hand.length);

          state = MOVE_CARDS(store, state, opponent.hand, opponent.discard, {
            cards: [hand[randomIndex]],
            sourceCard: this,
          });
        }
      }
    }

    return state;
  }
}
