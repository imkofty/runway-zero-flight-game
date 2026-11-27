// RUNWAY ZERO — input.js
// One job: keyboard + mouse state, nothing else.

export const Input = {
  up: false,
  down: false,
  left: false,
  right: false,
  boost: false, // Shift or Space or mouse held
  action: false, // Space / Enter / click: start, confirm
  restart: false, // R, consumed by the game loop
  anyKey: false,

  _keys: new Set(),

  attach() {
    addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this._keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'r') this.restart = true;
      if (e.key === ' ' || e.key === 'Enter') this.action = true;
      this.anyKey = true;
      this._sync();
    });
    addEventListener('keyup', (e) => {
      this._keys.delete(e.key.toLowerCase());
      this._sync();
    });
    addEventListener('mousedown', () => {
      this.boost = true;
      this.action = true;
      this.anyKey = true;
    });
    addEventListener('mouseup', () => {
      this.boost = false;
    });
    addEventListener('blur', () => {
      this._keys.clear();
      this._sync();
    });
  },

  _sync() {
    const k = this._keys;
    this.up = k.has('arrowup') || k.has('w');
    this.down = k.has('arrowdown') || k.has('s');
    this.left = k.has('arrowleft') || k.has('a');
    this.right = k.has('arrowright') || k.has('d');
    this.boost = this.boost || k.has('shift') || k.has(' ');
  },

  consumeAction() {
    const a = this.action;
    this.action = false;
    return a;
  },

  consumeRestart() {
    const r = this.restart;
    this.restart = false;
    return r;
  },
};
