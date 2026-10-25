import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';

export class Lucarioex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Riolu';
  public cardType: CardType[] = [F];
  public hp: number = 250;
  public weakness = [{ type: P }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Low Kick',
      cost: [F, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Aura Knuckle',
      cost: [F, F, C],
      damage: 120,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '82';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lucario ex';
  public fullName: string = 'Lucario ex SCR';
}
