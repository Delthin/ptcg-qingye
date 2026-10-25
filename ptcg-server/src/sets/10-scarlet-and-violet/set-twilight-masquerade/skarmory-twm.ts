import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { DISCARD_A_STADIUM_CARD_IN_PLAY } from '../../../game/store/prefabs/prefabs';

export class Skarmory extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Cutting Wind',
    cost: [M],
    damage: 30,
    text: '',
  },
  {
    name: 'Big Storm',
    cost: [C, C, C],
    damage: 90,
    text: 'Discard a Stadium in play.',
    effect: DISCARD_A_STADIUM_CARD_IN_PLAY,
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '119';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Skarmory';
  public fullName: string = 'Skarmory TWM';
}
