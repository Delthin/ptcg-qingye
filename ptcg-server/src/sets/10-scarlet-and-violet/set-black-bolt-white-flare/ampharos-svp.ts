import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Ampharos extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Flaaffy';
  public cardType: CardType[] = [L];
  public hp: number = 160;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Electric Ball',
    cost: [L, C],
    damage: 110,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '109';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ampharos';
  public fullName: string = 'Ampharos SVP';
}
