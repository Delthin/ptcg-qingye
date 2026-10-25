import { State } from './state/state';

export interface StoreHandler {

  onStateChange(state: State): void;

  getPlayerCoinId?(clientId: number): string;

}
