import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Rockruff extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Paw Shake Punch',
    cost: [C],
    damage: 10,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '89';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rockruff';
  public fullName: string = 'Rockruff TEF';
}
