import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Riolu extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 70;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [{
    name: 'Punch',
    cost: [F, C],
    damage: 30,
    text: ''
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '81';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Riolu';
  public fullName: string = 'Riolu SCR';
}
