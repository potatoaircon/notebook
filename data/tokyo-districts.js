/* Abstract TOKYO districts. Edit this list to add a neighborhood block.
 * Shop pins live in data/tokyo-food.js and do not have to sit inside a block.
 * tone: main | soft | accent. size is visual weight only.
 * label is the English baseline; Japanese sits below it.
 */
window.TOKYO_DISTRICTS = [
  {
    id: 'shinjuku', en: 'SHINJUKU', ja: '新宿', tone: 'main', size: 'lg',
    path: 'M66 160 L236 138 324 188 262 288 178 334 96 318 58 234 Z',
    label: [180, 228]
  },
  {
    id: 'ikebukuro', en: 'IKEBUKURO', ja: '池袋', tone: 'soft', size: 'md',
    path: 'M224 56 L440 28 582 66 516 116 334 138 216 98 Z',
    label: [396, 84]
  },
  {
    id: 'iidabashi', en: 'IIDABASHI', ja: '飯田橋', tone: 'main', size: 'sm',
    path: 'M340 218 L410 198 448 242 416 300 348 314 316 266 Z',
    label: [370, 252]
  },
  {
    id: 'suidobashi', en: 'SUIDOBASHI', ja: '水道橋', tone: 'main', size: 'sm',
    path: 'M456 158 L548 136 584 178 552 220 478 228 436 192 Z',
    label: [496, 174]
  },
  {
    id: 'ueno', en: 'UENO', ja: '上野', tone: 'main', size: 'lg',
    path: 'M604 48 L790 26 866 84 846 184 738 230 620 192 580 118 Z',
    label: [726, 134]
  },
  {
    id: 'akihabara', en: 'AKIHABARA', ja: '秋葉原', tone: 'main', size: 'sm',
    path: 'M768 246 L900 218 956 268 910 320 788 330 744 276 Z',
    label: [844, 272]
  },
  {
    id: 'asakusa', en: 'ASAKUSA', ja: '浅草', tone: 'soft', size: 'sm',
    path: 'M926 74 L1032 44 1072 92 1052 152 954 164 904 118 Z',
    label: [996, 110]
  },
  {
    id: 'oshiage', en: 'OSHIAGE', ja: '押上', tone: 'main', size: 'sm',
    path: 'M1128 60 L1212 48 1244 104 1216 164 1136 172 1112 116 Z',
    label: [1160, 108]
  },
  {
    id: 'kinshicho', en: 'KINSHICHO', ja: '錦糸町', tone: 'main', size: 'lg',
    path: 'M1004 228 L1176 214 1228 290 1160 376 1028 386 980 302 Z',
    label: [1092, 298]
  },
  {
    id: 'shibuya', en: 'SHIBUYA', ja: '渋谷', tone: 'accent', size: 'lg',
    path: 'M64 394 L228 346 296 404 276 520 204 570 98 560 58 486 Z',
    label: [186, 452]
  },
  {
    id: 'omotesando', en: 'OMOTESANDO', ja: '表参道', tone: 'soft', size: 'md',
    path: 'M352 328 L492 294 530 366 492 448 380 470 330 400 Z',
    label: [436, 382]
  },
  {
    id: 'ebisu', en: 'EBISU', ja: '恵比寿', tone: 'main', size: 'md',
    path: 'M128 608 L288 578 378 636 354 722 218 746 122 690 108 642 Z',
    label: [236, 662]
  },
  {
    id: 'roppongi', en: 'ROPPONGI', ja: '六本木', tone: 'main', size: 'md',
    path: 'M392 526 L542 490 600 558 572 638 460 674 376 616 362 566 Z',
    label: [478, 588]
  },
  {
    id: 'tokyo', en: 'TOKYO', ja: '東京', tone: 'main', size: 'md',
    path: 'M592 376 L752 344 806 408 770 490 650 526 582 468 574 414 Z',
    label: [680, 438]
  },
  {
    id: 'ginza', en: 'GINZA', ja: '銀座', tone: 'accent', size: 'md',
    path: 'M684 548 L840 514 920 586 870 670 720 708 666 658 654 598 Z',
    label: [784, 610]
  }
];
