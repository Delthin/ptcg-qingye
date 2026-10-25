import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Drowzee extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 80;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Zen Headbutt',
    cost: [P, C],
    damage: 30,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '96';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Drowzee';
  public fullName: string = 'Drowzee MEW';
}
