import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckAttackCostEffect } from '../../../game/store/effects/check-effects';
import {
  IS_ABILITY_BLOCKED, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

const MONKEY_TRIO = ['Simisage', 'Simisear', 'Simipour'];

export class Simisear extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Pansear';
  public cardType: CardType[] = [R];
  public hp: number = 100;
  public weakness = [{ type: W }];
  public retreat = [C];

  public powers = [{
    name: 'Monkey Trio',
    powerType: PowerType.ABILITY,
    text: 'If you have Simisage, Simisear, and Simipour in play, ignore all Colorless Energy in the costs of attacks used by this Pokémon.'
  }];

  public attacks = [{
    name: 'Heat Tackle',
    cost: [R, C, C, C],
    damage: 190,
    text: 'This Pokémon also does 30 damage to itself.'
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '21';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Simisear';
  public fullName: string = 'Simisear PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Monkey Trio: ignore Colorless Energy in the cost of this Pokémon's attacks
    // while Simisage, Simisear and Simipour are all in play.
    if (effect instanceof CheckAttackCostEffect) {
      const player = effect.player;

      let isThisPokemonInPlay = false;
      const monkeysInPlay: string[] = [];

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        const pokemon = cardList.getPokemonCard();
        if (pokemon === undefined) {
          return;
        }
        if (pokemon === this) {
          isThisPokemonInPlay = true;
        }
        if (MONKEY_TRIO.includes(pokemon.name) && !monkeysInPlay.includes(pokemon.name)) {
          monkeysInPlay.push(pokemon.name);
        }
      });

      const isAttackOfThisPokemon = this.attacks.some(attack => attack.name === effect.attack.name);

      if (isThisPokemonInPlay && isAttackOfThisPokemon
        && monkeysInPlay.length === MONKEY_TRIO.length
        && !IS_ABILITY_BLOCKED(store, state, player, this)) {
        effect.cost = effect.cost.filter(cost => cost !== CardType.COLORLESS);
      }
    }

    // Heat Tackle: this Pokémon also does 30 damage to itself.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
