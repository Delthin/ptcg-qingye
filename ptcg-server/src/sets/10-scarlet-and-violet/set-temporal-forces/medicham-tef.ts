import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Medicham extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Meditite';
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Low Sweep',
      cost: [F],
      damage: 40,
      text: '',
    },
    {
      name: 'High Jump Kick',
      cost: [C, C, C],
      damage: 110,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '83';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Medicham';
  public fullName: string = 'Medicham TEF';
}
