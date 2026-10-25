import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Clauncher extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Vise Grip',
    cost: [W],
    damage: 10,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '49';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Clauncher';
  public fullName: string = 'Clauncher SVI';
}
