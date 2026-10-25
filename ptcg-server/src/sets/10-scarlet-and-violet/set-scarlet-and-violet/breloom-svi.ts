import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Breloom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Shroomish';
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [{
    name: 'Mach Cross',
    cost: [G],
    damage: 60,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '4';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Breloom';
  public fullName: string = 'Breloom SVI';
}
