import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Lillipup extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 50;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Rear Kick',
    cost: [C],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '170';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lillipup';
  public fullName: string = 'Lillipup OBF';
}
