import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Whimsicott extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Cottonee';
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: M }];
  public retreat: CardType[] = [];

  public attacks = [{
    name: 'Fairy Wind',
    cost: [P],
    damage: 50,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '35';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Whimsicott';
  public fullName: string = 'Whimsicott PAF';
}
