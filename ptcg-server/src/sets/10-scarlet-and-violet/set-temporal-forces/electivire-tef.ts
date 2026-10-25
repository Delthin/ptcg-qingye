import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Electivire extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Electabuzz';
  public cardType: CardType[] = [L];
  public hp: number = 140;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Short-Circuit Knuckle',
      cost: [C, C],
      damage: 40,
      damageCalculation: '+',
      text: 'If your opponent has any [W] Pokémon in play, this attack does 120 more damage.',
    },
    {
      name: 'Electroslug',
      cost: [L, L, C, C],
      damage: 140,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Electivire';
  public fullName: string = 'Electivire TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const pokemonInPlay = [opponent.active, ...opponent.bench];

      const hasWaterPokemon = pokemonInPlay.some(cardList => {
        const pokemon = cardList.getPokemonCard();
        return pokemon !== undefined && pokemon.cardType.includes(CardType.WATER);
      });

      if (hasWaterPokemon) {
        state = THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }

    return state;
  }
}
