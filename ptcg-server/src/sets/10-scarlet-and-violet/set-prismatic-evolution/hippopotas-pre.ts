import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Hippopotas extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 90;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Tackle',
    cost: [C, C, C],
    damage: 70,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '52';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hippopotas';
  public fullName: string = 'Hippopotas PRE';
}
