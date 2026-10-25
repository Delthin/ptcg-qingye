import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Makuhita extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 90;
  public weakness = [{ type: P }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Slap Push',
    cost: [C, C],
    damage: 40,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '112';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Makuhita';
  public fullName: string = 'Makuhita PAL';
}
