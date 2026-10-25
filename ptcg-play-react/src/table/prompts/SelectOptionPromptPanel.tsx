import type { TFunction } from 'i18next';
import type { SelectOptionPrompt } from 'ptcg-server';
import { TablePrimaryAction } from '../hud/TablePrimaryAction';
import { cn } from '../../utils/cn';
import panelStyles from './TablePromptLayer.module.css';
import styles from './SelectOptionPromptPanel.module.css';

export type SelectOptionPromptPanelProps = {
  prompt: SelectOptionPrompt;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void;
};

export function SelectOptionPromptPanel(props: SelectOptionPromptPanelProps) {
  const { prompt, t, gameMessageText, resolve } = props;
  const disabled = prompt.options.disabled ?? [];

  const onSelect = (index: number) => {
    if (disabled[index]) {
      return;
    }
    resolve(prompt.id, index);
  };

  return (
    <div className={panelStyles.backdrop} role="presentation">
      <div className={panelStyles.panel} role="dialog" aria-modal="true">
        <h2 className={panelStyles.title}>
          {t('PROMPT_SELECT_TITLE', { defaultValue: 'Choose' })}
        </h2>
        <p className={panelStyles.message}>{gameMessageText(t, prompt.message)}</p>

        <div className={styles.options}>
          {prompt.values.map((value, i) => (
            <button
              key={`${prompt.id}-${i}`}
              type="button"
              className={cn(styles.option, disabled[i] && styles.optionDisabled)}
              disabled={!!disabled[i]}
              onClick={() => onSelect(i)}
            >
              <span className={styles.optionText}>{t(value, { defaultValue: value })}</span>
            </button>
          ))}
        </div>

        <TablePrimaryAction state="choose" label="选择选项" disabled
          onCancel={prompt.options.allowCancel ? () => resolve(prompt.id, null) : undefined} />
      </div>
    </div>
  );
}
