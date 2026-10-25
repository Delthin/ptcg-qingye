import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Fuecoco extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 80;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Live Coal',
    cost: [R],
    damage: 10,
    text: '',
  },
  {
    name: 'Ram',
    cost: [R, R],
    damage: 30,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '23';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Fuecoco';
  public fullName: string = 'Fuecoco PAR';
}
