import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED } from '../../../game/store/prefabs/attack-effects';

export class Rabsca extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rellor';
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Revival Blessing',
      cost: [C],
      damage: 0,
      text: 'Put a Pokémon from your discard pile onto your Bench.',
    },
    {
      name: 'Psybeam',
      cost: [P, P],
      damage: 50,
      text: 'Your opponent\'s Active Pokémon is now Confused.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '99';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rabsca';
  public fullName: string = 'Rabsca PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const hasPokemonInDiscard = player.discard.cards.some(card => card.superType === SuperType.POKEMON);
      const hasEmptyBenchSlot = player.bench.some(slot => slot.cards.length === 0);

      if (!hasPokemonInDiscard || !hasEmptyBenchSlot) {
        return state;
      }

      const next = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
        player.discard,
        { superType: SuperType.POKEMON },
        { min: 0, max: 1, allowCancel: true },
      ), cards => {
        const selected = cards || [];
        if (selected.length === 0) {
          return;
        }

        const benchSlot = player.bench.find(slot => slot.cards.length === 0);
        if (benchSlot === undefined) {
          return;
        }

        state = MOVE_CARDS(store, state, player.discard, benchSlot, {
          cards: [selected[0]],
          sourceCard: this,
          sourceEffect: effect,
        });
        benchSlot.pokemonPlayedTurn = state.turn;
      });

      return next ?? state;
    }

    return state;
  }
}
