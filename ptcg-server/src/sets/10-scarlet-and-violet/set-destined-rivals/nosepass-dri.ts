import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Nosepass extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 80;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Headbutt',
    cost: [F],
    damage: 20,
    text: '',
  },
  {
    name: 'Rock Throw',
    cost: [C, C, C],
    damage: 40,
    text: '',
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '97';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Nosepass';
  public fullName: string = 'Nosepass DRI';
}
