import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Meditite extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 70;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Slap',
      cost: [F],
      damage: 10,
      text: '',
    },
    {
      name: 'Kick',
      cost: [C, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '82';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Meditite';
  public fullName: string = 'Meditite TEF';
}
