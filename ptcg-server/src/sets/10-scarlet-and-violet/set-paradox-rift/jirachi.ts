import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, State, StateUtils, StoreLike } from '../../../game';
import { PutCountersEffect } from '../../../game/store/effects/attack-effects';
import { Effect } from '../../../game/store/effects/effect';

export class Jirachi extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public regulationMark = 'G';

  public cardType: CardType[] = [CardType.METAL];

  public hp: number = 70;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.GRASS, value: -30 }];

  public retreat = [CardType.COLORLESS];

  public powers = [{
    name: 'Stellar Veil',
    powerType: PowerType.ABILITY,
    text: 'Attacks from your opponent\'s Basic Pokémon can\'t put damage counters on your Benched Pokémon.'
  }
  ];

  public attacks = [{
    name: 'Charge Energy',
    cost: [CardType.COLORLESS],
    damage: 0,
    text: 'Search your deck for up to 2 Basic Energy cards, reveal them, and put them into your hand. Then, shuffle your deck.'
  }
  ];

  public set: string = 'PAR';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '126';

  public name: string = 'Jirachi';

  public fullName: string = 'Jirachi PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof PutCountersEffect)) return state;
    const owner = StateUtils.findOwner(state, effect.target);
    if (owner === effect.player || effect.target === owner.active) return state;
    let inPlay = false;
    owner.forEachPokemon(PlayerType.BOTTOM_PLAYER, (_list, card) => { if (card === this) inPlay = true; });
    if (!inPlay || IS_ABILITY_BLOCKED(store, state, owner, this)) return state;
    if (effect.source.getPokemonCard()?.stage === Stage.BASIC) effect.preventDefault = true;
    return state;
  }
}
