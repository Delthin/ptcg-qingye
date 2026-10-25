import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Phantump extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 60;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [{
    name: 'Branch Poke',
    cost: [C, C],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '11';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Phantump';
  public fullName: string = 'Phantump OBF';
}
