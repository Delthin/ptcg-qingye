import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, GameMessage, State, StoreLike, TrainerCard, TrainerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Luvdisc extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Matching',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 2 Supporter cards, reveal them, and put them into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Water Pulse',
      cost: [W],
      damage: 20,
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '47';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Luvdisc';
  public fullName: string = 'Luvdisc PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Matching: search up to 2 Supporter cards, put them into hand, then shuffle.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.deck.cards.length === 0) {
        return state;
      }

      const hasSupporter = player.deck.cards
        .some(card => card instanceof TrainerCard && card.trainerType === TrainerType.SUPPORTER);

      if (!hasSupporter) {
        return state;
      }

      // Const (not a fresh literal) so the extra `trainerType` key isn't flagged against Partial<Card>.
      const filter = { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER };

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.deck,
        filter,
        { min: 0, max: 2, allowCancel: false },
      ), cards => {
        if (cards !== undefined && cards.length > 0) {
          state = MOVE_CARDS(store, state, player.deck, player.hand, { cards });
        }
        state = SHUFFLE_DECK(store, state, player);
      }) ?? state;
    }

    // Water Pulse: the Defending Pokémon is now Asleep.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    return state;
  }
}
