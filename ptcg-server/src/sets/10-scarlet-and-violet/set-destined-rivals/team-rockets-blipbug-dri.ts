import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SELECT_PROMPT, SHOW_CARDS_TO_PLAYER, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class TeamRocketsBlipbug extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 60;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Searching Eyes',
      cost: [C],
      damage: 0,
      text: 'Look at 1 of your opponent\'s face-down Prize cards.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '15';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Team Rocket\'s Blipbug';
  public fullName: string = 'Team Rocket\'s Blipbug DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const faceDownPrizes = opponent.prizes.filter(prize => prize.cards.length > 0);

      if (faceDownPrizes.length === 0) {
        return state;
      }

      const labels = faceDownPrizes.map((_prize, index) => 'Face-down Prize card ' + (index + 1));

      state = SELECT_PROMPT(store, state, player, labels, (index) => {
        const prize = faceDownPrizes[index];
        if (prize === undefined) {
          return;
        }

        // The chosen Prize card is only looked at; it stays in its slot.
        SHOW_CARDS_TO_PLAYER(store, state, player, prize.cards.slice(0, 1));
      });
    }

    return state;
  }
}
