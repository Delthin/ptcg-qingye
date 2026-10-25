import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class KommoO extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public cardType: CardType[] = [N];
  public hp: number = 180;
  public retreat = [C, C];

  public attacks = [{
    name: 'Blazing Uppercut',
    cost: [L, F, C],
    damage: 250,
    text: '',
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '112';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kommo-o';
  public fullName: string = 'Kommo-o 30C';
}
