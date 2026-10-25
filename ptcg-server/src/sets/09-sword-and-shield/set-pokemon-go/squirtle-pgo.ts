import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Squirtle extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Water Gun',
    cost: [W],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'F';
  public set: string = 'PGO';
  public setNumber: string = '15';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Squirtle';
  public fullName: string = 'Squirtle PGO';
}
