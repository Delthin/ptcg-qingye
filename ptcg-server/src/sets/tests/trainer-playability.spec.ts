import { GameError } from '../../game/game-error';
import { GameLog, GameMessage } from '../../game/game-message';
import { TrainerCard } from '../../game/store/card/trainer-card';
import { Format, TrainerType } from '../../game/store/card/card-types';
import { Vileplume } from '../07-x-and-y/set-ancient-origins/vileplume';
import { Switch as SwitchSVI } from '../10-scarlet-and-violet/set-scarlet-and-violet/switch';
import { FirstTicket } from '../06-black-and-white/set-dragon-vault/first-ticket';
import { Nugget } from '../09-sword-and-shield/set-rebel-clash/nugget';
import { FarewellBell } from '../09-sword-and-shield/set-fusion-strike/farewell-bell';
import { Effect } from '../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../game/store/effects/check-effects';
import { TrainerEffect } from '../../game/store/effects/play-card-effects';
import { CAN_PLAY_TRAINER_CARD } from '../../game/store/prefabs/trainer-prefabs';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';
import { ChooseCardsPromptType } from '../../game/store/prompts/choose-cards-prompt';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ChoosePokemonPromptType } from '../../game/store/prompts/choose-pokemon-prompt';
import { StateUtils } from '../../game/store/state-utils';
import { State } from '../../game/store/state/state';
import { StoreLike } from '../../game/store/store-like';
import { playTrainerCard } from './card-test-helpers';
import { getCardByName, padDeck, setupGame } from './test-helpers';

// Printed-text oracles: Arezu searches up to 3 non-Rule-Box Evolution Pokemon,
// without an extra hand-card cost; Switch swaps the Active with a Benched Pokemon.
// Checking either card must not play it, sort/move its cards, or open real prompts.
function legacyGame(card = 'Arezu LOR', bench = true) {
  return setupGame({
    turn: 3,
    player1: {
      active: { card: 'Ralts SIT' },
      bench: bench ? [{ card: 'Manaphy BRS' }] : [],
      hand: [card],
      deck: ['Kirlia CRE', ...padDeck(8)],
    },
    player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
  });
}

function isPlayable(game: ReturnType<typeof legacyGame>): boolean {
  return CAN_PLAY_TRAINER_CARD(game.store, game.state, game.player1,
    game.player1.hand.cards[0] as TrainerCard);
}

class MutatingLegacyTrainer extends TrainerCard {
  public set = 'TEST';
  public fullName = 'Legacy probe TEST';
  public name = 'Legacy probe';
  public fail = false;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      // A clone must keep both card identity and class prototypes intact.
      const list = StateUtils.findCardList(state, this);
      if (StateUtils.findOwner(state, list) !== effect.player) {
        throw new GameError(GameMessage.INVALID_TARGET);
      }
      this.text = 'changed by effect';
      this.marker.addMarker('CARD_PROBE', this);
      effect.player.marker.addMarker('PLAYER_PROBE', this);
      effect.player.deck.moveTo(effect.player.discard, 1);
      effect.player.hand.moveCardTo(this, effect.player.supporter);
      effect.player.supporterTurn++;
      store.log(state, GameLog.LOG_PLAYER_PLAYS_ITEM, { card: this.name });
      if (this.fail) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      return store.prompt(state, new ConfirmPrompt(effect.player.id, GameMessage.CHOOSE_CARD_TO_HAND),
        () => { this.name = 'callback ran'; });
    }
    return state;
  }
}

class UnimplementedTrainer extends TrainerCard {
  public set = 'TEST';
  public fullName = 'Unimplemented TEST';
  public name = 'Unimplemented';
}

describe('Trainer family audit regressions', () => {
  for (const CardClass of [FirstTicket, Nugget]) {
    it(`keeps the unsupported passive trainer ${CardClass.name} disabled`, () => {
      const game = legacyGame();
      const trainer = new CardClass();
      trainer.id = 9400;
      game.player1.hand.cards = [trainer];
      expect(isPlayable(game)).toBe(false);
      expect(game.player1.hand.cards).toEqual([trainer]);
      expect(game.player1.discard.cards.length).toBe(0);
    });
  }

  it('attaches Farewell Bell as a Tool instead of discarding it as an Item', () => {
    const game = legacyGame('Arezu LOR', false);
    const trainer = new FarewellBell();
    trainer.id = 9401;
    game.player1.hand.cards = [trainer];
    expect(trainer.trainerType).toBe(TrainerType.TOOL);
    expect(isPlayable(game)).toBe(true);
    playTrainerCard(game.store, game.state, 0, trainer.fullName);
    expect(game.player1.active.tools).toEqual([trainer]);
    expect(game.player1.hand.cards.length).toBe(0);
    expect(game.player1.discard.cards).not.toContain(trainer);
    expect(game.player1.supporter.cards.length).toBe(0);
  });
});

