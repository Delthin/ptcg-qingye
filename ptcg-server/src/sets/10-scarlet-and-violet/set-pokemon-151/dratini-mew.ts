import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Dratini extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [N];
  public hp: number = 60;
  public retreat = [C];

  public attacks = [
    {
      name: 'Beat',
      cost: [W],
      damage: 10,
      text: '',
    },
    {
      name: 'Draconic Whip',
      cost: [W, L],
      damage: 40,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '147';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dratini';
  public fullName: string = 'Dratini MEW';
}
