import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Impidimp extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [{
    name: 'Gentle Slap',
    cost: [P],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '71';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Impidimp';
  public fullName: string = 'Impidimp JTG';
}
