import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Buneary extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Smash Kick',
    cost: [C],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '83';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Buneary';
  public fullName: string = 'Buneary PRE';
}
