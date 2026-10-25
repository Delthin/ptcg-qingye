import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AttackEffect } from '../../../game/store/effects/game-effects';
import { SELECT_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_WEAKNESS_IS_NOW } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Porygon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.COLORLESS];
  public hp: number = 60;
  public weakness = [{ type: CardType.FIGHTING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [{
    name: 'Conversion 4',
    cost: [CardType.COLORLESS],
    damage: 0,
    text: 'Choose Grass, Fire, Water, Lightning, Psychic, Fighting, Darkness, Metal, or Dragon type. Until the Defending Pokémon leaves the Active Spot, its Weakness is now that type. (The amount of Weakness doesn\'t change.)',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '137';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Porygon';
  public fullName: string = 'Porygon MEW';

  private readonly TYPE_NAMES = [
    'Grass', 'Fire', 'Water', 'Lightning', 'Psychic',
    'Fighting', 'Darkness', 'Metal', 'Dragon',
  ];

  private readonly TYPE_CHOICES = [
    CardType.GRASS, CardType.FIRE, CardType.WATER, CardType.LIGHTNING, CardType.PSYCHIC,
    CardType.FIGHTING, CardType.DARK, CardType.METAL, CardType.DRAGON,
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect: AttackEffect = effect;
      const player = attackEffect.player;

      state = SELECT_PROMPT(store, state, player, this.TYPE_NAMES, (result) => {
        const weaknessType = this.TYPE_CHOICES[result] ?? CardType.GRASS;
        DEFENDING_POKEMON_WEAKNESS_IS_NOW(store, state, attackEffect, this, weaknessType);
      });
    }
    return state;
  }
}
