import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChoosePokemonPrompt } from '../../../game/store/prompts/choose-pokemon-prompt';
import {
  DAMAGE_OPPONENT_POKEMON, MOVE_CARDS, SHOW_CARDS_TO_PLAYER, SHUFFLE_DECK, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Kingdra extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Seadra';
  public cardType: CardType[] = [W];
  public hp: number = 150;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Whirltide',
      cost: [W],
      damage: 0,
      text: 'Reveal the top 6 cards of your deck. This attack does 60 damage to 1 of your opponent\'s Pokémon for each Energy card you find there. Then, discard those Energy cards and shuffle the other cards back into your deck. (Don\'t apply Weakness and Resistance for Benched Pokémon.)'
    },
    {
      name: 'Hydro Splash',
      cost: [W, C],
      damage: 120,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '32';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kingdra';
  public fullName: string = 'Kingdra PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      const player = attackEffect.player;
      const opponent = attackEffect.opponent;

      const revealed = player.deck.cards.slice(0, 6);
      const energyCards = revealed.filter(card => card.superType === SuperType.ENERGY);
      const damage = 60 * energyCards.length;

      // Reveal the top 6 cards of your deck to your opponent.
      state = SHOW_CARDS_TO_PLAYER(store, state, opponent, revealed);

      // Discard the Energy cards found there.
      if (energyCards.length > 0) {
        state = MOVE_CARDS(store, state, player.deck, player.discard, {
          cards: energyCards,
          sourceCard: this,
          sourceEffect: attackEffect
        });
      }

      // Shuffle the other revealed cards back into the deck.
      state = SHUFFLE_DECK(store, state, player);

      // 60 damage to 1 of your opponent's Pokémon for each Energy card found.
      state = store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
        PlayerType.TOP_PLAYER,
        [SlotType.ACTIVE, SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false },
      ), targets => {
        if (targets.length === 0) {
          return;
        }
        DAMAGE_OPPONENT_POKEMON(store, state, attackEffect, damage, targets);
      }) ?? state;
    }

    return state;
  }
}
