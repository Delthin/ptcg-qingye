import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class HisuianZorua extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Scratch',
    cost: [C],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '122';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hisuian Zorua';
  public fullName: string = 'Hisuian Zorua 30C';
}
