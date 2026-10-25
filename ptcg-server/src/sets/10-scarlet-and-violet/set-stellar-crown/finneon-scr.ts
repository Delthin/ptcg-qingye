import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Finneon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 50;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Sprinkle Water',
    cost: [W],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '35';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Finneon';
  public fullName: string = 'Finneon SCR';
}
