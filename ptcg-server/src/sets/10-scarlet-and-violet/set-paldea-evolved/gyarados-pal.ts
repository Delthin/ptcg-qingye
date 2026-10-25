import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { GET_PLAYER_PRIZES, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Gyarados extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Magikarp';
  public cardType: CardType[] = [W];
  public hp: number = 180;
  public weakness = [{ type: L }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Revengeful Storm',
      cost: [W, C, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If you have more Prize cards remaining than your opponent, this attack does 100 more damage.',
    },
    {
      name: 'Berserker Tackle',
      cost: [W, W, C, C],
      damage: 200,
      text: 'This Pokémon also does 50 damage to itself.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '43';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gyarados';
  public fullName: string = 'Gyarados PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const remainingPrizes = (target: typeof player) =>
        GET_PLAYER_PRIZES(target).filter(prize => prize.cards.length > 0).length;

      if (remainingPrizes(player) > remainingPrizes(opponent)) {
        effect.damage += 100;
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 50);
    }

    return state;
  }
}
