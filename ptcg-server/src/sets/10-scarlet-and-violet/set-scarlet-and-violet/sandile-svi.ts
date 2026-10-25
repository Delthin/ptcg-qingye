import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Sandile extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Gnaw',
      cost: [F],
      damage: 10,
      text: '',
    },
    {
      name: 'Ram',
      cost: [F, F],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '115';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sandile';
  public fullName: string = 'Sandile SVI';
}
