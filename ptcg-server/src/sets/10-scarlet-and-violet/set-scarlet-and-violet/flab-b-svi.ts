import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class FlabB extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 40;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [{
    name: 'Pollen Shot',
    cost: [P],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '91';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Flabébé';
  public fullName: string = 'Flabébé SVI';
}
