import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Rockruff extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 60;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Bite',
    cost: [F],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '116';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rockruff';
  public fullName: string = 'Rockruff OBF';
}
