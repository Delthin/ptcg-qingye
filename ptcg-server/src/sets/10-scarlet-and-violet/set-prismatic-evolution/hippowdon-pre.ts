import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Hippowdon extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Hippopotas';
  public cardType: CardType[] = [F];
  public hp: number = 150;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Sand Spray',
      cost: [C, C, C],
      damage: 90,
      text: ''
    },
    {
      name: 'Land Crush',
      cost: [F, C, C, C],
      damage: 140,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '53';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hippowdon';
  public fullName: string = 'Hippowdon PRE';
}
