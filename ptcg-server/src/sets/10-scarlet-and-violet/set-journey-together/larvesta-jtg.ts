import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Larvesta extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 80;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Will-O-Wisp',
    cost: [C],
    damage: 10,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '28';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Larvesta';
  public fullName: string = 'Larvesta JTG';
}
