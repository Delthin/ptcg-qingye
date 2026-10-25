import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class AlolanGraveler extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Alolan Geodude';
  public cardType: CardType[] = [L];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Rolling Tackle',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Electric Punch',
      cost: [L, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '45';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Alolan Graveler';
  public fullName: string = 'Alolan Graveler JTG';
}
