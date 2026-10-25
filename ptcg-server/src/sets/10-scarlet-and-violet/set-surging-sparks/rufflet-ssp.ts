import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Rufflet extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Flap',
    cost: [C, C],
    damage: 30,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '152';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rufflet';
  public fullName: string = 'Rufflet SSP';
}
