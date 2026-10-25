import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class TeamRocketsHoundour extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 70;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [{
    name: 'Steady Firebreathing',
    cost: [R],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '37';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Team Rocket\'s Houndour';
  public fullName: string = 'Team Rocket\'s Houndour DRI';
}
