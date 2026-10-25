// Run from ptcg-play-react: node --test src/deck-editor/qaShellRegression.test.cjs
// Pure validation/render-tree checks only: no DOM, services, storage or emitted files.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const postcss = require('postcss');
const src = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(src, file), 'utf8');

function load(file, modules) {
  const output = ts.transpileModule(read(file), {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', output)(name => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  }, exports);
  return exports;
}

// Scoped dependency doubles keep i18n/server initialization out of the tests.
const ApiErrorEnum = {
  NAME_DUPLICATE: 'ERROR_NAME_DUPLICATE',
  VALIDATION_INVALID_PARAM: 'ERROR_INVALID_PARAM',
  AUTH_TOKEN_INVALID: 'ERROR_INVALID_TOKEN',
  REQUESTS_LIMIT_REACHED: 'ERROR_REQUESTS_LIMIT_REACHED',
};
class ApiError extends Error {
  constructor(code, param) { super(code); this.code = code; this.param = param; }
}
const { deckNameError, deckNameSaveError } = load('deck-editor/deckName.ts', {
  'ptcg-server': { ApiErrorEnum }, '../api/apiError': { ApiError },
});

test('QA05: trim, empty/short, 3/32/33 boundaries and server-compatible UTF-16 length', () => {
  for (const name of ['', '   ', '甲', '甲乙']) assert.match(deckNameError(name), /太短/);
  for (const name of ['甲乙丙', '  甲乙丙  ', '甲'.repeat(32), '  ' + '甲'.repeat(32) + '  ']) {
    assert.equal(deckNameError(name), null);
  }
  assert.match(deckNameError('甲'.repeat(33)), /太长/);
  assert.equal(deckNameError('😀'.repeat(16)), null);
  assert.match(deckNameError('😀'.repeat(17)), /太长/);
});

test('QA05: duplicate, validation, rate/session errors stay distinct from network/server failures', () => {
  assert.match(deckNameSaveError(new ApiError(ApiErrorEnum.NAME_DUPLICATE)), /已有同名/);
  assert.match(deckNameSaveError(new ApiError(ApiErrorEnum.VALIDATION_INVALID_PARAM, 'name')), /3–32/);
  assert.match(deckNameSaveError(new ApiError(ApiErrorEnum.REQUESTS_LIMIT_REACHED)), /频繁/);
  assert.match(deckNameSaveError(new ApiError(ApiErrorEnum.AUTH_TOKEN_INVALID)), /登录已过期/);
  for (const error of [new Error('network'), new ApiError('SERVER_ERROR'), new ApiError(undefined), new ApiError(ApiErrorEnum.VALIDATION_INVALID_PARAM, 'cards')]) {
    const message = deckNameSaveError(error);
    assert.match(message, /连接或服务异常/);
    assert.doesNotMatch(message, /同名/);
  }
});

const jsx = (type, props) => ({ type, props });
const { ChallengeLetter } = load('duo/lobby/ChallengeLetter.tsx', {
  'react/jsx-runtime': { jsx, jsxs: jsx },
  '../TrainerPortrait': { TrainerPortrait: () => null },
  '../GameIcon': { GameIcon: () => null },
  './ripple': { spawnRipple: () => {} },
  '../DuoHomePage.module.css': { default: {} },
});
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (node && typeof node === 'object') return text(node.props?.children);
  return typeof node === 'string' ? node : '';
}

test('QA10: invitation explains deck confirmation; live setup status has one manual entry action', () => {
  let resumed = 0;
  const props = { myName: '甲', peerName: '乙', peerLabel: '乙', actionBusy: false, onResume: () => resumed++, onDecline: () => {}, onCancel: () => {} };
  const incoming = ChallengeLetter({ ...props, mode: 'incoming', setupPending: false });
  assert.match(text(incoming), /还须选择并确认你的出战卡组/);
  assert.doesNotMatch(text(incoming), /直接开赛/);
  const outgoing = ChallengeLetter({ ...props, mode: 'outgoing', setupPending: false });
  assert.match(text(outgoing), /等待.*选择、确认卡组/);
  const setup = ChallengeLetter({ ...props, mode: 'active', setupPending: true });
  assert.match(text(setup), /对手已确认，请进入牌桌/);
  assert.ok(nodes(setup).some(node => node.props.role === 'status' && node.props['aria-live'] === 'polite'));
  const buttons = nodes(setup).filter(node => node.type === 'button');
  assert.equal(buttons.length, 1);
  assert.equal(resumed, 0, 'rendering must not resume or create a game');
  buttons[0].props.onClick();
  assert.equal(resumed, 1);
  assert.match(text(ChallengeLetter({ ...props, mode: 'active', setupPending: false })), /回到牌桌/);
});

test('modified TS/TSX syntax and CSS parse; toolbar sibling layer clears panes without console clipping', () => {
  for (const file of ['components/AppLayout.tsx', 'deck-editor/deckName.ts', 'deck-editor/DeckEditToolbar.tsx', 'duo/DuoDecksPage.tsx', 'duo/DuoHomePage.tsx', 'duo/lobby/ChallengeLetter.tsx', 'pages/LoginPage.tsx', 'tutorial/HomeTour.tsx']) {
    const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    assert.equal(ast.parseDiagnostics.length, 0, `Syntax diagnostics: ${file}`);
  }
  const styles = {};
  for (const file of ['components/AppLayout.module.css', 'deck-editor/DeckEditToolbar.module.css', 'deck-editor/DeckEditView.module.css', 'duo/DuoHomePage.module.css']) styles[file] = postcss.parse(read(file));
  const view = styles['deck-editor/DeckEditView.module.css'];
  const declaration = (selector, prop) => {
    let value;
    view.walkRules(selector, rule => rule.walkDecls(prop, decl => { value = decl.value; }));
    return value;
  };
  assert.ok(Number(declaration('.console > header', 'z-index')) > Number(declaration('.console > *', 'z-index')));
  assert.equal(declaration('.console', 'overflow'), 'visible');
});
