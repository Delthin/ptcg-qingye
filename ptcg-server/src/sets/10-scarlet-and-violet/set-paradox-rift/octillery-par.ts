import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  CONFIRMATION_PROMPT, DRAW_CARDS, IS_ABILITY_BLOCKED, JUST_EVOLVED, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Octillery extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Remoraid';
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public powers = [{
    name: 'Suction Cup Draw',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may draw 3 cards.',
  }];

  public attacks = [{
    name: 'Smokescreen Shot',
    cost: [W, C],
    damage: 60,
    text: 'During your opponent\'s next turn, if the Defending Pokémon tries to use an attack, your opponent flips a coin. If tails, that attack doesn\'t happen.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '34';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Octillery';
  public fullName: string = 'Octillery PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Suction Cup Draw: when played from hand to evolve, you may draw 3 cards.
    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      state = CONFIRMATION_PROMPT(store, state, player, result => {
        if (result) {
          state = DRAW_CARDS(store, state, player, 3);
        }
      });
    }

    // Smokescreen Shot: opponent flips a coin when the Defending Pokémon attacks next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_FLIPS_COIN_TO_ATTACK(store, state, effect, this);
    }

    return state;
  }
}
