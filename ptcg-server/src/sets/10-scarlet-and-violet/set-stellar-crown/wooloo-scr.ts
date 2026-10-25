import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { DISCARD_A_STADIUM_CARD_IN_PLAY } from '../../../game/store/prefabs/prefabs';

export class Wooloo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Knock Over',
    cost: [C, C],
    damage: 30,
    text: 'You may discard a Stadium in play.',
    effect: DISCARD_A_STADIUM_CARD_IN_PLAY,
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '124';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Wooloo';
  public fullName: string = 'Wooloo SCR';
}
