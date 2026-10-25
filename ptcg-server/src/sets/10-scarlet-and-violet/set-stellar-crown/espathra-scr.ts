import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Espathra extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Flittle';
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Psychic Flash',
    cost: [P],
    damage: 50,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '69';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Espathra';
  public fullName: string = 'Espathra SCR';
}
