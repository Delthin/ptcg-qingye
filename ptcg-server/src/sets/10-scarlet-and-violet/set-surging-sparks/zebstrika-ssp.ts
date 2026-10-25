import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Zebstrika extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Blitzle';
  public cardType: CardType[] = [L];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Kick',
      cost: [L],
      damage: 30,
      text: '',
    },
    {
      name: 'Mach Bolt',
      cost: [L, L, C],
      damage: 120,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '63';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zebstrika';
  public fullName: string = 'Zebstrika SSP';
}
