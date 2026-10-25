import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, SpecialCondition, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_CONFUSION_TO_PLAYER_ACTIVE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Primeape extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Mankey';
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Rant and Rave',
      cost: [F],
      damage: 40,
      text: 'This Pokémon is now Confused.'
    },
    {
      name: 'Raging Smash',
      cost: [F, C, C],
      damage: 150,
      text: 'If this Pokémon isn\'t Confused, this attack does nothing.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '57';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Primeape';
  public fullName: string = 'Primeape MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, effect.player, this);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      if (!player.active.specialConditions.includes(SpecialCondition.CONFUSED)) {
        effect.damage = 0;
      }
    }

    return state;
  }
}
