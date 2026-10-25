import { moveDamageCounters } from '../../game/store/prefabs/damage-counter-effects';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../game/store/card/card-types';
import { StoreLike } from '../../game/store/store-like';
import { State } from '../../game/store/state/state';
import { Effect } from '../../game/store/effects/effect';

import { StateUtils } from '../../game/store/state-utils';
import { PowerType } from '../../game/store/card/pokemon-types';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { MoveDamagePrompt } from '../../game/store/prompts/move-damage-prompt';
import { GameMessage } from '../../game/game-message';
import { ChoosePokemonPrompt, GameError } from '../..';
import { PutDamageEffect } from '../../game/store/effects/attack-effects';
import { ABILITY_USED, REMOVE_MARKER_AT_END_OF_TURN, WAS_ATTACK_USED, WAS_POWER_USED } from '../../game/store/prefabs/prefabs';

export class Gengar extends PokemonCard {

  public stage: Stage = Stage.BASIC;
  public evolvesFrom = 'Haunter';
  public cardType: CardType[] = [P];
  public hp: number = 80;
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public powers = [{
    name: 'Curse',
    useWhenInPlay: true,
    powerType: PowerType.POKEMON_POWER,
    text: 'Once during your turn (before your attack), you may move 1 damage counter from 1 of your opponent\'s Pokémon to another(even if it would Knock Out the other Pokémon).This power can\'t be used if Gengar is Asleep, Confused, or Paralyzed.'
  }];

  public attacks = [{
    name: 'Dark Mind',
    cost: [P, P, P],
    damage: 30,
    text: 'If your opponent has any Benched Pokémon, choose 1 of them and this attack does 10 damage to it. (Don\'t apply Weakness and Resistance for Benched Pokémon.)'
  }];

  public set: string = 'FO';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '5';
  public name: string = 'Gengar';
  public fullName: string = 'Gengar FO';

  public readonly CURSE_MARKER = 'CURSE_MARKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    REMOVE_MARKER_AT_END_OF_TURN(effect, this.CURSE_MARKER, this);
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      console.log('Opponent active cards:', opponent.active.cards); // Add this line

      if (opponent.active.cards.length > 0 && opponent.active.cards[0] instanceof PokemonCard) {
        const opponentActivePokemon = opponent.active.cards[0] as PokemonCard;
        console.log('Opponent active Pokemon:', opponentActivePokemon); // Add this line
        if (opponentActivePokemon.attacks && opponentActivePokemon.attacks.length > 0) {
          console.log('Opponent Active\'s First Attack:', opponentActivePokemon.attacks[0]);
        }
      }

      const damagedPokemon = [
        ...opponent.bench.filter(b => b.cards.length > 0 && b.damage > 0),
        ...(opponent.active.damage > 0 ? [opponent.active] : [])
      ];

      if (player.marker.hasMarker(this.CURSE_MARKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }

      const source = StateUtils.findPokemonSlot(state, this);
      if (!source) throw new GameError(GameMessage.CANNOT_USE_POWER);
      const powerBlockedByStatus = [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED]
        .some(condition => source.specialConditions.includes(condition));
      if (damagedPokemon.length === 0 || powerBlockedByStatus
        || [opponent.active, ...opponent.bench].filter(list => list.getPokemonCard()).length < 2) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      return store.prompt(state, new MoveDamagePrompt(
        effect.player.id,
        GameMessage.MOVE_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        [],
        { min: 1, max: 1, allowCancel: false, singleDestinationTarget: true }
      ), transfers => {

        player.marker.addMarker(this.CURSE_MARKER, this);

        if (transfers === null) {
          return;
        }

        for (const transfer of transfers) {
          const source = StateUtils.getTarget(state, player, transfer.from);
          const target = StateUtils.getTarget(state, player, transfer.to);
          state = moveDamageCounters(store, state, player, source, target, 10, effect);
          ABILITY_USED(player, this);
          return state;
        }
      });
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const hasBenched = opponent.bench.some(b => b.cards.length > 0);
      if (!hasBenched) {
        return state;
      }

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false }
      ), selected => {
        const targets = selected || [];
        targets.forEach(target => {
          const damageEffect = new PutDamageEffect(effect, 10);
          damageEffect.target = target;
          store.reduceEffect(state, damageEffect);
        });
        return state;
      });
    }
    return state;
  }
}