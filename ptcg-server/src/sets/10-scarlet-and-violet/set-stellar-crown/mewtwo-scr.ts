import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Mewtwo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Super Psy Bolt',
    cost: [P, P, C],
    damage: 100,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '59';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mewtwo';
  public fullName: string = 'Mewtwo SCR';
}
