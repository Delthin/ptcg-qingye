import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

type CardLike = Parameters<typeof StateUtils.findCardList>[1];

export class Milotic extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Feebas';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public retreat = [C];

  public powers = [{
    name: 'Mentally Calm',
    powerType: PowerType.ABILITY,
    text: 'Your opponent\'s Pokémon in play and all attached cards can\'t be put into your opponent\'s hand.',
  }];

  public attacks = [{
    name: 'Hydro Splash',
    cost: [W, C, C],
    damage: 100,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '50';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Milotic';
  public fullName: string = 'Milotic TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Mentally Calm: Your opponent's Pokémon in play and all attached cards
    // can't be put into your opponent's hand.
    const moveEffect = effect as Effect & {
      cards?: unknown[];
      source?: unknown;
      destination?: unknown;
      preventDefault?: boolean;
    };

    // Only card-move effects with a destination are relevant.
    if (moveEffect.destination === undefined) {
      return state;
    }

    const selfCardList = StateUtils.findCardList(state, this);
    const owner = state.players.find(player =>
      player.active === selfCardList || player.bench.some(benchSlot => benchSlot === selfCardList));

    // The Ability only applies while this Pokémon is in play.
    if (owner === undefined) {
      return state;
    }

    const opponent = state.players.find(player => player !== owner);
    if (opponent === undefined) {
      return state;
    }

    // Only moves that would put cards into that opponent's hand are locked.
    if (moveEffect.destination !== opponent.hand) {
      return state;
    }

    const movedCards = Array.isArray(moveEffect.cards) ? moveEffect.cards : [];

    const isOpponentPokemonOrAttached = moveEffect.source === opponent.active
      || opponent.bench.some(benchSlot => benchSlot === moveEffect.source)
      || movedCards.some(card => {
        const cardList = StateUtils.findCardList(state, card as CardLike);
        return cardList === opponent.active || opponent.bench.some(benchSlot => benchSlot === cardList);
      });

    if (!isOpponentPokemonOrAttached) {
      return state;
    }

    // Respect effects that turn off Abilities.
    if (IS_ABILITY_BLOCKED(store, state, owner, this)) {
      return state;
    }

    if (typeof moveEffect.preventDefault === 'boolean') {
      moveEffect.preventDefault = true;
    }

    return state;
  }
}
