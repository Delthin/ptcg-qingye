import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';

export class Darkraiex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 210;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Wind of Darkness',
      cost: [D, C],
      damage: 40,
      text: '',
    },
    {
      name: 'Night Impact',
      cost: [D, D, C],
      damage: 110,
      text: '',
    },
  ];

  protected _tags = [CardTag.POKEMON_ex];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '110';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Darkrai ex';
  public fullName: string = 'Darkrai ex SVP';
}
