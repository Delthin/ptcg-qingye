import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { MOVE_CARDS, SELECT_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Kilowattrel extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Wattrel';
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Glide',
      cost: [C, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Storm Bolt',
      cost: [L, L, C],
      damage: 160,
      text: 'Move all Energy from this Pokémon to your Benched Pokémon in any way you like.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '67';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kilowattrel';
  public fullName: string = 'Kilowattrel SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      // The attacker is normally the Active Pokémon; fall back to the Bench in case
      // another effect lets this Pokémon attack from there.
      let source = player.active;
      if (source.getPokemonCard() !== this) {
        const benched = player.bench.find(slot => slot.getPokemonCard() === this);
        if (benched === undefined) {
          return state;
        }
        source = benched;
      }

      // Move the attached Energy one card at a time so the player can distribute it
      // among the Benched Pokémon "in any way you like".
      const moveEnergyToBench = (state: State, remaining: number): State => {
        const energies = source.cards.filter(card => card instanceof EnergyCard);
        const benchSlots = player.bench.filter(slot => slot.cards.length > 0);

        if (remaining <= 0 || energies.length === 0 || benchSlots.length === 0) {
          return state;
        }

        return SELECT_PROMPT(
          store,
          state,
          player,
          benchSlots.map(slot => slot.getPokemonCard()?.name ?? 'Benched Pokémon'),
          result => {
            const destination = benchSlots[result];
            const energy = energies[0];

            if (!destination || !energy) {
              return;
            }

            const next = MOVE_CARDS(store, state, source, destination, { cards: [energy] });
            moveEnergyToBench(next, remaining - 1);
          }
        );
      };

      const attachedEnergy = source.cards.filter(card => card instanceof EnergyCard).length;
      return moveEnergyToBench(state, attachedEnergy);
    }

    return state;
  }
}
