import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Wiglett extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Rain Splash',
    cost: [W],
    damage: 10,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '58';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Wiglett';
  public fullName: string = 'Wiglett OBF';
}
