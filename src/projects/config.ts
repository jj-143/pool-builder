const config = {
  MAX_POINTS: 50,
  POOL_SIZE: 2,
  POOL_DEPTH: 20 / 12 / 4,
  SURFACE_Y: -1 / 48,
  TILE_REPEAT: 1 / 4,

  COPING_SIZE: 0.03,
  _COPING_CELL_COUNT: 3,
  get COPING_REPEAT() {
    return (8 * this.COPING_SIZE) / this._COPING_CELL_COUNT;
  },

  WORLD_SIZE: 2000,
  WORLD_REPEAT: 1 / 4,

  SUN_POS: [0.5, 3, 0.5],

  DEFINES: {
    IOR: `${1 / 1.33}`,
  },
};

export default config;
