import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Dwebble extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 60;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [{
    name: 'Beat',
    cost: [C, C],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '6';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dwebble';
  public fullName: string = 'Dwebble PAR';
}
