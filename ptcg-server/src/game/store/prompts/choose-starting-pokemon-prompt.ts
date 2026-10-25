import { GameMessage } from '../../game-message';
import { GameError } from '../../game-error';
import { Card } from '../card/card';
import { CardList } from '../state/card-list';
import { Player } from '../state/player';
import { Prompt } from './prompt';

export interface StartingPokemonSelection { active: Card | null; bench: (Card | null)[]; }
export interface StartingPokemonLayout { active: number | null; bench: (number | null)[]; }

/** Private layout draft: nothing is moved until the entire prompt group commits. */
export class ChooseStartingPokemonPrompt extends Prompt<StartingPokemonSelection> {
  readonly type = 'Choose starting pokemon';
  readonly message = GameMessage.CHOOSE_STARTING_POKEMONS;
  public cards: CardList;
  public benchSize: number;
  public blockedBench: number[];

  constructor(player: Player, public blocked: number[], public activeRequired = true) {
    super(player.id);
    this.cards = player.hand;
    this.benchSize = player.bench.length;
    this.blockedBench = player.bench.map((list, index) => list.cards.length ? index : -1).filter(index => index >= 0);
  }

  public decode(raw: StartingPokemonLayout | number[] | null): StartingPokemonSelection {
    // Accept the former active-first array for existing clients/test fixtures.
    let layout: StartingPokemonLayout;
    if (Array.isArray(raw)) {
      const bench = Array(this.benchSize).fill(null);
      const indices = this.activeRequired ? raw.slice(1) : raw;
      const available = Array.from({ length: this.benchSize }, (_, i) => i).filter(i => !this.blockedBench.includes(i));
      if (indices.length > available.length) throw new GameError(GameMessage.INVALID_TARGET);
      indices.forEach((index, i) => { bench[available[i]] = index; });
      layout = { active: this.activeRequired ? raw[0] : null, bench };
    } else if (raw && typeof raw === 'object' && Array.isArray(raw.bench)) {
      layout = raw;
    } else {
      throw new GameError(GameMessage.INVALID_TARGET);
    }
    if (layout.bench.length !== this.benchSize) throw new GameError(GameMessage.INVALID_TARGET);
    const get = (index: number | null): Card | null => {
      if (index === null) return null;
      if (!Number.isInteger(index) || index < 0 || index >= this.cards.cards.length) throw new GameError(GameMessage.INVALID_TARGET);
      return this.cards.cards[index];
    };
    return { active: get(layout.active), bench: layout.bench.map(get) };
  }

  public validate(result: StartingPokemonSelection | null): boolean {
    if (!result || !Array.isArray(result.bench) || result.bench.length !== this.benchSize) return false;
    if (this.activeRequired ? result.active === null : result.active !== null) return false;
    if (result.bench.some((card, index) => card !== null && this.blockedBench.includes(index))) return false;
    const selected = [result.active, ...result.bench].filter((card): card is Card => card !== null);
    if (new Set(selected).size !== selected.length) return false;
    return selected.every(card => {
      const index = this.cards.cards.indexOf(card);
      return index >= 0 && !this.blocked.includes(index);
    });
  }
}
