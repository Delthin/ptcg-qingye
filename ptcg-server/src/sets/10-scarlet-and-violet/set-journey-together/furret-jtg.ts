import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Furret extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Sentret';
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Scratch',
      cost: [C],
      damage: 40,
      text: '',
    },
    {
      name: 'Jet Headbutt',
      cost: [C, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '119';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Furret';
  public fullName: string = 'Furret JTG';
}
