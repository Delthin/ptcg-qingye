import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Carvanha extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 50;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Sharp Fang',
    cost: [W],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '46';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Carvanha';
  public fullName: string = 'Carvanha OBF';
}
