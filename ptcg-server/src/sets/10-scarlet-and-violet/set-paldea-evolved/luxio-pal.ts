import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Luxio extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Shinx';
  public cardType: CardType[] = [L];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Zap Kick',
      cost: [L],
      damage: 30,
      text: '',
    },
    {
      name: 'Head Bolt',
      cost: [L, C, C],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '70';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Luxio';
  public fullName: string = 'Luxio PAL';
}
