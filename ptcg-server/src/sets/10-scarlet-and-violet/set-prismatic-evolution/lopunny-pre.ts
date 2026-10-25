import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Lopunny extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Buneary';
  public cardType: CardType[] = [C];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Rear Kick',
    cost: [C, C],
    damage: 90,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '84';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lopunny';
  public fullName: string = 'Lopunny PRE';
}
