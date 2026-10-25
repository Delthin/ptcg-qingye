import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Starly extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Flap',
    cost: [C],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '148';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Starly';
  public fullName: string = 'Starly SVI';
}
