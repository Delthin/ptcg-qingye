import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Crocalor extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Fuecoco';
  public cardType: CardType[] = [R];
  public hp: number = 100;
  public weakness = [{ type: W }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Bite',
      cost: [R, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Rolling Tackle',
      cost: [R, R, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '37';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Crocalor';
  public fullName: string = 'Crocalor SVI';
}
