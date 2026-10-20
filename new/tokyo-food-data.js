/* TOKYO collection: edit this list to add restaurants.
 * Coordinates x/y are illustrative positions on the abstract 900x560 SVG,
 * not geographic coordinates. Google Maps links use the actual address.
 * Leave image as null until you have permission to use a real dish photo.
 * Category keys: pancakes, yakiniku, gyutan, izakaya, cakes.
 * Area keys: omotesando, marunouchi, shibuya, shinjuku, ginza,
 *            ueno, kinshicho, ebisu, other.
 */
window.TOKYO_FOOD_PLACES = [
  {
    id: 'crisscross',
    name: 'crisscross',
    nameJa: 'クリスクロス',
    category: 'pancakes',
    area: 'omotesando',
    station: '表参道駅',
    address: '東京都港区南青山5-7-28',
    hours: ['08:00 — 21:00'],
    image: null,
    x: 368, y: 334,
    labelX: 384, labelY: 326, labelAnchor: 'start'
  },
  {
    id: 'butter-biei',
    name: 'BUTTER 美瑛放牧酪農場',
    nameJa: 'BUTTER',
    category: 'pancakes',
    area: 'marunouchi',
    station: '東京駅・二重橋前駅',
    address: '東京都千代田区丸の内2-4-1 丸ビル B1F',
    hours: ['カフェ 平日・土 11:00 — 20:00', '日祝 11:00 — 19:00'],
    image: null,
    x: 592, y: 324,
    labelX: 607, labelY: 316, labelAnchor: 'start'
  }
];
