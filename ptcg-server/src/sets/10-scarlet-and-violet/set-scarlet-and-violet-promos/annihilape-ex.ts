import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import {
  DamageMap,
  GameMessage,
  PlayerType,
  PutDamagePrompt,
  SlotType,
  StateUtils,
} from '../../../game';
import { PutCountersEffect } from '../../../game/store/effects/attack-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

function* useAngryGrudge(
  next: Function,
  store: StoreLike,
  state: State,
  effect: AttackEffect,
): IterableIterator<State> {
  const player = effect.player;
  const damage = 120;
  const maxAllowedDamage: DamageMap[] = [{
    target: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 },
    damage: player.active.damage + damage,
  }];

  return store.prompt(
    state,
    new PutDamagePrompt(
      effect.player.id,
      GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      PlayerType.BOTTOM_PLAYER,
      [SlotType.ACTIVE],
      damage,
      maxAllowedDamage,
      { allowCancel: false, allowPlacePartialDamage: true },
    ),
    (targets) => {
      const results = targets || [];
      effect.damage = 0;
      for (const result of results) {
        const target = StateUtils.getTarget(state, player, result.target);
        const putCountersEffect = new PutCountersEffect(effect, result.damage);
        putCountersEffect.target = target;
        store.reduceEffect(state, putCountersEffect);

        effect.damage += result.damage * 2;
      }
    },
  );
}

export class Annihilapeex extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;

  public evolvesFrom = 'Primeape';

  public regulationMark = 'G';

  protected _tags = [CardTag.POKEMON_ex];

  public cardType: CardType[] = [CardType.FIGHTING];

  public hp: number = 320;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Angry Grudge',
      cost: [],
      damage: 0,
      text: 'Put up to 12 damage counters on this Pokémon. This attack does 20 damage for each damage counter you placed in this way.',
    },
    {
      name: 'Seismic Toss',
      cost: [CardType.FIGHTING],
      damage: 150,
      text: '',
    },
  ];

  public set: string = 'SVP';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '32';

  public name: string = 'Annihilape ex';

  public fullName: string = 'Annihilape ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const generator = useAngryGrudge(() => generator.next(), store, state, effect);
      return generator.next().value;
    }

    return state;
  }
}
