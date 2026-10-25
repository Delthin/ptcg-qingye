import { putAbilityDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PowerEffect } from '../../../game/store/effects/game-effects';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { ChoosePokemonPrompt, GameMessage, PlayerType, PowerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';

import { WAS_POWER_USED, USE_ABILITY_ONCE_PER_TURN, REMOVE_MARKER_AT_END_OF_TURN } from '../../../game/store/prefabs/prefabs';

export class Starmie extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Staryu';
  public cardType: CardType[] = [CardType.WATER];
  public hp: number = 90;
  public weakness = [{ type: CardType.LIGHTNING }];
  public retreat = [CardType.COLORLESS];

  public powers = [{
    name: 'Mysterious Comet',
    useWhenInPlay: true,
    powerType: PowerType.ABILITY,
    text: ' Once during your turn, you may put 2 damage counters on 1 of your opponent\'s Pokémon. If you placed any damage counters in this way, discard this Pokémon and all attached cards.'
  }];

  public attacks = [{
    name: 'Speed Attack',
    cost: [CardType.WATER, CardType.COLORLESS],
    damage: 50,
    text: ''
  }];

  public set: string = 'MEW';
  public regulationMark = 'G';
  public setNumber: string = '121';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Starmie';
  public fullName: string = 'Starmie MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    REMOVE_MARKER_AT_END_OF_TURN(effect, 'MYSTERIOUS_COMET_USED', this);
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      USE_ABILITY_ONCE_PER_TURN(player, 'MYSTERIOUS_COMET_USED', this);
      return store.prompt(state, new ChoosePokemonPrompt(
        player.id, GameMessage.CHOOSE_POKEMON_TO_DAMAGE, PlayerType.TOP_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH], { min: 1, max: 1, allowCancel: false },
      ), selected => {
        const target = selected && selected[0];
        if (!target) return;
        let placed = false;
        state = putAbilityDamageCounters(store, state, new PowerEffect(player, this.powers[0], this),
          target, 20, () => { placed = true; });
        if (!placed) return;
        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
          if (cardList.getPokemonCard() !== this) return;
          cardList.moveTo(player.discard);
          cardList.clearEffects();
        });
        player.marker.removeMarker('MYSTERIOUS_COMET_USED', this);
      });
    }

    return state;
  }
}