describe('Trainer playability compatibility', () => {
  for (const name of ['Arezu LOR', 'Switch SUM', 'Switch SSH', "Colress's Experiment LOR"]) {
    it(`allows the implemented legacy trainer ${name} when its printed conditions are met`, () => {
      expect(isPlayable(legacyGame(name))).toBe(true);
    });
  }

  it('publishes legacy cards in the real Store playableCardIds without playing them', () => {
    const game = legacyGame('Switch SUM');
    const trainer = game.player1.hand.cards[0];
    game.store.reduceEffect(game.state, new CheckProvidedEnergyEffect(game.player1));
    expect(game.player1.playableCardIds).toContain(trainer.id);
    expect(game.player1.hand.cards).toContain(trainer);
    expect(game.player1.supporter.cards.length).toBe(0);
    expect(game.state.prompts.length).toBe(0);
    expect(game.store.hasPrompts()).toBe(false);
  });

  for (const name of ['Switch SUM', 'Switch SSH']) {
    it(`still rejects ${name} without a Benched Pokemon`, () => {
      expect(isPlayable(legacyGame(name, false))).toBe(false);
    });
  }

  it('preserves an explicit canPlay false rather than falling back to effect execution', () => {
    const game = legacyGame('Switch SUM', false);
    const trainer = new SwitchSVI();
    trainer.id = 9300;
    game.player1.hand.cards = [trainer];
    expect(isPlayable(game)).toBe(false);
  });

  it('falls back when a canPlay method reports unknown', () => {
    const game = legacyGame('Switch SUM');
    (game.player1.hand.cards[0] as TrainerCard).canPlay = () => undefined;
    expect(isPlayable(game)).toBe(true);
  });

  it('keeps turn, Supporter-use and trainer-lock restrictions for legacy cards', () => {
    const game = legacyGame();
    game.state.turn = 1;
    expect(isPlayable(game)).toBe(false);
    game.state.turn = 3;
    game.player1.supporterTurn = 1;
    expect(isPlayable(game)).toBe(false);
    game.player1.supporterTurn = 0;
    game.player1.cannotPlaySupporterCards = true;
    expect(isPlayable(game)).toBe(false);
    game.player1.cannotPlaySupporterCards = false;
    game.state.activePlayer = 1;
    expect(isPlayable(game)).toBe(false);
    const item = legacyGame('Switch SUM');
    item.player1.cannotPlayItemCards = true;
    expect(isPlayable(item)).toBe(false);
  });

  it('checks repeated deck-moving effects without changing deck order or queues', () => {
    const game = legacyGame("Colress's Experiment LOR");
    const deck = game.player1.deck.cards.slice();
    const hand = game.player1.hand.cards.slice();
    for (let i = 0; i < 3; i++) expect(isPlayable(game)).toBe(true);
    expect(game.player1.deck.cards).toEqual(deck);
    expect(game.player1.hand.cards).toEqual(hand);
    expect(game.player1.supporter.cards.length).toBe(0);
    expect(game.player1.lostzone.cards.length).toBe(0);
    expect(game.state.logs.length).toBe(0);
    expect(game.state.prompts.length).toBe(0);
    expect(game.store.hasPrompts()).toBe(false);
  });

  for (const fail of [false, true]) {
    it(`isolates card, marker, zone and log mutations when a probe ${fail ? 'throws' : 'succeeds'}`, () => {
      const game = legacyGame();
      const trainer = new MutatingLegacyTrainer();
      trainer.id = 9000;
      trainer.fail = fail;
      game.player1.hand.cards = [trainer];
      const deck = game.player1.deck.cards.slice();
      expect(isPlayable(game)).toBe(!fail);
      expect(trainer.text).toBe('');
      expect(trainer.name).toBe('Legacy probe');
      expect(trainer.marker.hasMarker('CARD_PROBE')).toBe(false);
      expect(game.player1.marker.hasMarker('PLAYER_PROBE')).toBe(false);
      expect(game.player1.deck.cards).toEqual(deck);
      expect(game.player1.discard.cards.length).toBe(0);
      expect(game.player1.hand.cards).toEqual([trainer]);
      expect(game.player1.supporter.cards.length).toBe(0);
      expect(game.player1.supporterTurn).toBe(0);
      expect(game.state.logs.length).toBe(0);
      expect(game.state.prompts.length).toBe(0);
      expect(game.store.hasPrompts()).toBe(false);
    });
  }

  it('leaves an existing real prompt and its callback untouched', () => {
    const game = legacyGame('Switch SUM');
    let called = false;
    const prompt = new ConfirmPrompt(game.player1.id, GameMessage.CHOOSE_CARD_TO_HAND);
    game.store.prompt(game.state, prompt, () => { called = true; });
    expect(isPlayable(game)).toBe(true);
    expect(game.state.prompts).toEqual([prompt]);
    expect(game.store.hasPrompts()).toBe(true);
    expect(called).toBe(false);
  });

  it('does not enable a trainer with only the base Card effect handler', () => {
    const game = legacyGame();
    const trainer = new UnimplementedTrainer();
    trainer.id = 9103;
    game.player1.hand.cards = [trainer];
    expect(isPlayable(game)).toBe(false);
    expect(game.player1.hand.cards).toEqual([trainer]);
  });

  it('lets Arezu search a nonempty deck with zero matching Pokemon, but not an empty deck', () => {
    const game = legacyGame();
    game.player1.deck.cards = game.player1.deck.cards.filter(c => c.fullName !== 'Kirlia CRE');
    expect(isPlayable(game)).toBe(true);
    game.overridePrompt(ChooseCardsPromptType, () => []);
    playTrainerCard(game.store, game.state, 0, 'Arezu LOR');
    expect(game.player1.hand.cards.length).toBe(0);
    expect(game.player1.discard.cards.some(c => c.fullName === 'Arezu LOR')).toBe(true);
    const empty = legacyGame();
    empty.player1.deck.cards = [];
    expect(isPlayable(empty)).toBe(false);
  });

  it('honors outer PlayItemEffect ability locks while probing a legacy Item', () => {
    const game = legacyGame('Switch SUM');
    const blocker = new Vileplume();
    blocker.id = 9100;
    game.player2.active.cards = [blocker];
    expect(isPlayable(game)).toBe(false);
    expect(game.player1.hand.cards[0].fullName).toBe('Switch SUM');
    expect(game.state.prompts.length).toBe(0);
  });

  it('checks a no-prompt draw effect without recursion or drawing real cards', () => {
    const game = legacyGame('Bill BS');
    const deck = game.player1.deck.cards.slice();
    expect(isPlayable(game)).toBe(true);
    expect(game.player1.deck.cards).toEqual(deck);
    expect(game.player1.hand.cards.map(c => c.fullName)).toEqual(['Bill BS']);
    game.player1.deck.cards = [];
    expect(isPlayable(game)).toBe(false);
  });

  it('preserves format overrides and nested effect execution in an isolated Store', () => {
    const game = legacyGame();
    const trainer = new MutatingLegacyTrainer();
    trainer.id = 9101;
    trainer.name = 'Great Ball';
    trainer.fail = true;
    game.player1.hand.cards = [trainer];
    (game.store as any).handler.gameSettings = { format: Format.RSPK };
    expect(isPlayable(game)).toBe(true);
    expect(trainer.text).toBe('');
    expect(game.player1.hand.cards).toEqual([trainer]);
    expect(game.state.prompts.length).toBe(0);
    expect(game.store.hasPrompts()).toBe(false);
  });

  it('keeps object-graph aliases and cycles without sharing mutable arrays', () => {
    const game = legacyGame();
    const trainer = new MutatingLegacyTrainer();
    trainer.id = 9102;
    const shared: any[] = [];
    shared.push(shared);
    Object.assign(trainer, { left: shared, right: shared });
    const original = trainer.reduceEffect;
    trainer.reduceEffect = function (store, state, effect) {
      if (effect instanceof TrainerEffect && effect.trainerCard === this) {
        const copy = this as any;
        if (copy.left !== copy.right || copy.left[0] !== copy.left) {
          throw new GameError(GameMessage.INVALID_TARGET);
        }
        copy.left.push('probe only');
      }
      return original.call(this, store, state, effect);
    };
    game.player1.hand.cards = [trainer];
    expect(isPlayable(game)).toBe(true);
    expect(shared.length).toBe(1);
    expect(shared[0]).toBe(shared);
  });

  it('executes Arezu with no other hand card and filters Rule-Box and Basic Pokemon', () => {
    const game = legacyGame();
    const ruleBox = getCardByName('Gholdengo ex PAR');
    ruleBox.id = 9200;
    const basic = getCardByName('Ralts SIT');
    basic.id = 9201;
    game.player1.deck.cards.push(ruleBox, basic);
    game.overridePrompt(ChooseCardsPromptType, prompt => {
      const choose = prompt as any;
      const cards = choose.cards.cards;
      const basic = cards.findIndex((c: any) => c.fullName === 'Ralts SIT');
      const ruleBox = cards.findIndex((c: any) => c.fullName === 'Gholdengo ex PAR');
      expect(choose.options.blocked).toContain(basic);
      expect(choose.options.blocked).toContain(ruleBox);
      return [cards.findIndex((c: any) => c.fullName === 'Kirlia CRE')];
    });
    playTrainerCard(game.store, game.state, 0, 'Arezu LOR');
    expect(game.player1.hand.cards.map(c => c.fullName)).toEqual(['Kirlia CRE']);
    expect(game.player1.discard.cards.some(c => c.fullName === 'Arezu LOR')).toBe(true);
    expect(game.player1.supporterTurn).toBe(1);
    expect(game.store.hasPrompts()).toBe(false);
  });

  it('executes the Chinese-pool Switch printing and consumes only the played Item', () => {
    const game = legacyGame('Switch SUM');
    game.overridePrompt(ChoosePokemonPromptType, () => [
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 },
    ]);
    playTrainerCard(game.store, game.state, 0, 'Switch SUM');
    expect(game.player1.active.getPokemonCard()?.fullName).toBe('Manaphy BRS');
    expect(game.player1.bench[0].getPokemonCard()?.fullName).toBe('Ralts SIT');
    expect(game.player1.discard.cards.some(c => c.fullName === 'Switch SUM')).toBe(true);
    expect(game.player1.supporterTurn).toBe(0);
    expect(game.store.hasPrompts()).toBe(false);
  });
});
