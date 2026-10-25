import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Staravia extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Starly';
  public cardType: CardType[] = [C];
  public hp: number = 80;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Wing Attack',
      cost: [C, C],
      damage: 40,
      text: '',
    },
    {
      name: 'Speed Dive',
      cost: [C, C, C],
      damage: 80,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '149';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Staravia';
  public fullName: string = 'Staravia SVI';
}
