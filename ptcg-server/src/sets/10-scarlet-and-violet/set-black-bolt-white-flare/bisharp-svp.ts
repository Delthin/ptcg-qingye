import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Bisharp extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Pawniard';
  public cardType: CardType[] = [D];
  public hp: number = 100;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Cut',
    cost: [D],
    damage: 30,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '112';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bisharp';
  public fullName: string = 'Bisharp SVP';
}
