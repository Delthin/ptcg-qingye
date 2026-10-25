import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Zorua30C extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Darkness Fang',
    cost: [D, D],
    damage: 40,
    text: '',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '95';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zorua';
  public fullName: string = 'Zorua 30C';
}
