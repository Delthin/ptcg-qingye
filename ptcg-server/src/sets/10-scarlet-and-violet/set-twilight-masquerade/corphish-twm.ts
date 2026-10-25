import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Corphish extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 80;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Vise Grip',
    cost: [W, W, C],
    damage: 60,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '47';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Corphish';
  public fullName: string = 'Corphish TWM';
}
