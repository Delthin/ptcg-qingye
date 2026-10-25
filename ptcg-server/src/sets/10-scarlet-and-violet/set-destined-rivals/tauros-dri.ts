import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Tauros extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Horn Attack',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Clean Hit',
      cost: [C, C],
      damage: 50,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is an Evolution Pokémon, this attack does 50 more damage.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '152';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tauros';
  public fullName: string = 'Tauros DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponentActive = effect.opponent.active.getPokemonCard();
      if (opponentActive !== undefined && opponentActive.stage !== Stage.BASIC) {
        effect.damage += 50;
      }
    }
    return state;
  }
}
