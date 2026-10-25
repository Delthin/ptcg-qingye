import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Ferroseed extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 70;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Spike Sting',
    cost: [M, C],
    damage: 30,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '127';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ferroseed';
  public fullName: string = 'Ferroseed PAR';
}
