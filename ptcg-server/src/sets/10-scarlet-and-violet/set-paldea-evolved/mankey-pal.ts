import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Mankey extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 60;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Low Kick',
      cost: [F],
      damage: 10,
      text: '',
    },
    {
      name: 'Hang Down',
      cost: [F, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '106';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mankey';
  public fullName: string = 'Mankey PAL';
}
