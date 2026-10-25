import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Slowpoke extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Water Gun',
      cost: [W],
      damage: 10,
      text: '',
    },
    {
      name: 'Tail Whap',
      cost: [W, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '18';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slowpoke';
  public fullName: string = 'Slowpoke PRE';
}
