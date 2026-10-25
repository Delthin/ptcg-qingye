import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_POISON_TO_PLAYER_ACTIVE, COIN_FLIP_PROMPT, IS_ABILITY_BLOCKED,
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN, USE_ABILITY_ONCE_PER_TURN,
  WAS_ATTACK_USED, WAS_POWER_USED
} from '../../../game/store/prefabs/prefabs';

export class PaldeanClodsireex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Paldean Wooper';
  public cardType: CardType[] = [D];
  public hp: number = 280;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public powers = [{
    name: 'Toxic Wetland',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, if a Stadium is in play, you may make your opponent\'s Active Pokémon Poisoned.',
  }];

  public attacks = [{
    name: 'Needle Bone',
    cost: [D, C, C],
    damage: 200,
    text: 'Flip a coin. If tails, during your next turn, this Pokémon can\'t attack.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '130';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Paldean Clodsire ex';
  public fullName: string = 'Paldean Clodsire ex PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Toxic Wetland
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      // Check to see if anything is blocking our Ability
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // This Ability can only be used if a Stadium is in play
      if (StateUtils.getStadiumCard(state) === undefined) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'TOXIC_WETLAND', this);

      ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
    }

    // Needle Bone
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(player);
        }
      });
    }

    return state;
  }
}
