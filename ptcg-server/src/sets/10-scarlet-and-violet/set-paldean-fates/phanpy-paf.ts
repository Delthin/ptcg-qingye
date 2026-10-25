import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Phanpy extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 80;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Strength',
    cost: [C, C],
    damage: 30,
    text: '',
  },
  {
    name: 'Rolling Tackle',
    cost: [F, F, C],
    damage: 60,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '48';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Phanpy';
  public fullName: string = 'Phanpy PAF';
}
