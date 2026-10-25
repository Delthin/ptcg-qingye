import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Exeggcute extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 60;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [{
    name: 'Ram',
    cost: [G, C],
    damage: 30,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '1';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Exeggcute';
  public fullName: string = 'Exeggcute PRE';
}
