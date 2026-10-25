import { moveDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { PowerEffect } from '../../../game/store/effects/game-effects';
import { StateUtils } from '../../../game/store/state-utils';
import { PowerType } from '../../../game/store/card/pokemon-types';
import { PlayerType, SlotType, CardTarget } from '../../../game/store/actions/play-card-action';
import { MoveDamagePrompt } from '../../../game/store/prompts/move-damage-prompt';
import { GameMessage } from '../../../game/game-message';
import { PlayPokemonEffect } from '../../../game/store/effects/play-card-effects';
import { IS_POKEPOWER_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';

export class Absolex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  protected _tags = [CardTag.POKEMON_ex];
  public cardType: CardType[] = [D];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public resistance = [{ type: P, value: -30 }];
  public retreat = [C];

  public powers = [
    {
      name: 'Cursed Eyes',
      powerType: PowerType.POKEPOWER,
      text: "Once during your turn, when you put Absol ex from your hand onto your Bench, you may move 3 damage counters from 1 of your opponent's Pokémon to another of his or her Pokémon.",
    },
  ];

  public attacks = [
    {
      name: 'Psychic Pulse',
      cost: [D, C],
      damage: 30,
      text: "Does 10 damage to each of your opponent's Benched Pokémon that has any damage counters on it. (Don't apply Weakness and Resistance for Benched Pokémon.)",
    },
  ];

  public set: string = 'PK';
  public name: string = 'Absol ex';
  public fullName: string = 'Absol ex PK';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '92';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PlayPokemonEffect && effect.pokemonCard === this) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (IS_POKEPOWER_BLOCKED(store, state, player, this)) {
        return state;
      }

      const pokemon = [opponent.active, ...opponent.bench].filter(list => list.getPokemonCard());
      if (pokemon.length < 2 || !pokemon.some(list => list.damage > 0)) return state;
      const blockedFrom: CardTarget[] = [];
      opponent.forEachPokemon(PlayerType.TOP_PLAYER, (list, _card, target) => {
        if (list.damage === 0) blockedFrom.push(target);
      });

      return store.prompt(
        state,
        new MoveDamagePrompt(
          effect.player.id,
          GameMessage.MOVE_DAMAGE,
          PlayerType.TOP_PLAYER,
          [SlotType.ACTIVE, SlotType.BENCH],
          [],
          {
            min: 1,
            max: 3,
            fixedSourceCounters: 3,
            blockedFrom,
            allowCancel: true,
            singleSourceTarget: true,
            singleDestinationTarget: true,
          },
        ),
        (transfers) => {
          if (transfers === null) {
            return;
          }
          const powerEffect = new PowerEffect(player, this.powers[0], this);
          store.reduceEffect(state, powerEffect);

          for (const transfer of transfers) {
            const source = StateUtils.getTarget(state, player, transfer.from);
            const target = StateUtils.getTarget(state, player, transfer.to);
            state = moveDamageCounters(store, state, player, source, target, 10, new PowerEffect(player, this.powers[0], this));
          }
        },
      );
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const benched = opponent.bench.filter((b) => b.cards.length > 0);

      benched.forEach((target) => {
        if (target.damage !== 0) {
          const damageEffect = new PutDamageEffect(effect, 10);
          damageEffect.target = target;
          store.reduceEffect(state, damageEffect);
        }
      });
    }

    return state;
  }
}
