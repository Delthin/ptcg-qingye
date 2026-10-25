import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Sandygast extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Mumble',
    cost: [C, C],
    damage: 20,
    text: '',
  },
  {
    name: 'Mud Shot',
    cost: [P, C, C],
    damage: 40,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '95';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sandygast';
  public fullName: string = 'Sandygast PAL';
}
