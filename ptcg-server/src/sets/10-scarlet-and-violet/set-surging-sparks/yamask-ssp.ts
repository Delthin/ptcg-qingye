import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Yamask extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Mumble',
    cost: [P],
    damage: 10,
    text: '',
  },
  {
    name: 'Petty Grudge',
    cost: [P, C],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '82';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Yamask';
  public fullName: string = 'Yamask SSP';
}
