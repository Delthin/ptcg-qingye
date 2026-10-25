import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, SHUFFLE_HAND_INTO_DECK_THEN_DRAW, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED } from '../../../game/store/prefabs/attack-effects';

export class Oricorio extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Pep Up',
      cost: [C],
      damage: 0,
      text: 'Shuffle your hand into your deck. Then, draw a card for each Benched Pokémon (both yours and your opponent\'s).',
    },
    {
      name: 'Volt Wave',
      cost: [L, C],
      damage: 50,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '67';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Oricorio';
  public fullName: string = 'Oricorio PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const benchedCount =
        player.bench.filter(b => b.cards.length > 0).length +
        opponent.bench.filter(b => b.cards.length > 0).length;

      state = SHUFFLE_HAND_INTO_DECK_THEN_DRAW(store, state, player, {
        drawCount: benchedCount,
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const attackEffect = effect;

      state = COIN_FLIP_PROMPT(store, state, attackEffect.player, result => {
        if (result) {
          YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_PARALYZED(store, state, attackEffect);
        }
      });
    }

    return state;
  }
}
