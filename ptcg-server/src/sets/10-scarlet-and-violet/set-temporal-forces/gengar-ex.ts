import { putPokemonPowerDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType, CardTag } from '../../../game/store/card/card-types';
import {
  StoreLike,
  State,
  GameMessage,
  PlayerType,
  SlotType,
  StateUtils,
  PowerType,
  AttachEnergyPrompt,
} from '../../../game';
import { Effect } from '../../../game/store/effects/game-effects';
import { AttachEnergyEffect } from '../../../game/store/effects/play-card-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Gengarex extends PokemonCard {
  protected _tags = [CardTag.POKEMON_ex];
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Haunter';
  public cardType: CardType[] = [CardType.DARK];
  public hp: number = 310;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public powers = [
    {
      name: 'Gnawing Curse',
      powerType: PowerType.ABILITY,
      text: 'Whenever your opponent attaches an Energy card from their hand to 1 of their Pokémon, put 2 damage counters on that Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Tricky Steps',
      cost: [CardType.DARK, CardType.DARK],
      damage: 160,
      text: "You may move an Energy from your opponent's Active Pokémon to 1 of their Benched Pokémon.",
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '104';
  public name: string = 'Gengar ex';
  public fullName: string = 'Gengar ex TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const hasBench = opponent.bench.some((b) => b.cards.length > 0);

      if (hasBench === false) {
        return state;
      }

      return store.prompt(
        state,
        new AttachEnergyPrompt(
          player.id,
          GameMessage.ATTACH_ENERGY_TO_BENCH,
          opponent.active,
          PlayerType.TOP_PLAYER,
          [SlotType.BENCH],
          { superType: SuperType.ENERGY },
          { allowCancel: false, min: 0, max: 1 },
        ),
        (transfers) => {
          transfers = transfers || [];
          for (const transfer of transfers) {
            const target = StateUtils.getTarget(state, player, transfer.to);
            opponent.active.moveCardTo(transfer.card, target);
          }
        },
      );
    }

    if (effect instanceof AttachEnergyEffect) {
      const source = StateUtils.findPokemonSlot(state, this);
      if (!source || source.getPokemonCard() !== this) return state;
      const owner = StateUtils.findOwner(state, source);
      if (effect.player === owner || effect.source !== effect.player.hand) return state;
      if (IS_ABILITY_BLOCKED(store, state, owner, this)) return state;
      effect.onAttached.push(() => {
        state = putPokemonPowerDamageCounters(store, state, this, effect.target, 20);
      });
    }
    return state;
  }
}
