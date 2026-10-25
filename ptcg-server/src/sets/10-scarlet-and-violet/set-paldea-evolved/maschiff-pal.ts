import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Maschiff extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Smash Kick',
      cost: [C, C],
      damage: 20,
      text: '',
    },
    {
      name: 'Sharp Fang',
      cost: [D, C, C],
      damage: 50,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '142';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Maschiff';
  public fullName: string = 'Maschiff PAL';
}
