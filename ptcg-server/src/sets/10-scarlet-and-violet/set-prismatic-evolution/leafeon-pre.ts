import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType, SuperType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ATTACH_ENERGY_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Leafeon extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Eevee';
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Leaflet Blessings',
      cost: [C],
      damage: 0,
      text: 'Attach a Basic Grass Energy card from your hand to 1 of your Benched Pokémon. If you do, heal all damage from that Pokémon.',
    },
    {
      name: 'Solar Beam',
      cost: [G, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '5';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Leafeon';
  public fullName: string = 'Leafeon PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const bench = player.bench.filter(b => b.cards.length > 0);
      if (bench.length === 0) {
        return state;
      }

      const hasBasicGrassEnergy = player.hand.cards.some(card =>
        card instanceof EnergyCard
        && card.energyType === EnergyType.BASIC
        && card.provides.includes(G));
      if (!hasBasicGrassEnergy) {
        return state;
      }

      // Snapshot the amount of Energy attached to each Benched Pokémon so that
      // the Pokémon that received the Energy can be identified afterwards.
      const energyBefore = bench.map(b => b.cards.filter(c => c instanceof EnergyCard).length);

      state = ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.HAND,
        [SlotType.BENCH],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, provides: [G] },
        { allowCancel: false, min: 1, max: 1 },
      );

      // If an Energy was attached, heal all damage from that Pokémon.
      bench.forEach((cardList, index) => {
        const energyAfter = cardList.cards.filter(c => c instanceof EnergyCard).length;
        if (energyAfter > energyBefore[index]) {
          cardList.damage = 0;
        }
      });
    }

    return state;
  }
}
