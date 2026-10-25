import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Exeggutor extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Exeggcute';
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Hypnoblast',
      cost: [P, C],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
    {
      name: 'Psychic Loop',
      cost: [P, P, C],
      damage: 160,
      text: 'Put 2 Energy attached to this Pokémon into your hand.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '24';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Exeggutor';
  public fullName: string = 'Exeggutor PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const pokemon = player.active;
      const attachedEnergy = pokemon.energies.cards;
      const count = Math.min(2, attachedEnergy.length);

      if (count === 0) {
        return state;
      }

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_HAND,
        pokemon.energies,
        { superType: SuperType.ENERGY },
        { min: count, max: count, allowCancel: false },
      ), selected => {
        if (!selected || selected.length === 0) {
          return state;
        }
        state = MOVE_CARDS(store, state, pokemon.energies, player.hand, { cards: selected });
      }) ?? state;
    }

    return state;
  }
}
