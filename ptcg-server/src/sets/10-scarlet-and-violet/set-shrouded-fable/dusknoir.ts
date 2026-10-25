import { GameError } from '../../../game';
import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import { PowerEffect } from '../../../game/store/effects/game-effects';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, PowerType, ChoosePokemonPrompt, GameMessage, PlayerType, SlotType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageCountersEffect } from '../../../game/store/effects/game-effects';
import { WAS_ATTACK_USED, WAS_POWER_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Dusknoir extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Dusclops';
  public cardType: CardType[] = [P];
  public hp: number = 160;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Cursed Blast',
    useWhenInPlay: true,
    powerType: PowerType.ABILITY,
    knocksOutSelf: true,
    text: 'Once during your turn, you may put 13 damage counters on 1 of your opponent\'s Pokémon. If you placed any damage counters in this way, this Pokémon is Knocked Out.'
  }];

  public attacks = [{
    name: 'Shadow Bind',
    cost: [P, P, C],
    damage: 150,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.'
  }];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '20';
  public name: string = 'Dusknoir';
  public fullName: string = 'Dusknoir SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof EndTurnEffect) effect.player.forEachPokemon(PlayerType.BOTTOM_PLAYER, list => list.marker.removeMarker('CURSED_BLAST_USED', this));
    // Cursed Blast
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      const source = player.getPokemonInPlay().find(list => list.getPokemonCard() === this);
      if (!source) throw new GameError(GameMessage.CANNOT_USE_POWER);
      if (source.marker.hasMarker('CURSED_BLAST_USED', this)) throw new GameError(GameMessage.POWER_ALREADY_USED);
      source.marker.addMarker('CURSED_BLAST_USED', this);

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.BENCH, SlotType.ACTIVE],
        { min: 1, max: 1, allowCancel: false },
      ), selected => {
        const targets = selected || [];

        if (targets.length > 0) {
          const placeCountersEffect = new PutDamageCountersEffect(new PowerEffect(player, this.powers[0], this, targets[0]), 130);
          state = store.reduceEffect(state, placeCountersEffect);
          if (placeCountersEffect.appliedDamage > 0 && source.getPokemonCard() === this) source.damage += 999;
        }


      });
    }
    // Shadow Bind
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return BLOCK_RETREAT(store, state, effect, this);
    }
    return state;
  }
}