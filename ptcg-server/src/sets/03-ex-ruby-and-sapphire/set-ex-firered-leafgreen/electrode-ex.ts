import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType, CardTag } from '../../../game/store/card/card-types';
import {
  PowerType,
  StoreLike,
  State,
  StateUtils,
  GameMessage,
  GamePhase,
  GameError,
  PlayerType,
  SlotType,
  PokemonCardList,
  AttachEnergyPrompt,
  CardTarget,
  DiscardEnergyPrompt,
} from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { checkState } from '../../../game/store/effect-reducers/check-effect';
import {
  ABILITY_USED,
  BLOCK_IF_HAS_SPECIAL_CONDITION,
  WAS_ATTACK_USED,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class Electrodeex extends PokemonCard {
  protected _tags = [CardTag.POKEMON_ex];
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Voltorb';
  public cardType: CardType[] = [L];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public powers = [
    {
      name: 'Extra Energy Bomb',
      useWhenInPlay: true,
      powerType: PowerType.POKEPOWER,
      knocksOutSelf: true,
      text: "Once during your turn (before your attack), you may discard Electrode ex and all the cards attached to it (this counts as Knocking Out Electrode ex). If you do, search your discard pile for 5 Energy cards and attach them to any of your Pokémon (excluding Pokémon-ex) in any way you like. This power can't be used if Electrode ex is affected by a Special Condition.",
    },
  ];

  public attacks = [
    {
      name: 'Crash and Burn',
      cost: [L, C],
      damage: 30,
      damageCalculation: '+',
      text: 'You may discard as many Energy as you like attached to your Pokémon in play. If you do, this attack does 30 damage plus 20 more damage for each Energy you discarded.',
    },
  ];

  public set: string = 'RG';
  public name: string = 'Electrode ex';
  public fullName: string = 'Electrode ex RG';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '107';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    //Extra Energy Bomb
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      BLOCK_IF_HAS_SPECIAL_CONDITION(player, this);
      const cardList = StateUtils.findCardList(state, this) as PokemonCardList;
      const recoverableEnergy = [...player.discard.cards, ...cardList.cards]
        .some(card => card.superType === SuperType.ENERGY);
      let validTargets = 0;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (_list, card) => {
        if (card !== this && !card.hasTag(CardTag.POKEMON_ex)) validTargets++;
      });
      // No ruling authorizes using this solely to KO itself with no recoverable Energy.
      if (!recoverableEnergy || validTargets === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
      ABILITY_USED(player, this);
      cardList.damage += 999;

      // This older ex explicitly KOs first. Reuse the engine's KO/prize completion
      // callback so its original attached energies enter discard before selection.
      return checkState(store, state, () => {
        if (state.phase === GamePhase.FINISHED) return;
        const count = Math.min(5, player.discard.cards.filter(card => card.superType === SuperType.ENERGY).length);
        const blockedTo: CardTarget[] = [];
        let remainingTargets = 0;
        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (_list, card, target) => {
          if (card.hasTag(CardTag.POKEMON_ex)) blockedTo.push(target);
          else remainingTargets++;
        });
        if (count === 0 || remainingTargets === 0) return;
        store.prompt(state, new AttachEnergyPrompt(
          player.id,
          GameMessage.ATTACH_ENERGY_CARDS,
          player.discard,
          PlayerType.BOTTOM_PLAYER,
          [SlotType.BENCH, SlotType.ACTIVE],
          { superType: SuperType.ENERGY },
          { allowCancel: false, min: count, max: count, blockedTo },
        ), transfers => {
          for (const transfer of transfers || []) {
            const target = StateUtils.getTarget(state, player, transfer.to);
            player.discard.moveCardTo(transfer.card, target);
          }
        });
      });
    }

    //Power Move attack
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      let totalEnergy = 0;
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList) => {
        const energyCount = cardList.cards.filter(
          (card) => card.superType === SuperType.ENERGY,
        ).length;
        totalEnergy += energyCount;
      });

      return store.prompt(
        state,
        new DiscardEnergyPrompt(
          player.id,
          GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
          PlayerType.BOTTOM_PLAYER,
          [SlotType.ACTIVE, SlotType.BENCH],
          { superType: SuperType.ENERGY },
          { min: 1, max: totalEnergy, allowCancel: false },
        ),
        (transfers) => {
          if (transfers === null) {
            return state;
          }

          // Move all selected energies to discard
          transfers.forEach((transfer) => {
            const source = StateUtils.getTarget(state, player, transfer.from);
            source.moveCardTo(transfer.card, player.discard);
          });

          // Set damage based on number of discarded cards
          effect.damage += transfers.length * 20;
          return state;
        },
      );
    }
    return state;
  }
}
