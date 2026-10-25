import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Excadrill extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Drilbur';
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Digging Claw',
      cost: [C],
      damage: 20,
      text: 'Discard the top card of your opponent\'s deck.'
    },
    {
      name: 'Drill Smash',
      cost: [F, C],
      damage: 60,
      damageCalculation: '+',
      text: 'If you have any Metal Pokémon on your Bench, this attack does 80 more damage.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '109';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Excadrill';
  public fullName: string = 'Excadrill SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Digging Claw: discard the top card of your opponent's deck
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const topCard = opponent.deck.cards[0];

      if (topCard !== undefined) {
        state = MOVE_CARDS(store, state, opponent.deck, opponent.discard, {
          cards: [topCard],
          sourceCard: this,
          sourceEffect: effect
        });
      }
    }

    // Drill Smash: +80 damage if you have any [M] Pokemon on your Bench
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const hasMetalPokemonOnBench = player.bench.some(benchSpot => {
        if (benchSpot.cards.length === 0) {
          return false;
        }

        const pokemon = benchSpot.getPokemonCard();
        return pokemon !== undefined && pokemon.cardType.includes(CardType.METAL);
      });

      if (hasMetalPokemonOnBench) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 80);
      }
    }

    return state;
  }
}
