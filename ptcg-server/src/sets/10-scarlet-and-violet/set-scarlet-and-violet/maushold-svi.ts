import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Maushold extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Tandemaus';
  public cardType: CardType[] = [CardType.COLORLESS];
  public hp: number = 70;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Slap',
      cost: [CardType.COLORLESS],
      damage: 40,
      text: '',
    },
    {
      name: 'Family Attack',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 70,
      damageCalculation: 'x',
      text: 'This attack does 70 damage for each of your Maushold in play.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '161';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Maushold';
  public fullName: string = 'Maushold SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      let mausholdInPlay = 0;

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        const pokemonCard = cardList.getPokemonCard();
        if (pokemonCard !== undefined && pokemonCard.name === 'Maushold') {
          mausholdInPlay += 1;
        }
      });

      effect.damage = 70 * mausholdInPlay;
    }

    return state;
  }
}
