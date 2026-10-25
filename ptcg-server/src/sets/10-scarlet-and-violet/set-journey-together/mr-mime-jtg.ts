import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, SHUFFLE_HAND_INTO_DECK_THEN_DRAW, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED } from '../../../game/store/prefabs/attack-effects';

export class MrMime extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Mimic',
      cost: [P],
      damage: 0,
      text: 'Shuffle your hand into your deck. Then, draw a card for each card in your opponent\'s hand.'
    },
    {
      name: 'Psy Bolt',
      cost: [P, C],
      damage: 40,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.'
    }
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '58';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mr. Mime';
  public fullName: string = 'Mr. Mime JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Mimic
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      state = SHUFFLE_HAND_INTO_DECK_THEN_DRAW(store, state, player, {
        drawCount: opponent.hand.cards.length,
        sourceCard: this,
      });
    }

    // Psy Bolt
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const attackEffect = effect;

      COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, attackEffect);
        }
      });
    }

    return state;
  }
}
