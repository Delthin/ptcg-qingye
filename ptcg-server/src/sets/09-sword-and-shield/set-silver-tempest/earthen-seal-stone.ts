import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType, CardTag, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, GameMessage, PlayerType, GameError } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { Attack } from '../../../game/store/card/pokemon-types';
import { CheckPokemonAttacksEffect, CheckHpEffect } from '../../../game/store/effects/check-effects';
import { PutCountersEffect } from '../../../game/store/effects/attack-effects';
import { IS_TOOL_BLOCKED } from '../../../game/store/prefabs/prefabs';
import { AttackEffect } from '../../../game/store/effects/game-effects';

export class EarthenSealStone extends TrainerCard {
  public trainerType: TrainerType = TrainerType.TOOL;
  public regulationMark: string = 'F';
  public set: string = 'SIT';
  public setNumber: string = '154';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Earthen Seal Stone';
  public fullName: string = 'Earthen Seal Stone SIT 154';
  public text: string = 'The Pokémon V this card is attached to can use the VSTAR Power on this card. (You still need the necessary Energy to use this attack.)';

  public attacks: Attack[] = [{
    name: 'Star Gravity',
    cost: [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    damage: 0,
    text: "Put damage counters on each of your opponent's Pokémon V until its remaining HP is 100. (You can't use more than 1 VSTAR Power in a game.)",
  }];

  private static readonly V_TAGS = [CardTag.POKEMON_V, CardTag.POKEMON_VMAX, CardTag.POKEMON_VSTAR, CardTag.POKEMON_VUNION];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof CheckPokemonAttacksEffect) {
      const pokemon = effect.player.active.getPokemonCard();
      if (!effect.player.active.tools.includes(this) || !pokemon
        || !EarthenSealStone.V_TAGS.some(tag => pokemon.hasTag(tag))
        || IS_TOOL_BLOCKED(store, state, effect.player, this)) {
        effect.attacks = effect.attacks.filter(attack => attack !== this.attacks[0]);
        return state;
      }
      if (!effect.attacks.includes(this.attacks[0])) effect.attacks.push(this.attacks[0]);
    }

    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const source = effect.source.getPokemonCard();
      if (!effect.source.tools.includes(this) || !source
        || !EarthenSealStone.V_TAGS.some(tag => source.hasTag(tag))
        || IS_TOOL_BLOCKED(store, state, player, this)) throw new GameError(GameMessage.CANNOT_USE_ATTACK);
      if (player.usedVSTAR) throw new GameError(GameMessage.LABEL_VSTAR_USED);
      player.usedVSTAR = true;
      effect.opponent.forEachPokemon(PlayerType.TOP_PLAYER, (target, pokemon) => {
        if (!EarthenSealStone.V_TAGS.some(tag => pokemon.hasTag(tag))) return;
        const hp = new CheckHpEffect(effect.opponent, target);
        state = store.reduceEffect(state, hp);
        const damage = Math.max(0, hp.hp - 100 - target.damage);
        if (damage === 0) return;
        const counters = new PutCountersEffect(effect, damage);
        counters.target = target;
        state = store.reduceEffect(state, counters);
      });
    }
    return state;
  }
}
