import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Oinkologne extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Lechonk';
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Confounding Cologne',
      cost: [C, C],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Confused.'
    },
    {
      name: 'High-Impact Kick',
      cost: [C, C, C],
      damage: 160,
      text: 'Flip a coin. If tails, this Pokémon also does 60 damage to itself.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '183';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Oinkologne';
  public fullName: string = 'Oinkologne OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect = effect;
      return COIN_FLIP_PROMPT(store, state, attackEffect.player, result => {
        if (!result) {
          THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, attackEffect, 60);
        }
      });
    }

    return state;
  }
}
