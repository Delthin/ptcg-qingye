import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Finizen extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 80;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Rain Splash',
    cost: [W],
    damage: 10,
    text: '',
  },
  {
    name: 'Sharp Fin',
    cost: [W, C, C],
    damage: 50,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '48';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Finizen';
  public fullName: string = 'Finizen TEF';
}
