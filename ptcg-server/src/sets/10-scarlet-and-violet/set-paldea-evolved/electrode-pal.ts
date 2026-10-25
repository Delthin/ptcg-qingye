import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Electrode extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Voltorb';
  public cardType: CardType[] = [L];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Lightning Ball',
      cost: [L],
      damage: 60,
      text: '',
    },
    {
      name: 'Rolling Tackle',
      cost: [C, C, C],
      damage: 90,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '67';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Electrode';
  public fullName: string = 'Electrode PAL';
}
