import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { MULTIPLE_COIN_FLIPS_PROMPT, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class TeamRocketsRaticate extends PokemonCard {
  protected _tags = [CardTag.TEAM_ROCKET];
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Team Rocket\'s Rattata';
  public cardType: CardType[] = [C];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Reckless Abandon',
    cost: [C],
    damage: 90,
    text: 'Flip 2 coins. If both of them are tails, this Pokémon also does 90 damage to itself.',
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '148';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Team Rocket\'s Raticate';
  public fullName: string = 'Team Rocket\'s Raticate DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect: AttackEffect = effect;
      const player = attackEffect.player;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const allTails = results.every(result => result === false);
        if (allTails) {
          THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, attackEffect, 90);
        }
      });
    }
    return state;
  }
}
