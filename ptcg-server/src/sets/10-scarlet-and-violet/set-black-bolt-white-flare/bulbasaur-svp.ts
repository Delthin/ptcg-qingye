import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Bulbasaur extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 70;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Vine Whip',
    cost: [G, C, C],
    damage: 50,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '46';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bulbasaur';
  public fullName: string = 'Bulbasaur SVP';
}
