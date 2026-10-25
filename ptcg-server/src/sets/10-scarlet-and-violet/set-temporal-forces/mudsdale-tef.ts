import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Mudsdale extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Mudbray';
  public cardType: CardType[] = [F];
  public hp: number = 150;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Mud Stock',
      cost: [F],
      damage: 0,
      text: 'Attach a Basic Fighting Energy card from your discard pile to each of your Benched Pokémon.',
    },
    {
      name: 'High Horsepower',
      cost: [F, C, C],
      damage: 140,
      text: 'This Pokémon also does 40 damage to itself.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '92';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mudsdale';
  public fullName: string = 'Mudsdale TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const bench = player.bench.filter(slot => slot.cards.length > 0);

      bench.forEach(slot => {
        const energyCard = player.discard.cards.find(card =>
          card instanceof EnergyCard
          && card.energyType === EnergyType.BASIC
          && card.provides.includes(CardType.FIGHTING));

        if (energyCard === undefined) {
          return;
        }

        state = MOVE_CARDS(store, state, player.discard, slot, { cards: [energyCard] });
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 40);
    }

    return state;
  }
}
