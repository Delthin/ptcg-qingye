import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Morgrem extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Impidimp';
  public cardType: CardType[] = [D];
  public hp: number = 90;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Gentle Slap',
      cost: [C, C],
      damage: 40,
      text: '',
    },
    {
      name: 'Darkness Fang',
      cost: [D, C, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '95';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Morgrem';
  public fullName: string = 'Morgrem SCR';
}
