import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { PlayerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ATTACH_ENERGY_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Pikachu extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.LIGHTNING];
  public hp: number = 60;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Charge',
      cost: [CardType.LIGHTNING],
      damage: 0,
      text: 'Search your deck for a Basic Lightning Energy card and attach it to this Pokémon. Then, shuffle your deck.',
    },
    {
      name: 'Pika Punch',
      cost: [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS],
      damage: 50,
      text: '',
    },
  ];

  public set: string = 'MEW';
  public regulationMark: string = 'G';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '25';
  public name: string = 'Pikachu';
  public fullName: string = 'Pikachu MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Charge: search the deck for a Basic Lightning Energy and attach it to this Pokémon.
    // Ref: set-scarlet-and-violet/pawmot.ts (ATTACH_ENERGY_PROMPT, DECK -> ACTIVE)
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return ATTACH_ENERGY_PROMPT(
        store,
        state,
        effect.player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.DECK,
        [SlotType.ACTIVE],
        { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Lightning Energy' },
        { min: 0, max: 1, allowCancel: false },
      );
    }

    // Pika Punch is vanilla damage handled by the attack pipeline.
    return state;
  }
}
