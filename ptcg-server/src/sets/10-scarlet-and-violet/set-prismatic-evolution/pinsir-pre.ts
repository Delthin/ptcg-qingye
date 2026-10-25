import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Pinsir extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Slash',
    cost: [G, C],
    damage: 60,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '3';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pinsir';
  public fullName: string = 'Pinsir PRE';
}
