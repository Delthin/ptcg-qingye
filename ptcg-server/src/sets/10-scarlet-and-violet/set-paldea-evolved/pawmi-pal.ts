import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';

export class Pawmi extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 50;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Static Shock',
    cost: [L],
    damage: 20,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '74';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pawmi';
  public fullName: string = 'Pawmi PAL';
}
