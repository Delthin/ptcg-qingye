import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, GameMessage, Player, PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ABILITY_USED, CONFIRMATION_PROMPT, IS_ABILITY_BLOCKED, JUST_EVOLVED, MOVE_CARDS, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Milotic extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Feebas';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public powers = [{
    name: 'Lifeboat',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, when you play this Pokémon from your hand to evolve 1 of your Pokémon, ' +
      'you may use this Ability. Each player puts a Basic Pokémon from their discard pile onto their Bench. ' +
      '(Your opponent puts a Basic Pokémon onto their Bench first.)'
  }];

  public attacks = [{
    name: 'Hypno Splash',
    cost: [W, C],
    damage: 60,
    text: 'Your opponent\'s Active Pokémon is now Asleep.'
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '36';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Milotic';
  public fullName: string = 'Milotic PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const opponent = StateUtils.getOpponent(state, player);

      const putBasicOnBench = (targetPlayer: Player, onDone: () => void) => {
        const benchSlot = targetPlayer.bench.find(slot => slot.cards.length === 0);
        const basicsInDiscard = targetPlayer.discard.cards.filter(
          card => card instanceof PokemonCard && card.stage === Stage.BASIC
        );

        if (benchSlot === undefined || basicsInDiscard.length === 0) {
          onDone();
          return;
        }

        store.prompt(state, new ChooseCardsPrompt(
          targetPlayer,
          GameMessage.CHOOSE_CARD_TO_DECK,
          targetPlayer.discard,
          { superType: SuperType.POKEMON, stage: Stage.BASIC },
          { min: 1, max: 1, allowCancel: false }
        ), cards => {
          if (cards !== undefined && cards.length > 0) {
            MOVE_CARDS(store, state, targetPlayer.discard, benchSlot, { cards });
          }
          onDone();
        });
      };

      state = CONFIRMATION_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        ABILITY_USED(player, this);

        putBasicOnBench(opponent, () => {
          putBasicOnBench(player, () => {
            // Both players have finished placing a Basic Pokémon.
          });
        });
      });
    }

    return state;
  }
}
