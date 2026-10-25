import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Salazzle extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Salandit';
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Suffocating Gas',
      cost: [D],
      damage: 40,
      text: '',
    },
    {
      name: 'Gentle Slap',
      cost: [D, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '140';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Salazzle';
  public fullName: string = 'Salazzle OBF';
}
