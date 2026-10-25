import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Lapras extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Water Gun',
    cost: [W],
    damage: 20,
    text: '',
  },
  {
    name: 'Surf',
    cost: [W, C, C],
    damage: 80,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '31';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lapras';
  public fullName: string = 'Lapras SCR';
}
