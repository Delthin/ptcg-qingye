import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State, PowerType, StateUtils } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CONFIRMATION_PROMPT, IS_POKEPOWER_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';
import { putPokemonPowerDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PlayPokemonEffect } from '../../../game/store/effects/play-card-effects';

export class JolteonStar extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  protected _tags = [CardTag.STAR];
  public cardType: CardType[] = [L];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public resistance = [{ type: M, value: -30 }];
  public retreat = [C];

  public powers = [
    {
      name: 'Yellow Ray',
      powerType: PowerType.POKEPOWER,
      text: "Once during your turn, when you put Jolteon Star from your hand onto your Bench, you may put 1 damage counter on each Active Pokémon (both yours and your opponent's).",
    },
  ];

  public attacks = [
    {
      name: 'Agility',
      cost: [L, L, C],
      damage: 40,
      text: "Flip a coin. If heads, prevent all effects of an attack, including damage, done to Jolteon Star during your opponent's next turn.",
    },
  ];

  public set: string = 'PK';
  public name: string = 'Jolteon Star';
  public fullName: string = 'Jolteon Star PK';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '101';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (
      effect instanceof PlayPokemonEffect &&
      effect.pokemonCard === this &&
      !IS_POKEPOWER_BLOCKED(store, state, effect.player, this)
    ) {
      effect.onPlayed.push(() => {
        CONFIRMATION_PROMPT(store, state, effect.player, (result) => {
          if (result) {
            const player = effect.player;
            const opponent = StateUtils.getOpponent(state, player);
            state = putPokemonPowerDamageCounters(store, state, this, opponent.active, 10);
            state = putPokemonPowerDamageCounters(store, state, this, player.active, 10);
          }
        });
      });
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      return FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }

    return state;
  }
}
