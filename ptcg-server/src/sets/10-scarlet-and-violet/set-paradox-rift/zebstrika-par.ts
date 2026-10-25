import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { State, StoreLike, PlayerType, SlotType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_ENERGY_PROMPT,
  GET_PLAYER_PRIZES,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Zebstrika extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Blitzle';
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Burst of Braying',
      cost: [L],
      damage: 0,
      text: 'Choose Basic Lightning Energy cards from your discard pile up to the number of Prize cards your opponent has taken and attach them to your Pokémon in any way you like.',
    },
    {
      name: 'Thunder',
      cost: [L, C, C],
      damage: 150,
      text: 'This Pokémon also does 50 damage to itself.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '63';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zebstrika';
  public fullName: string = 'Zebstrika PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      // Prize cards your opponent has taken = total prize slots minus cards still left.
      const prizesTaken = 6 - GET_PLAYER_PRIZES(opponent)
        .reduce((left, prize) => left + prize.cards.length, 0);

      if (prizesTaken <= 0) {
        return state;
      }

      state = ATTACH_ENERGY_PROMPT(store, state, player, PlayerType.BOTTOM_PLAYER, SlotType.DISCARD,
        [SlotType.ACTIVE, SlotType.BENCH], { energyType: EnergyType.BASIC, name: 'Lightning Energy' },
        { min: 0, max: prizesTaken, allowCancel: false });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 50);
    }

    return state;
  }
}
