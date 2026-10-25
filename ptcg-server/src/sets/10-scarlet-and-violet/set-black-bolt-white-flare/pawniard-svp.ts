import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Pawniard extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Pierce',
    cost: [D],
    damage: 10,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '111';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pawniard';
  public fullName: string = 'Pawniard SVP';
}
