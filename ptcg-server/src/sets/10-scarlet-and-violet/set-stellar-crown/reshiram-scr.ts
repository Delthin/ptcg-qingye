import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Reshiram extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 130;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Heat Blast',
    cost: [R, C, C],
    damage: 90,
    text: ''
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '22';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Reshiram';
  public fullName: string = 'Reshiram SCR';
}
