import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Meltan extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 80;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Headbutt',
    cost: [M, M],
    damage: 50,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '116';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Meltan';
  public fullName: string = 'Meltan TEF';
}
