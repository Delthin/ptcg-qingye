import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, ChoosePokemonPrompt, GameMessage, PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class MewtwoV extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 220;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_V];

  public attacks = [
    {
      name: 'Super Psy Bolt',
      cost: [P, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Transfer Break',
      cost: [P, P, C],
      damage: 160,
      text: 'Move an Energy from this Pokémon to 1 of your Benched Pokémon.',
    },
  ];

  public regulationMark = 'F';
  public set: string = 'PGO';
  public setNumber: string = '30';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mewtwo V';
  public fullName: string = 'Mewtwo V PGO';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const pokemon = player.active;
      const bench = player.bench.filter(b => b.cards.length > 0);

      if (pokemon.getPokemonCard() !== this || bench.length === 0 || pokemon.energies.cards.length === 0) {
        return state;
      }

      state = store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,
        PlayerType.BOTTOM_PLAYER,
        [SlotType.BENCH],
        { min: 1, max: 1, allowCancel: false },
      ), (results) => {
        const targets = results ?? [];
        if (targets.length === 0) {
          return;
        }
        const target = targets[0];

        if (pokemon.energies.cards.length === 1) {
          state = MOVE_CARDS(store, state, pokemon.energies, target.energies, {
            cards: [pokemon.energies.cards[0]],
          });
          return;
        }

        state = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
          pokemon.energies,
          {},
          { min: 1, max: 1, allowCancel: false },
        ), (cards) => {
          if (cards.length > 0) {
            state = MOVE_CARDS(store, state, pokemon.energies, target.energies, {
              cards: [cards[0]],
            });
          }
        }) ?? state;
      }) ?? state;

      return state;
    }

    return state;
  }
}
