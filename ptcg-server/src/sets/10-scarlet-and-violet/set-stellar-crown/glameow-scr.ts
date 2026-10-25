import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Glameow extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Hook',
    cost: [C],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '116';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Glameow';
  public fullName: string = 'Glameow SCR';
}
