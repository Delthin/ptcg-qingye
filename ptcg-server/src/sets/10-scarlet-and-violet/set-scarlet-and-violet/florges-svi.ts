import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_DOES_LESS_DAMAGE } from '../../../game/store/prefabs/effect-of-attack-prefabs';

type PokemonInPlay = State['players'][number]['active'];

/** Shape of the engine effect that resolves Weakness for damage dealt to a Pokemon. */
interface WeaknessResolution {
  target?: PokemonInPlay;
  weakness?: unknown[];
  ignoreWeakness?: boolean;
}

export class Florges extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Floette';
  public cardType: CardType[] = [P];
  public hp: number = 140;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public powers = [{
    name: 'Blooming Garden',
    powerType: PowerType.ABILITY,
    text: 'Your Pokémon in play have no Weakness.',
  }];

  public attacks = [{
    name: 'Moonblast',
    cost: [P, C, C],
    damage: 120,
    text: 'During your opponent\'s next turn, the Defending Pokémon\'s attacks do 30 less damage (before applying Weakness and Resistance).',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '93';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Florges';
  public fullName: string = 'Florges SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Moonblast: the damage is dealt normally, then the Defending Pokemon's attacks
    // do 30 less damage during the opponent's next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_DOES_LESS_DAMAGE(store, state, effect, this, 30);
    }

    // Blooming Garden: "Your Pokemon in play have no Weakness."
    // The engine settles Weakness through an effect that carries the defending
    // PokemonCardList in `target` and the applied Weakness in `weakness`. That effect is
    // not exported by name in this checkout, so it is matched structurally: whenever the
    // Weakness of a Pokemon owned by a player with this card in play is being resolved,
    // the Weakness is removed for that resolution.
    const weaknessResolution = effect as unknown as WeaknessResolution;
    const target = weaknessResolution.target;

    if (target !== undefined && Array.isArray(weaknessResolution.weakness)) {
      const owner = state.players.find(player =>
        player.active === target || player.bench.indexOf(target) !== -1);

      if (owner !== undefined
        && !IS_ABILITY_BLOCKED(store, state, owner, this)
        && (owner.active.getPokemonCard() === this
          || owner.bench.some(bench => bench.getPokemonCard() === this))) {
        weaknessResolution.weakness = [];
        if (typeof weaknessResolution.ignoreWeakness === 'boolean') {
          weaknessResolution.ignoreWeakness = true;
        }
      }
    }

    return state;
  }
}
