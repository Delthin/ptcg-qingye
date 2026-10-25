import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Spritzee extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 60;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [{
    name: 'Fairy Wind',
    cost: [P],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '38';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Spritzee';
  public fullName: string = 'Spritzee PRE';
}
