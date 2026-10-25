import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Mienfoo extends PokemonCard {
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
      text: ''
    },
    {
      name: 'Beatdown',
      cost: [C, C],
      damage: 20,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '96';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mienfoo';
  public fullName: string = 'Mienfoo PAR';
}
