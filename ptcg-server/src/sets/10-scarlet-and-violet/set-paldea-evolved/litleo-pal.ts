import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { DISCARD_A_STADIUM_CARD_IN_PLAY } from '../../../game/store/prefabs/prefabs';

export class Litleo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 70;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Blazing Destruction',
      cost: [C],
      damage: 0,
      text: 'Discard a Stadium in play.',
      effect: DISCARD_A_STADIUM_CARD_IN_PLAY,
    },
    {
      name: 'Live Coal',
      cost: [R],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '31';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Litleo';
  public fullName: string = 'Litleo PAL';
}
