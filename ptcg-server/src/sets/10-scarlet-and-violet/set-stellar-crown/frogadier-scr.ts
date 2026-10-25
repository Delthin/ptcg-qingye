import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Frogadier extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Froakie';
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Wave Splash',
    cost: [W, C],
    damage: 40,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '40';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Frogadier';
  public fullName: string = 'Frogadier SCR';
}
