import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { IS_ABILITY_BLOCKED, MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Cubone extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public powers = [{
    name: 'Cheering Bone',
    powerType: PowerType.ABILITY,
    text: 'As long as this Pokémon is on your Bench, attacks used by your Marowak do 30 more damage to your opponent\'s Active Pokémon (before applying Weakness and Resistance).'
  }];

  public attacks = [{
    name: 'Hit Twice',
    cost: [F],
    damage: 10,
    damageCalculation: 'x',
    text: 'Flip 2 coins. This attack does 10 damage for each heads.'
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '104';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cubone';
  public fullName: string = 'Cubone MEW';

  private readonly CHEERING_BONE_BONUS = 30;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    this.applyCheeringBone(store, state, effect);

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 10 * heads;
      });
    }

    return state;
  }

  private applyCheeringBone(store: StoreLike, state: State, effect: Effect): void {
    for (const player of state.players) {
      const attacker = player.active.getPokemonCard();

      if (attacker === undefined || attacker.name !== 'Marowak') {
        continue;
      }

      // Cheering Bone only applies while this Cubone is on the Bench.
      const onBench = player.bench.some(bench => bench.getPokemonCard() === this);
      if (!onBench) {
        continue;
      }

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        continue;
      }

      // Add the bonus to the damage of the attack the Marowak is using.
      for (let index = 0; index < attacker.attacks.length; index++) {
        if (WAS_ATTACK_USED(effect, index, attacker)) {
          effect.damage += this.CHEERING_BONE_BONUS;
          return;
        }
      }
    }
  }
}
