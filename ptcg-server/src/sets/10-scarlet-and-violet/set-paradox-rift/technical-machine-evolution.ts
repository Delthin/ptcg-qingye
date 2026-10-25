import { Attack, Card, ChooseCardsPrompt, ChoosePokemonPrompt, GameError, GameMessage, GameLog, PlayerType, PokemonCard, PokemonCardList, ShuffleDeckPrompt, SlotType } from '../../../game';
import { CardType, Stage, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { ColorlessCostReducer, DarkCostReducer, WaterCostReducer } from '../../../game/store/card/pokemon-interface';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CheckAttackCostEffect, CheckPokemonAttacksEffect } from '../../../game/store/effects/check-effects';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { EndTurnEffect } from '../../../game/store/effects/game-phase-effects';
import { IS_TOOL_BLOCKED } from '../../../game/store/prefabs/prefabs';

import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';

function* playCard(next: Function, store: StoreLike, state: State, effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;

  let targets: PokemonCardList[] = [];
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_EVOLVE,
    PlayerType.BOTTOM_PLAYER,
    [SlotType.BENCH],
    { min: 0, max: 2, allowCancel: false }
  ), selection => {
    targets = selection || [];
    next();
  });

  if (targets.length > 2 || new Set(targets).size !== targets.length
    || targets.some(target => !player.bench.includes(target) || !target.getPokemonCard())) {
    throw new GameError(GameMessage.INVALID_TARGET);
  }

  // Log the selected Pokémon targets
  const targetNames = targets.map(target => target.getPokemonCard()?.name).filter(Boolean);
  store.log(state, GameLog.LOG_TEXT, {
    text: `${player.name} chooses to evolve ${targetNames.join(' and ')}`
  });

  for (const target of targets) {
    const pokemonCard = target.getPokemonCard();
    if (pokemonCard === undefined) {
      return state; // invalid target?
    }

    // Blocking pokemon cards, that cannot be valid evolutions
    const blocked: number[] = [];
    player.deck.cards.forEach((card, index) => {
      if (card instanceof PokemonCard && (card.stage === Stage.BASIC || card.evolvesFrom !== pokemonCard.name)) {
        blocked.push(index);
      }
    });

    let cards: Card[] = [];
    yield store.prompt(state, new ChooseCardsPrompt(
      player,
      GameMessage.CHOOSE_CARD_TO_EVOLVE,
      player.deck,
      { superType: SuperType.POKEMON },
      { min: 0, max: 1, allowCancel: false, blocked }
    ), selected => {
      cards = selected || [];
      next();
    });

    // Canceled by user, he didn't found the card in the deck
    if (cards.length === 0) {
      continue;
    }

    const evolution = cards[0];
    if (!(evolution instanceof PokemonCard) || evolution.stage === Stage.BASIC
      || evolution.evolvesFrom !== pokemonCard.name || !player.deck.cards.includes(evolution)) {
      throw new GameError(GameMessage.INVALID_TARGET);
    }

    // Evolve Pokemon
    player.deck.moveCardTo(evolution, target);
    target.clearEffects();
    target.pokemonPlayedTurn = state.turn;
  }

  return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
  });
}

export class TechnicalMachineEvolution extends TrainerCard {

  public trainerType: TrainerType = TrainerType.TOOL;
  public regulationMark = 'G';
  public set: string = 'PAR';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '178';
  public name: string = 'Technical Machine: Evolution';
  public fullName: string = 'Technical Machine: Evolution PAR';

  public attacks: Attack[] = [{
    name: 'Evolution',
    cost: [CardType.COLORLESS],
    damage: 0,
    text: 'Choose up to 2 of your Benched Pokémon. For each of those Pokémon, search your deck for a card that evolves from that Pokémon and put it onto that Pokémon to evolve it. Then, shuffle your deck.'
  }];

  public text: string =
    'The Pokémon this card is attached to can use the attack on this card. (You still need the necessary Energy to use this attack.) If this card is attached to 1 of your Pokémon, discard it at the end of your turn.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof EndTurnEffect) {
      const player = effect.player;

      if (IS_TOOL_BLOCKED(store, state, player, this)) { return state; }

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card, index) => {
        if (cardList.tools && cardList.tools.includes(this)) {
          cardList.moveCardTo(this, player.discard);
        }
      });

      return state;
    }

    if (effect instanceof CheckAttackCostEffect && effect.attack === this.attacks[0]) {
      const pokemonCard = effect.player.active.getPokemonCard();
      if (pokemonCard && 'getColorlessReduction' in pokemonCard) {
        const colorlessReudction = (pokemonCard as ColorlessCostReducer).getColorlessReduction(state);
        for (let i = 0; i < colorlessReudction && effect.cost.includes(CardType.COLORLESS); i++) {
          const index = effect.cost.indexOf(CardType.COLORLESS);
          if (index !== -1) {
            effect.cost.splice(index, 1);
          }
        }
      }
      if (pokemonCard && 'getDarkReduction' in pokemonCard) {
        const darkReduction = (pokemonCard as DarkCostReducer).getDarkReduction(state);
        for (let i = 0; i < darkReduction && effect.cost.includes(CardType.DARK); i++) {
          const index = effect.cost.indexOf(CardType.DARK);
          if (index !== -1) {
            effect.cost.splice(index, 1);
          }
        }
      }
      if (pokemonCard && 'getWaterReduction' in pokemonCard) {
        const waterReduction = (pokemonCard as WaterCostReducer).getWaterReduction(state);
        for (let i = 0; i < waterReduction && effect.cost.includes(CardType.WATER); i++) {
          const index = effect.cost.indexOf(CardType.WATER);
          if (index !== -1) {
            effect.cost.splice(index, 1);
          }
        }
      }
    }
    if (effect instanceof CheckPokemonAttacksEffect && effect.player.active.tools.includes(this)) {
      // The effect constructor may already have included the first Tool's attacks.
      if (IS_TOOL_BLOCKED(store, state, effect.player, this)) {
        effect.attacks = effect.attacks.filter(attack => attack !== this.attacks[0]);
      } else if (!effect.attacks.includes(this.attacks[0])) {
        effect.attacks.push(this.attacks[0]);
      }
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {

      if (IS_TOOL_BLOCKED(store, state, effect.player, this)) { throw new GameError(GameMessage.CANNOT_USE_ATTACK); }

      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
