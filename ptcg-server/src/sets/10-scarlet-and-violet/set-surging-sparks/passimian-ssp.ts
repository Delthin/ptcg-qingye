import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Passimian extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 110;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [{
    name: 'Coordinated Throwing',
    cost: [F, C],
    damage: 20,
    damageCalculation: 'x',
    text: 'This attack does 20 damage for each of your Basic Pokémon in play.',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '111';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Passimian';
  public fullName: string = 'Passimian SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      let basicPokemonInPlay = 0;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        const pokemonCard = cardList.getPokemonCard();
        if (pokemonCard !== undefined && pokemonCard.stage === Stage.BASIC) {
          basicPokemonInPlay += 1;
        }
      });

      effect.damage = 20 * basicPokemonInPlay;
    }

    return state;
  }
}
