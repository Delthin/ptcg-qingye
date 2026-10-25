import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../../game/store/card/card-types';
import { Card } from '../../../../game/store/card/card';
import { AttackEffect } from '../../../../game/store/effects/game-effects';
import { Effect } from '../../../../game/store/effects/effect';
import { PlayPokemonFromDeckEffect } from '../../../../game/store/effects/play-card-effects';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { ChooseCardsPrompt } from '../../../../game/store/prompts/choose-cards-prompt';
import { ShuffleDeckPrompt } from '../../../../game/store/prompts/shuffle-prompt';
import { GameMessage } from '../../../../game/game-message';
import { WAS_ATTACK_USED } from '../../../../game/store/prefabs/prefabs';

function* useAlluringKiss(next: () => void, store: StoreLike, state: State,
  effect: AttackEffect): IterableIterator<State> {
  const player = effect.player;
  const target = player.bench.find(bench => bench.cards.length === 0);
  if (!target) {
    return state;
  }
  let selected: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player, GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH, player.deck,
    { superType: SuperType.POKEMON, stage: Stage.BASIC },
    { min: 0, max: 1, allowCancel: false }
  ), cards => {
    selected = cards || [];
    next();
  });

  const card = selected[0];
  let played = false;
  if (card instanceof PokemonCard) {
    const playEffect = new PlayPokemonFromDeckEffect(player, card, target);
    playEffect.onPlayed.push(() => { played = true; });
    store.reduceEffect(state, playEffect);
  }
  yield store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
    player.deck.applyOrder(order);
    next();
  });

  // Retain the exact new instance/slot, even if a same-name Pokémon was already in play.
  if (!played || !target.cards.includes(card)
    || !effect.source.cards.some(attached => attached.superType === SuperType.ENERGY)) {
    return state;
  }
  return store.prompt(state, new ChooseCardsPrompt(
    player, GameMessage.CHOOSE_CARD_TO_ATTACH, effect.source,
    { superType: SuperType.ENERGY }, { min: 1, max: 1, allowCancel: false }
  ), cards => {
    if (cards && cards.length === 1) {
      effect.source.moveCardsTo(cards, target);
    }
  });
}

export class JynxHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.WATER];
  public hp = 90;
  public weakness = [{ type: CardType.METAL }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'H';

  public attacks = [
    {
      name: '引诱之吻',
      cost: [CardType.COLORLESS],
      damage: 0,
      text: '选择自己牌库中的1张【基础】宝可梦，放于备战区。并重洗牌库。然后，选择这只宝可梦身上附着的1个能量，转附于新出场的宝可梦身上。'
    },
    {
      name: '雪花冰',
      cost: [CardType.WATER],
      damage: 30,
      text: ''
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '013';
  public name = 'Jynx';
  public fullName = 'Jynx CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const generator = useAlluringKiss(() => { generator.next(); }, store, state, effect);
      return generator.next().value;
    }
    return state;
  }
}
