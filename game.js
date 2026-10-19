const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hud = {
  hp: document.getElementById('hpText'), gene: document.getElementById('geneText'), bank: document.getElementById('bankText'),
  wave: document.getElementById('waveText'), enemy: document.getElementById('enemyText'), lvl: document.getElementById('lvlText')
};
const ui = {
  start: document.getElementById('startScreen'), level: document.getElementById('levelUpScreen'),
  cards: document.getElementById('levelCards'), levelText: document.getElementById('levelUpText'),
  fusion: document.getElementById('fusionScreen'), fusionCards: document.getElementById('fusionCards'), fusionText: document.getElementById('fusionText'),
  pause: document.getElementById('pauseScreen'), resumeBtn: document.getElementById('resumeBtn'), pauseMenuBtn: document.getElementById('pauseMenuBtn'),
  shop: document.getElementById('shopScreen'), shopCards: document.getElementById('shopCards'), shopBank: document.getElementById('shopBankText'),
  bestWave: document.getElementById('bestWaveText'), menuBank: document.getElementById('menuBankText'), gameOverBank: document.getElementById('gameOverBankText'),
  biomeCards: document.getElementById('biomeCards'), biomePanel: document.getElementById('biomePanel'), biomeToggleBtn: document.getElementById('biomeToggleBtn'), closeBiomePanelBtn: document.getElementById('closeBiomePanelBtn'), selectedBiomeBadge: document.getElementById('selectedBiomeBadge'), nextBiomeBtn: document.getElementById('nextBiomeBtn'),
  gameOver: document.getElementById('gameOverScreen'), gameOverText: document.getElementById('gameOverText'),
  toast: document.getElementById('toast')
};
const SAVE_KEY = 'gene_hive_bioarsenal_6plus_v21_real_arsenal';
const WORLD = { width: 3600, height: 3600, tile: 180 };
const ICON_PATHS = {"claws": "ability_0_0.png", "glands": "ability_0_1.png", "membrane": "ability_0_2.png", "carapace": "ability_0_3.png", "tendrils": "ability_1_0.png", "core": "ability_1_1.png", "spines": "ability_1_2.png", "fission": "ability_1_3.png", "nova": "ability_2_0.png", "leech": "ability_2_1.png", "barbs": "ability_2_2.png", "overmind": "ability_2_3.png", "mortar": "ability_3_1.png", "plasma": "ability_3_2.png", "brood": "ability_3_3.png", "boneburst": "weapon_0_1.png", "whip": "weapon_0_3.png", "cloud": "weapon_1_2.png", "orbit": "weapon_3_1.png", "void": "weapon_3_3.png", "shell": "shell.png", "chrono": "chrono.png", "solarbloom": "solarbloom.png", "genome": "genome.png", "hydra": "hydra.png", "starhalo": "starhalo.png", "vitalbloom": "vitalbloom.png", "hivequeen": "hivequeen.png", "needle": "needle.png", "boomer": "boomer.png", "prism": "prism.png", "chain": "chain.png", "mine": "mine.png", "geyser": "geyser.png", "frost": "frost.png", "seeker": "seeker.png", "rail": "rail.png", "ember": "ember.png", "spiral": "spiral.png", "saw": "saw.png", "mirror": "mirror.png", "venom": "venom.png", "storm": "storm.png", "predatorrush": "predatorrush.png", "cocoon": "cocoon.png"};
const ICONS = {};
let last = performance.now();
let gameStarted = false;
let freezeGame = false;
const keys = {};
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rand(a,b){return a + Math.random()*(b-a);}
function dist(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by);}
function angleTo(ax,ay,bx,by){return Math.atan2(by-ay,bx-ax);}
function lerp(a,b,t){return a + (b-a)*t;}
function hash2(x,y){ const n = Math.sin(x*127.1 + y*311.7) * 43758.5453123; return n - Math.floor(n); }
for (const [k,p] of Object.entries(ICON_PATHS)) { const img=new Image(); img.src='assets/icons/'+p; ICONS[k]=img; }
const SPRITE_PATHS = { player:'player.png', runner:'runner.png', brute:'brute.png', spitter:'spitter.png', skitter:'skitter.png', blob:'blob.png', leech:'leech.png', eye:'eye.png', brood:'brood.png', boss:'boss.png', boss_crystalram:'boss_crystalram.png', boss_hivematron:'boss_hivematron.png', boss_voidmanta:'boss_voidmanta.png', boss_thorncharger:'boss_thorncharger.png', boss_shellcolossus:'boss_shellcolossus.png', boss_bloomhydra:'boss_bloomhydra.png', minion:'minion.png', drone:'drone.png' };
const SPRITES = {};
for (const [k,p] of Object.entries(SPRITE_PATHS)) { const img = new Image(); img.src = 'assets/creatures/' + p; SPRITES[k] = img; }

const BACKGROUND_PATHS = ['biome_ruins.png','biome_radioactive.png','biome_desert.png','biome_tropical.png','biome_cosmic.png'];
const BACKGROUNDS = BACKGROUND_PATHS.map(name => { const img = new Image(); img.src = 'assets/backgrounds/' + name; return img; });
const BIOMES = [
  {
    id:'ruins', name:'Руины улья', short:'Руины', hazard:'resonance',
    enemyPool:['runner','spitter','brute','skitter','blob'],
    bosses:[
      { id:'nova', title:'Кристальный таран', skill:'Кольцевой залп', sprite:'boss_crystalram' },
      { id:'summoner', title:'Матрона роя', skill:'Зов выводка', sprite:'boss_hivematron' },
      { id:'charger', title:'Шипоклык дозора', skill:'Био-таран', sprite:'boss_thorncharger' }
    ],
    mega:{ id:'nova', title:'Архон руин', skill:'Резонансный шторм', sprite:'boss_crystalram' }
  },
  {
    id:'radio', name:'Радиоактивный сектор', short:'Радио', hazard:'puddle',
    enemyPool:['runner','leech','spitter','blob','brood','eye'],
    bosses:[
      { id:'charger', title:'Токсичный шипорыл', skill:'Кислотный рывок', sprite:'boss_thorncharger' },
      { id:'summoner', title:'Радиоматка', skill:'Заражённый выводок', sprite:'boss_hivematron' },
      { id:'gravity', title:'Изотопная манта', skill:'Ядовитая воронка', sprite:'boss_voidmanta' }
    ],
    mega:{ id:'summoner', title:'Царь распада', skill:'Изумрудный катаклизм', sprite:'boss_hivematron' }
  },
  {
    id:'desert', name:'Пустыня осколков', short:'Пустыня', hazard:'tornado',
    enemyPool:['runner','skitter','brute','spitter','eye','blob'],
    bosses:[
      { id:'charger', title:'Песчаный разоритель', skill:'Песчаный таран', sprite:'boss_thorncharger' },
      { id:'nova', title:'Солнечный колосс', skill:'Солнечный веер', sprite:'boss_shellcolossus' },
      { id:'gravity', title:'Барханная манта', skill:'Воронка пыли', sprite:'boss_voidmanta' }
    ],
    mega:{ id:'gravity', title:'Император бурь', skill:'Песчаная бездна', sprite:'boss_shellcolossus' }
  },
  {
    id:'tropical', name:'Тропический космолес', short:'Лес', hazard:'roots',
    enemyPool:['runner','leech','skitter','brood','blob','spitter'],
    bosses:[
      { id:'summoner', title:'Цветущий пастырь', skill:'Рой лепестков', sprite:'boss_bloomhydra' },
      { id:'nova', title:'Споровая гидра', skill:'Лепестковый шторм', sprite:'boss_bloomhydra' },
      { id:'charger', title:'Лиановый клык', skill:'Корневой бросок', sprite:'boss_thorncharger' }
    ],
    mega:{ id:'summoner', title:'Сердце чащи', skill:'Корневая корона', sprite:'boss_bloomhydra' }
  },
  {
    id:'cosmic', name:'Космический сад', short:'Космос', hazard:'anomaly',
    enemyPool:['runner','eye','spitter','skitter','leech','brood','blob'],
    bosses:[
      { id:'gravity', title:'Пустотная манта', skill:'Гравиворонка', sprite:'boss_voidmanta' },
      { id:'nova', title:'Астральный панцирь', skill:'Звёздный каскад', sprite:'boss_shellcolossus' },
      { id:'summoner', title:'Созвездие роя', skill:'Небесный выводок', sprite:'boss_hivematron' }
    ],
    mega:{ id:'gravity', title:'Садовник сингулярности', skill:'Космический коллапс', sprite:'boss_voidmanta' }
  }
];


const MUSIC_TRACKS = {
  menu: 'assets/audio/menu_loop.wav',
  ruins: 'assets/audio/biome_ruins_loop.wav',
  radio: 'assets/audio/biome_radio_loop.wav',
  desert: 'assets/audio/biome_desert_loop.wav',
  tropical: 'assets/audio/biome_tropical_loop.wav',
  cosmic: 'assets/audio/biome_cosmic_loop.wav'
};
const BIOME_MUSIC_IDS = ['ruins','radio','desert','tropical','cosmic'];

const Music = {
  tracks:{}, current:null, currentId:null, muted:false, unlocked:false, volume:0.78, paused:false,
  init(){
    if(Object.keys(this.tracks).length) return true;
    for(const [id,src] of Object.entries(MUSIC_TRACKS)){
      const a = new Audio(src);
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0;
      a.crossOrigin = 'anonymous';
      this.tracks[id] = a;
    }
    return true;
  },
  unlock(){
    this.init();
    this.unlocked = true;
    // Browser allows audio only after a real user gesture.
    for(const a of Object.values(this.tracks)){
      try{ a.load(); }catch(e){}
    }
    if(!this.currentId) this.play('menu', true);
  },
  targetVolume(){
    if(this.muted) return 0;
    return this.paused ? 0.13 : this.volume;
  },
  fade(audio, to, ms=420){
    if(!audio) return;
    const from = audio.volume;
    const steps = 18;
    let i = 0;
    clearInterval(audio._fadeTimer);
    audio._fadeTimer = setInterval(()=>{
      i++;
      audio.volume = Math.max(0, Math.min(1, from + (to-from)*(i/steps)));
      if(i>=steps) clearInterval(audio._fadeTimer);
    }, Math.max(12, ms/steps));
  },
  play(id, gentle=false){
    this.init();
    if(!this.unlocked) return;
    const next = this.tracks[id];
    if(!next) return;
    if(this.currentId === id){
      next.muted = false;
      next.volume = Math.max(next.volume, Math.min(0.35, this.targetVolume()));
      this.fade(next, this.targetVolume(), gentle?120:240);
      const p = next.play();
      if(p && p.catch) p.catch(()=>toast('Кликни ещё раз или нажми M, чтобы включить музыку'));
      return;
    }
    const prev = this.current;
    this.current = next;
    this.currentId = id;
    try{ next.pause(); next.currentTime = 0; }catch(e){}
    next.muted = false;
    next.volume = Math.min(0.42, this.targetVolume());
    const playPromise = next.play();
    if(playPromise && playPromise.catch) playPromise.catch(()=>toast('Кликни ещё раз или нажми M, чтобы включить музыку'));
    this.fade(next, this.targetVolume(), gentle?140:260);
    if(prev && prev !== next){
      this.fade(prev, 0, gentle?160:240);
      setTimeout(()=>{ try{ prev.pause(); prev.currentTime = 0; }catch(e){} }, gentle?260:360);
    }
  },
  playMenu(){ this.play('menu'); },
  playBiome(idx){ this.play(BIOME_MUSIC_IDS[idx] || 'ruins'); },
  setPaused(v){
    this.paused = !!v;
    if(this.current) this.fade(this.current, this.targetVolume(), 260);
  },
  setMuted(v){
    this.muted = !!v;
    if(this.current) this.fade(this.current, this.targetVolume(), 180);
    toast(this.muted ? 'Музыка выключена' : 'Музыка включена');
  },
  toggleMute(){
    this.unlock();
    this.setMuted(!this.muted);
    if(!this.muted && this.currentId) this.play(this.currentId, true);
    if(!this.muted && !this.currentId) this.play('menu', true);
  }
};

const state = { t:0, camera:{x:0,y:0}, particles:[], texts:[], projectiles:[], enemyProjectiles:[], enemies:[], orbs:[], corpses:[], minions:[], hazards:[], biomeTimer:0, wave:1, biomeWave:1, biomeIndex:0, waveSpawned:0, waveTarget:0, waveTimer:0, kills:0, genes:0, level:1, xp:0, nextXp:0, bestWave:1, bossMilestone:0, currentBiome:0, pendingFusion:false, bossKillCount:0, bgDrift:0, waveIsBoss:false, waveIsMega:false };
const player = { x: WORLD.width/2, y: WORLD.height/2, r:28, speed:280, vx:0, vy:0, maxHp:100, hp:100, regen:0.8, pickupRadius:115, baseDamage:16, damageMult:1, fireRate:0.34, projectileSpeed:580, projectileLife:1.1, projectileCount:1, critChance:0.08, critMult:1.65, targetRange:560, xpBonus:0, killHeal:0, thorns:0, dashTime:0, dashCd:0, burstCd:0, burstRadius:160, burstBonus:0, damageReduction:0, cooldownFactor:1, weaponDNA:{}, mutationLevels:{}, mutationOrder:[], unlockedFusions:[], weapons:{ acid:1, boneburst:0, mortar:0, brood:0, plasma:0, orbit:0, cloud:0, whip:0, void:0, bloom:0, hydra:0, starhalo:0, vitalbloom:0, hivequeen:0 }, cooldowns:{ acid:0, boneburst:0, mortar:0, brood:0, plasma:0, cloud:0, whip:0, void:0, bloom:0, starhalo:0 }, orbitAngle:0, contactTimer:0, contactBlink:0 };
const ENEMY_DEFS = {
  runner: { name:'Бегунец', color:'#5fd4ff', hp:31, speed:158, r:16, touch:10, genes:3, kind:'melee' },
  brute:  { name:'Крепыш', color:'#a5dd54', hp:108, speed:80,  r:24, touch:20, genes:8, kind:'melee' },
  spitter:{ name:'Брызгун', color:'#b1ef58', hp:45, speed:98,  r:18, touch:8, genes:5, kind:'ranged', shot:2.1 },
  skitter:{ name:'Скокер', color:'#9f7cff', hp:39, speed:132, r:17, touch:9, genes:5, kind:'dash', dash:2.2 },
  blob:   { name:'Пузырёк', color:'#78dfff', hp:76, speed:77,  r:22, touch:12, genes:7, kind:'split' },
  leech:  { name:'Энергохват', color:'#78e3c8', hp:60, speed:116, r:20, touch:14, genes:7, kind:'melee' },
  eye:    { name:'Светоглаз', color:'#d58cff', hp:55, speed:90,  r:20, touch:10, genes:6, kind:'ranged', shot:1.6 },
  brood:  { name:'Няня роя', color:'#bf8cff', hp:142, speed:67,  r:30, touch:17, genes:12, kind:'summon', summon:4.1 },
  boss:   { name:'Альфа-страж', color:'#ffe36e', hp:320, speed:86, r:42, touch:28, genes:30, kind:'boss', shot:1.9, summon:5.2 }
};
const RARITY_DATA = {
  common: { key:'common', title:'Обычная', weight:44 },
  uncommon: { key:'uncommon', title:'Необычная', weight:31 },
  epic: { key:'epic', title:'Эпическая', weight:17 },
  legendary: { key:'legendary', title:'Легендарная', weight:8 }
};

const BOSS_ARCHETYPES = [
  { id:'nova', title:'Кристальный таран', skill:'Кольцевой залп', sprite:'boss_crystalram' },
  { id:'summoner', title:'Матрона роя', skill:'Зов выводка', sprite:'boss_hivematron' },
  { id:'charger', title:'Шипоклык', skill:'Био-таран', sprite:'boss_thorncharger' },
  { id:'gravity', title:'Пустотная манта', skill:'Гравиворонка', sprite:'boss_voidmanta' },
  { id:'summoner', title:'Панцирный колосс', skill:'Осколочный выводок', sprite:'boss_shellcolossus' },
  { id:'nova', title:'Цветущая гидра', skill:'Лепестковый шторм', sprite:'boss_bloomhydra' }
];
const MUTATIONS = [
  {id:'claws', rarity:'common', type:'Тело', name:'Костяные когти', icon:'claws', max:6, desc:'Твои базовые атаки наносят больше урона.', statText:l=>`Урон основных атак +${8 + l*3}`, apply:l=>player.baseDamage += 8 + l*3 },
  {id:'glands', rarity:'common', type:'Тело', name:'Кислотные железы', icon:'glands', max:6, desc:'Главный плевок стреляет заметно чаще.', statText:l=>`Скорострельность +${Math.round((0.035+l*0.008)*1000)} мс`, apply:l=>player.fireRate = Math.max(0.10, player.fireRate - (0.035 + l*0.008)) },
  {id:'membrane', rarity:'common', type:'Тело', name:'Мышечная мембрана', icon:'membrane', max:5, desc:'Позволяет легче вырываться из толпы.', statText:l=>`Скорость +${30 + l*6}`, apply:l=>player.speed += 30 + l*6 },
  {id:'carapace', rarity:'common', type:'Тело', name:'Хитиновый панцирь', icon:'carapace', max:6, desc:'Плотный панцирь добавляет здоровье и помогает держаться дольше.', statText:l=>`Макс. здоровье +${20 + l*7}`, apply:l=>{ const v=20+l*7; player.maxHp += v; player.hp = Math.min(player.maxHp, player.hp + v); } },
  {id:'tendrils', rarity:'common', type:'Тело', name:'Раздвоенные щупальца', icon:'tendrils', max:4, desc:'Основной плевок захватывает больше целей и лучше попадает по врагам.', statText:l=>`Одновременных целей +1`, apply:l=>player.projectileCount += 1 },
  {id:'core', rarity:'common', type:'Тело', name:'Генетическое ядро', icon:'core', max:5, desc:'Опыт притягивается издалека, а герой восстанавливается быстрее.', statText:l=>`Реген +${(0.35+l*0.12).toFixed(2)}, сбор +${18+l*6}`, apply:l=>{ player.regen += 0.35 + l*0.12; player.pickupRadius += 18 + l*6; } },
  {id:'spines', rarity:'uncommon', type:'Тело', name:'Спинные шипы', icon:'spines', max:5, desc:'Критические удары случаются заметно чаще.', statText:l=>`Шанс крита +${6+l*2}%`, apply:l=>player.critChance += 0.06 + l*0.02 },
  {id:'fission', rarity:'uncommon', type:'Тело', name:'Клеточное деление', icon:'fission', max:4, desc:'Снаряды летят быстрее и дольше, а управлять полем боя становится проще.', statText:l=>`Скорость снаряда +${70+l*25}, жизнь +0.12с`, apply:l=>{ player.projectileSpeed += 70 + l*25; player.projectileLife += 0.12; } },
  {id:'nova', rarity:'uncommon', type:'Активная', name:'Нова-митоз', icon:'nova', max:4, desc:'Биовсплеск становится шире и больнее.', statText:l=>`Радиус +${24+l*8}, сила +18%`, apply:l=>{ player.burstRadius += 24 + l*8; player.burstBonus += 0.18; } },
  {id:'leech', rarity:'common', type:'Выживание', name:'Гемоглот', icon:'leech', max:4, desc:'Каждая победа понемногу восстанавливает здоровье.', statText:l=>`Лечение за убийство +${3+l*2}`, apply:l=>player.killHeal += 3 + l*2 },
  {id:'barbs', rarity:'common', type:'Выживание', name:'Реактивные шипы', icon:'barbs', max:4, desc:'Любой, кто трогает тебя, сам получает по хребту.', statText:l=>`Ответный урон +${10+l*5}`, apply:l=>player.thorns += 10 + l*5 },
  {id:'overmind', rarity:'uncommon', type:'Тело', name:'Синаптический разум', icon:'overmind', max:3, desc:'Ты замечаешь врагов дальше и получаешь чуть больше опыта.', statText:l=>`Дальность +${80+l*35}, опыт +${8+l*4}%`, apply:l=>{ player.targetRange += 80 + l*35; player.xpBonus += 0.08 + l*0.04; } },
  {id:'shell', rarity:'common', type:'Выживание', name:'Резонансная оболочка', icon:'shell', max:5, desc:'Часть входящего урона гасится мягким биощитом.', statText:l=>`Снижение урона ${Math.round((0.07+l*0.02)*100)}%`, apply:l=>player.damageReduction = Math.min(0.65, player.damageReduction + 0.07 + l*0.02) },
  {id:'chrono', rarity:'uncommon', type:'Тело', name:'Хрономембрана', icon:'chrono', max:4, desc:'Все органические орудия перезаряжаются быстрее, а шаг становится легче.', statText:l=>`Перезарядка быстрее и +${10+l*4} скорости`, apply:l=>{ player.cooldownFactor *= Math.max(0.72, 0.93 - l*0.01); player.speed += 10 + l*4; } },
  {id:'boneburst', rarity:'common', type:'Оружие', name:'Кристальный веер', icon:'boneburst', max:5, desc:'По сторонам вылетает веер сияющих игл. Отлично помогает против толпы.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Веер шире, иглы больнее', apply:l=>player.weapons.boneburst += 1 },
  {id:'mortar', rarity:'common', type:'Оружие', name:'Споровая мортира', icon:'mortar', max:5, desc:'Тяжёлый споровый сгусток падает в толпу и задевает несколько целей сразу.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше взрыв и урон', apply:l=>player.weapons.mortar += 1 },
  {id:'brood', rarity:'uncommon', type:'Оружие', name:'Споровый выводок', icon:'brood', max:5, desc:'Организм выращивает маленьких помощников, которые сами ищут ближайшие цели.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше личинок и урона', apply:l=>player.weapons.brood += 1 },
  {id:'plasma', rarity:'uncommon', type:'Оружие', name:'Плазменный орган', icon:'plasma', max:5, desc:'Периодически выпускает яркий био-луч по ближайшей цели.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Луч больнее и чаще', apply:l=>player.weapons.plasma += 1 },
  {id:'orbit', rarity:'uncommon', type:'Оружие', name:'Орбитальные кристаллы', icon:'orbit', max:5, desc:'Вокруг тебя вращаются защитные кристаллы и отбивают тех, кто подходит слишком близко.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше резаков и урона', apply:l=>player.weapons.orbit += 1 },
  {id:'cloud', rarity:'common', type:'Оружие', name:'Яркое цветение', icon:'cloud', max:5, desc:'Вокруг тебя появляется мягкое, но мощное облако спор для ближней защиты.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Облако шире и гуще', apply:l=>player.weapons.cloud += 1 },
  {id:'whip', rarity:'common', type:'Оружие', name:'Хлыст-щупальце', icon:'whip', max:5, desc:'Ближний удар щупальцем хватает и прошивает опасную цель.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Хлыст дальше и больнее', apply:l=>player.weapons.whip += 1 },
  {id:'void', rarity:'epic', type:'Оружие', name:'Грависпора', icon:'void', max:4, desc:'Особая спора притягивает врагов в одну точку и помогает разбираться с толпой.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Сильнее взрыв и притяжение', apply:l=>player.weapons.void += 1 },
  {id:'solarbloom', rarity:'epic', type:'Оружие', name:'Солнечное цветение', icon:'solarbloom', max:4, desc:'Периодически раскрывает взрывное споровое солнце вокруг героя.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Шире радиус и сильнее вспышка', apply:l=>player.weapons.bloom += 1 },

{id:'needle', rarity:'common', type:'Оружие', name:'Игольный каскад', icon:'needle', max:5, desc:'Организм выпускает скоростной веер тонких игл, которые прошивают цепочку врагов.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше игл, выше пробитие', apply:l=>player.weapons.needle += 1 },
{id:'boomer', rarity:'common', type:'Оружие', name:'Возвратный серп', icon:'boomer', max:5, desc:'Живой серп летит вперёд, прорезает цель и возвращается обратно к хозяину.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Дальше полёт и сильнее обратный удар', apply:l=>player.weapons.boomer += 1 },
{id:'prism', rarity:'uncommon', type:'Оружие', name:'Призматический осколок', icon:'prism', max:5, desc:'Кристалл рикошетит между целями и режет толпу разноцветными бликами.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше рикошетов и урона', apply:l=>player.weapons.prism += 1 },
{id:'chain', rarity:'epic', type:'Оружие', name:'Нейро-дуга', icon:'chain', max:4, desc:'Биоэлектрическая дуга перескакивает по врагам и прожигает плотные пачки.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше скачков и сила разряда', apply:l=>player.weapons.chain += 1 },
{id:'mine', rarity:'common', type:'Оружие', name:'Семя-ловушка', icon:'mine', max:5, desc:'Создаёт пульсирующую мину, которая подрывает врагов, ворвавшихся в зону поражения.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Шире взрыв и быстрее взвод', apply:l=>player.weapons.mine += 1 },
{id:'geyser', rarity:'uncommon', type:'Оружие', name:'Гейзер спор', icon:'geyser', max:5, desc:'Под врагами появляются телеграммы, а затем выстреливает яркий споровый столб.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше зон и сильнее выброс', apply:l=>player.weapons.geyser += 1 },
{id:'frost', rarity:'uncommon', type:'Оружие', name:'Крио-пыльца', icon:'frost', max:5, desc:'Ледяные споры замедляют цель и помогают держать дистанцию.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Сильнее холод и больше залп', apply:l=>player.weapons.frost += 1 },
{id:'seeker', rarity:'uncommon', type:'Оружие', name:'Медуза-наводчик', icon:'seeker', max:5, desc:'Миниатюрные живые снаряды сами доворачивают к цели и мягко добирают беглецов.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше медуз и точнее наведение', apply:l=>player.weapons.seeker += 1 },
{id:'rail', rarity:'epic', type:'Оружие', name:'Рельсовый шип', icon:'rail', max:4, desc:'Пробивающий залп выжигает прямую линию и поражает врагов насквозь.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Шире луч и выше урон', apply:l=>player.weapons.rail += 1 },
{id:'ember', rarity:'common', type:'Оружие', name:'Пепельный хвост', icon:'ember', max:5, desc:'Горящие ядра оставляют след и небольшую вспышку при попадании.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Жар сильнее и чаще вспышки', apply:l=>player.weapons.ember += 1 },
{id:'spiral', rarity:'common', type:'Оружие', name:'Спиральный венец', icon:'spiral', max:5, desc:'Рой лепестков раскручивается вокруг героя и разлетается вихрем.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Плотнее спираль и больше клинков', apply:l=>player.weapons.spiral += 1 },
{id:'saw', rarity:'uncommon', type:'Оружие', name:'Жало-диск', icon:'saw', max:5, desc:'Вращающийся диск прорезает врагов насквозь и летит плавным резаком.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Выше обороты и пробитие', apply:l=>player.weapons.saw += 1 },
{id:'mirror', rarity:'epic', type:'Оружие', name:'Зеркальное цветение', icon:'mirror', max:4, desc:'Пара зеркальных бутонов бьёт под симметричными углами и накрывает фланги.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Больше залпов и мощнее залп', apply:l=>player.weapons.mirror += 1 },
{id:'venom', rarity:'uncommon', type:'Оружие', name:'Токсичное копьё', icon:'venom', max:5, desc:'Узкий ядовитый выпад пробивает ряд целей и оставляет едкие брызги.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Длиннее выпад и выше пробитие', apply:l=>player.weapons.venom += 1 },
{id:'storm', rarity:'legendary', type:'Оружие', name:'Пыльцевой шторм', icon:'storm', max:4, desc:'Вокруг героя вспыхивает буря спор, лепестков и режущих листьев.', statText:l=> l===0 ? 'Открывает новое оружие' : 'Шторм гуще и сильнее', apply:l=>player.weapons.storm += 1 },
{id:'predatorrush', rarity:'uncommon', type:'Пассивная', name:'Хищный драйв', icon:'predatorrush', max:4, desc:'Каждое убийство запускает короткий яростный разгон с эффектной аурой.', statText:l=>`После убийства: рывок ярости, базовая скорость +${8+l*3}`, apply:l=>{ player.speed += 8 + l*3; player.regen += 0.06 + l*0.03; } },
{id:'cocoon', rarity:'epic', type:'Пассивная', name:'Фантомный кокон', icon:'cocoon', max:4, desc:'Периодически выпускает защитный импульс и отбрасывает всё, что подобралось близко.', statText:l=>`Импульс-кокон и здоровье +${12+l*6}`, apply:l=>{ const hp=12+l*6; player.maxHp += hp; player.hp = Math.min(player.maxHp, player.hp + hp); player.damageReduction = Math.min(0.65, player.damageReduction + 0.015); } },
  {id:'genome', rarity:'legendary', type:'Тело', name:'Королевский геном', icon:'genome', max:3, desc:'Редчайшая эволюция усиливает почти все стороны организма сразу.', statText:l=>`Урон, здоровье, крит и скорость растут`, apply:l=>{ const hp=18+l*10; player.maxHp += hp; player.hp = Math.min(player.maxHp, player.hp + hp); player.damageMult += 0.10 + l*0.04; player.speed += 18 + l*6; player.critChance += 0.04 + l*0.01; player.regen += 0.25 + l*0.08; } },
  {id:'hydra', rarity:'legendary', recipe:['glands','tendrils'], type:'Синтез', name:'Гидра-железа', icon:'hydra', max:4, desc:'После слияния основной огонь выпускает дополнительные кислотные струи и лучше чистит толпу.', statText:l=> l===0 ? 'Разблокировано слиянием' : 'Больше струй и урона', apply:l=>player.weapons.hydra += 1 },
  {id:'starhalo', rarity:'epic', recipe:['plasma','orbit'], type:'Синтез', name:'Звёздный нимб', icon:'starhalo', max:4, desc:'Орбитальные кристаллы заряжают совместный луч и поражают сразу несколько врагов.', statText:l=> l===0 ? 'Разблокировано слиянием' : 'Чаще луч и больше цепей', apply:l=>player.weapons.starhalo += 1 },
  {id:'vitalbloom', rarity:'epic', recipe:['cloud','leech'], type:'Синтез', name:'Живоцвет', icon:'vitalbloom', max:4, desc:'Облако спор высасывает силу из врагов и частично лечит героя.', statText:l=> l===0 ? 'Разблокировано слиянием' : 'Сильнее лечение и облако', apply:l=>player.weapons.vitalbloom += 1 },
  {id:'hivequeen', rarity:'legendary', recipe:['brood','overmind'], type:'Синтез', name:'Королева улья', icon:'hivequeen', max:4, desc:'Выводок становится умнее, его становится больше, а атаки — яростнее.', statText:l=> l===0 ? 'Разблокировано слиянием' : 'Больше миньонов и больше укусы', apply:l=>player.weapons.hivequeen += 1 }
];

const MUTATION_BIOME_REQ = {
  shell:1, chrono:1, cloud:1, void:1, nova:1, leech:1,
  needle:0, boomer:0, ember:0, spiral:0, mine:0, predatorrush:0,
  prism:0, frost:0, seeker:0, saw:0, venom:0, geyser:0,
  chain:0, rail:0, mirror:0, cocoon:0, storm:0,
  mortar:2, spines:2, fission:2, plasma:2, orbit:2, solarbloom:2,
  brood:3, overmind:3, barbs:3, boneburst:3, vitalbloom:3, hydra:3,
  genome:4, hivequeen:4, starhalo:4
};
MUTATIONS.forEach(m => m.biomeMin = MUTATION_BIOME_REQ[m.id] || 0);

const SHOP_ITEMS = [
  { id:'vigor', name:'Сердцевина роя', icon:'carapace', rarity:'common', max:8, baseCost:900, costScale:1.62, desc:'Повышает стартовый запас здоровья и делает первые волны стабильнее.', effectText:'Стартовое здоровье +20 за уровень', apply(level){ player.maxHp += 20*level; player.hp += 20*level; } },
  { id:'glandDrive', name:'Импульсные железы', icon:'glands', rarity:'uncommon', max:7, baseCost:1200, costScale:1.7, desc:'Ускоряет базовую атаку и делает стартовый билд бодрее.', effectText:'Скорость основной атаки +1 ранг за уровень', apply(level){ player.fireRate = Math.max(0.17, player.fireRate - 0.014*level); } },
  { id:'magnet', name:'Притяжение ядра', icon:'core', rarity:'common', max:7, baseCost:1100, costScale:1.68, desc:'Увеличивает сбор ДНК и помогает быстрее подтягивать ресурсы.', effectText:'Радиус сбора +18 и бонус опыта +4% за уровень', apply(level){ player.pickupRadius += 18*level; player.xpBonus += 0.04*level; } },
  { id:'predator', name:'Кристалл хищника', icon:'claws', rarity:'uncommon', max:7, baseCost:1400, costScale:1.72, desc:'Поднимает силу базовых атак и ускоряет ранний разгон.', effectText:'Урон базовой атаки +3 за уровень', apply(level){ player.baseDamage += 3*level; } },
  { id:'metabolism', name:'Живой метаболизм', icon:'leech', rarity:'epic', max:6, baseCost:1800, costScale:1.8, desc:'Добавляет регенерацию и лёгкое лечение за убийства.', effectText:'Реген +0.2 и лечение за убийство', apply(level){ player.regen += 0.20*level; player.killHeal += Math.floor(level/2); } },
  { id:'reflex', name:'Нейро-рывок', icon:'chrono', rarity:'epic', max:5, baseCost:2200, costScale:1.86, desc:'Ускоряет движение и улучшает рывок.', effectText:'Скорость +18 и перезарядка рывка быстрее', apply(level){ player.speed += 18*level; player.shopDashCdReduction = 0.18*level; } },
  { id:'barrier', name:'Био-барьер', icon:'shell', rarity:'epic', max:5, baseCost:2600, costScale:1.92, desc:'Даёт постоянное снижение входящего урона.', effectText:'Снижение урона +4% за уровень', apply(level){ player.damageReduction = Math.min(0.36, player.damageReduction + 0.04*level); } },
  { id:'needleLab', name:'Лаборатория игл', icon:'needle', rarity:'common', max:5, baseCost:1050, costScale:1.65, desc:'Стартовый биоарсенал лучше раскрывает быстрые и пробивающие орудия.', effectText:'Урон снарядов +4% и скорость снаряда +20 за уровень', apply(level){ player.damageMult += 0.04*level; player.projectileSpeed += 20*level; } },
  { id:'siegeSeed', name:'Осадочные семена', icon:'mine', rarity:'uncommon', max:5, baseCost:1450, costScale:1.73, desc:'Усиливает взрывные и зональные органы.', effectText:'Радиус биовсплеска +14 и бонус урона +5% за уровень', apply(level){ player.burstRadius += 14*level; player.damageMult += 0.05*level; } },
  { id:'arcNerves', name:'Вольтовые нервы', icon:'chain', rarity:'epic', max:4, baseCost:2100, costScale:1.84, desc:'Помогают энергоружию перезаряжаться быстрее.', effectText:'Общая перезарядка быстрее на 4% за уровень', apply(level){ player.cooldownFactor *= Math.max(0.72, 1 - 0.04*level); } },
  { id:'swarmBrain', name:'Наводящий мозг', icon:'seeker', rarity:'uncommon', max:5, baseCost:1600, costScale:1.78, desc:'Улучшает автонаведение и дальний бой.', effectText:'Дальность +35 и крит +1% за уровень', apply(level){ player.targetRange += 35*level; player.critChance += 0.01*level; } },
  { id:'rushGlands', name:'Хищная надпочечность', icon:'predatorrush', rarity:'epic', max:4, baseCost:2500, costScale:1.9, desc:'Разгоняет организм после каждого убийства ещё сильнее.', effectText:'Скорость +10 и реген +0.08 за уровень', apply(level){ player.speed += 10*level; player.regen += 0.08*level; } },
  { id:'cocoonNest', name:'Гнездо кокона', icon:'cocoon', rarity:'legendary', max:4, baseCost:3300, costScale:1.98, desc:'Подготавливает защитную оболочку ещё до начала забега.', effectText:'Макс. HP +18 и снижение урона +2% за уровень', apply(level){ player.maxHp += 18*level; player.hp += 18*level; player.damageReduction = Math.min(0.52, player.damageReduction + 0.02*level); } },
  { id:'genesis', name:'Генезис-катализатор', icon:'genome', rarity:'legendary', max:4, baseCost:4200, costScale:2.05, desc:'Редкое улучшение для поздней игры — поднимает урон и шанс крита.', effectText:'Сила +6% и крит +1.5% за уровень', apply(level){ player.damageMult += 0.06*level; player.critChance += 0.015*level; } }
];

const ARSENAL_DNA_UPGRADES = [
  ['needle','Игольный каскад','needle','common',1350], ['boomer','Возвратный серп','boomer','common',1450], ['prism','Призматический осколок','prism','uncommon',1750], ['chain','Нейро-дуга','chain','epic',2300], ['mine','Семя-ловушка','mine','common',1500], ['geyser','Гейзер спор','geyser','uncommon',1800], ['frost','Крио-пыльца','frost','uncommon',1750], ['seeker','Медуза-наводчик','seeker','uncommon',1850], ['rail','Рельсовый шип','rail','epic',2500], ['ember','Пепельный хвост','ember','common',1450], ['spiral','Спиральный венец','spiral','common',1500], ['saw','Жало-диск','saw','uncommon',1800], ['mirror','Зеркальное цветение','mirror','epic',2400], ['venom','Токсичное копьё','venom','uncommon',1750], ['storm','Пыльцевой шторм','storm','legendary',4200], ['predatorrush','Хищный драйв','predatorrush','epic',2800], ['cocoon','Фантомный кокон','cocoon','legendary',3900]
].map(([id,name,icon,rarity,baseCost]) => ({
  id:'arsenal_'+id, name:'Геном: '+name, icon, rarity, max:6, baseCost, costScale:1.72,
  desc:'Постоянно усиливает именно эту ветку арсенала. Работает в каждом следующем забеге.',
  effectText:'Сила ветки +8% за уровень',
  apply(level){ player.weaponDNA[id] = Math.max(player.weaponDNA[id] || 0, level); }
}));
SHOP_ITEMS.push(...ARSENAL_DNA_UPGRADES);
function weaponBoost(id){ return 1 + ((player.weaponDNA && player.weaponDNA[id]) || 0) * 0.08; }
function xpNeed(level){ return Math.floor(54 + level*18 + Math.pow(level,1.58)*19); }

function waveTarget(w){ return 28 + w*12 + Math.floor(Math.pow(w,1.34)*4); }
function readProfile(){
  try{
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return {
      bestWave: raw.bestWave || 1,
      dnaBank: raw.dnaBank || 0,
      shopLevels: raw.shopLevels || {},
      unlockedBiomes: raw.unlockedBiomes || 1,
      selectedBiome: raw.selectedBiome || 0
    };
  }catch(e){
    return { bestWave:1, dnaBank:0, shopLevels:{}, unlockedBiomes:1, selectedBiome:0 };
  }
}
let profile = readProfile();
function saveProfile(){ localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); }
function loadBest(){ state.bestWave = profile.bestWave || 1; }
function saveBest(){ profile.bestWave = Math.max(profile.bestWave || 1, state.bestWave, state.wave || 1); saveProfile(); state.bestWave = profile.bestWave; refreshMetaUI(); }
function shopLevel(id){ return profile.shopLevels[id] || 0; }
function shopCost(item){ return Math.floor(item.baseCost * Math.pow(item.costScale, shopLevel(item.id))); }
function refreshMetaUI(){
  if(hud.bank) hud.bank.textContent = Math.floor(profile.dnaBank || 0);
  if(ui.shopBank) ui.shopBank.textContent = Math.floor(profile.dnaBank || 0);
  if(ui.menuBank) ui.menuBank.textContent = Math.floor(profile.dnaBank || 0);
  if(ui.bestWave) ui.bestWave.textContent = `Волна ${state.bestWave}`;
  if(ui.gameOverBank) ui.gameOverBank.textContent = Math.floor(profile.dnaBank || 0);
  renderBiomeCards(true);
}

loadBest();
let selectedBiomeIndex = clamp(profile.selectedBiome || 0, 0, BIOMES.length-1);
let postRunNextBiome = null;
let biomeCardsSignature = '';
function biomeThumb(idx){ return `assets/backgrounds/${BACKGROUND_PATHS[idx]}`; }

function selectBiome(idx){
  if(idx >= (profile.unlockedBiomes || 1)) { toast('Сначала пройди предыдущий биом'); return; }
  selectedBiomeIndex = idx;
  profile.selectedBiome = idx;
  saveProfile();
  if(ui.biomePanel) ui.biomePanel.classList.add('hiddenPanel');
  renderBiomeCards();
}
function renderBiomeCards(force=false){
  if(ui.selectedBiomeBadge) ui.selectedBiomeBadge.textContent = `Биом: ${BIOMES[selectedBiomeIndex].name}`;
  if(!ui.biomeCards) return;
  const sig = `${selectedBiomeIndex}|${profile.unlockedBiomes || 1}`;
  if(!force && biomeCardsSignature === sig) return;
  biomeCardsSignature = sig;
  ui.biomeCards.innerHTML = '';
  BIOMES.forEach((b, idx) => {
    const card = document.createElement('button');
    card.type = 'button';
    const unlocked = idx < (profile.unlockedBiomes || 1);
    card.className = `biomeCard${selectedBiomeIndex===idx?' selected':''}${unlocked?'':' locked'}`;
    card.style.background = `linear-gradient(180deg, rgba(9,14,30,.15), rgba(5,8,20,.78)), url('${biomeThumb(idx)}') center/cover no-repeat`;
    card.innerHTML = `
      <span class="biomeBadge">Биом ${idx+1}</span>
      <div class="biomeName">${b.name}</div>
      <div class="biomeMeta">20 волн · боссы на 5/10/15 · мега-босс на 20
<br>${b.short} · особая угроза: ${b.hazard}</div>
      <div class="biomeStatus">${unlocked ? (selectedBiomeIndex===idx ? 'Выбран' : 'Открыт') : 'Заблокирован'}</div>`;
    card.onclick = ()=> selectBiome(idx);
    ui.biomeCards.appendChild(card);
  });
}
function showMainMenu(){
  Music.playMenu();
  Music.setPaused(false);
  isPaused = false; if(ui.pause) ui.pause.classList.add('hidden');
  if(ui.biomePanel) ui.biomePanel.classList.add('hiddenPanel');
  ui.gameOver.classList.add('hidden');
  hardShowStartMenu();
  gameStarted=false; freezeGame=false; postRunNextBiome = null; refreshMetaUI();
}
function hardHideStartMenu(){ ui.start.classList.add('hidden'); ui.start.style.display='none'; }
function hardShowStartMenu(){ ui.start.classList.remove('hidden'); ui.start.style.display='flex'; }
let isPaused = false;
function pauseGame(){
  if(!gameStarted || freezeGame || !ui.pause || !ui.pause.classList.contains('hidden') || !ui.start.classList.contains('hidden')) return;
  isPaused = true;
  freezeGame = true;
  Music.setPaused(true);
  ui.pause.classList.remove('hidden');
}
function resumeGame(){
  if(!isPaused) return;
  isPaused = false;
  freezeGame = false;
  Music.setPaused(false);
  if(ui.pause) ui.pause.classList.add('hidden');
}
function togglePause(){
  if(isPaused) resumeGame();
  else pauseGame();
}
function startRunAtBiome(idx){
  isPaused = false; if(ui.pause) ui.pause.classList.add('hidden');
  if(ui.biomePanel) ui.biomePanel.classList.add('hiddenPanel');
  selectedBiomeIndex = clamp(idx,0,BIOMES.length-1);
  profile.selectedBiome = selectedBiomeIndex;
  saveProfile();
  Music.playBiome(selectedBiomeIndex);
  hardHideStartMenu();
  ui.gameOver.classList.add('hidden');
  closeShop();
  resetRun(selectedBiomeIndex);
}
function completeBiomeRun(){
  Music.playMenu();
  gameStarted=false; freezeGame=true;
  const finishedBiome = state.biomeIndex;
  postRunNextBiome = null;
  let extra = '';
  if(finishedBiome < BIOMES.length - 1){
    const unlockNow = Math.max(profile.unlockedBiomes || 1, finishedBiome + 2);
    const wasLocked = unlockNow > (profile.unlockedBiomes || 1);
    profile.unlockedBiomes = unlockNow;
    saveProfile();
    postRunNextBiome = finishedBiome + 1;
    extra = wasLocked ? ` Открыт новый биом: ${BIOMES[finishedBiome+1].name}.` : ` Следующий биом уже доступен: ${BIOMES[finishedBiome+1].name}.`;
    ui.nextBiomeBtn.classList.remove('hiddenAction');
    ui.nextBiomeBtn.textContent = `В ${BIOMES[finishedBiome+1].name}`;
  } else {
    extra = ' Ты прошёл последний биом и завершил текущий цикл.';
    ui.nextBiomeBtn.classList.add('hiddenAction');
  }
  state.bestWave=Math.max(state.bestWave, finishedBiome*20 + 20);
  saveBest(); refreshMetaUI();
  ui.gameOverText.textContent = `Биом «${BIOMES[finishedBiome].name}» пройден. Ты уничтожил ${state.kills} врагов и собрал ${Math.floor(state.genes)} ДНК за этот забег.${extra} Все временные усиления сбросятся при переходе в следующий биом.`;
  document.getElementById('restartBtn').textContent = 'Повторить биом';
  ui.gameOver.classList.remove('hidden');
}

function toast(text){ ui.toast.textContent=text; ui.toast.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>ui.toast.classList.remove('show'),1600); }
let shopResumeOnClose = false;
function applyShopUpgrades(){ for(const item of SHOP_ITEMS){ const lvl = shopLevel(item.id); if(lvl>0) item.apply(lvl); } }
function renderShop(){
  if(!ui.shopCards) return;
  ui.shopCards.innerHTML = '';
  for(const item of SHOP_ITEMS){
    const lvl = shopLevel(item.id);
    const cost = shopCost(item);
    const maxed = lvl >= item.max;
    const card = document.createElement('div');
    card.className = `card shopCard rarity-${item.rarity || 'common'}`;
    const top = document.createElement('div'); top.className = 'cardTop';
    const img = document.createElement('img'); img.src = ICONS[item.icon].src;
    const meta = document.createElement('div');
    meta.innerHTML = `<div class="tag">Генолаб</div><h3>${item.name}</h3><div class="rank">Уровень ${lvl} / ${item.max}</div><div class="rarityBadge">${(RARITY_DATA[item.rarity||'common']||RARITY_DATA.common).title}</div>`;
    top.append(img, meta);
    const desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = item.desc;
    const stats = document.createElement('div'); stats.className = 'stats'; stats.textContent = item.effectText;
    const meter = document.createElement('div'); meter.className = 'lvlMeter';
    for(let i=0;i<item.max;i++){ const dot = document.createElement('span'); dot.className = 'lvlDot' + (i < lvl ? ' on' : ''); meter.appendChild(dot); }
    const costRow = document.createElement('div'); costRow.className = 'costRow';
    costRow.innerHTML = maxed ? `<span>Состояние</span><strong>Максимум</strong>` : `<span>Цена следующего ранга</span><strong>${cost}</strong>`;
    const note = document.createElement('div'); note.className = 'note'; note.textContent = maxed ? '' : '';
    const btn = document.createElement('button'); btn.className = 'primary buyBtn'; btn.textContent = maxed ? 'Завершено' : 'Усилить'; btn.disabled = maxed || profile.dnaBank < cost;
    btn.onclick = () => buyShopItem(item.id);
    card.append(top, desc, stats, meter, costRow, note, btn);
    ui.shopCards.appendChild(card);
  }
  refreshMetaUI();
}
function buyShopItem(id){ const item = SHOP_ITEMS.find(x=>x.id===id); if(!item) return; const lvl = shopLevel(item.id); if(lvl >= item.max) return; const cost = shopCost(item); if(profile.dnaBank < cost){ toast('Недостаточно ДНК'); return; } profile.dnaBank -= cost; profile.shopLevels[item.id] = lvl + 1; saveProfile(); renderShop(); refreshMetaUI(); toast(`${item.name} усилен`); }
function openShop(){ renderShop(); ui.shop.classList.remove('hidden'); if(gameStarted && !freezeGame){ shopResumeOnClose = true; freezeGame = true; } else { shopResumeOnClose = false; } }
function closeShop(){ ui.shop.classList.add('hidden'); if(shopResumeOnClose){ freezeGame = false; shopResumeOnClose = false; } refreshMetaUI(); }
function popup(text,x,y,color='#fff'){ state.texts.push({text,x,y,life:0.9,color}); }
function emit(x,y,color,count=8,spread=150,size=3){ for(let i=0;i<count;i++){ const life=0.36+Math.random()*0.46; state.particles.push({x,y,vx:rand(-spread,spread),vy:rand(-spread,spread),life,maxLife:life,size:size+Math.random()*2,color}); } }
function ring(x,y,color='#9ff7ff',radius=48,life=0.38,width=3){ state.particles.push({ring:true,x,y,r:radius,life,maxLife:life,color,width}); }
function softSpark(x,y,color='#9ff7ff',count=5){ emit(x,y,color,count,60,1.8); }
function resetRun(startBiome=selectedBiomeIndex){
  state.t=0; state.camera.x=0; state.camera.y=0; state.particles=[]; state.texts=[]; state.projectiles=[]; state.enemyProjectiles=[]; state.enemies=[]; state.orbs=[]; state.corpses=[]; state.minions=[];
  state.wave=1; state.biomeWave=1; state.biomeIndex=clamp(startBiome,0,BIOMES.length-1); state.hazards=[]; state.biomeTimer=0; state.waveSpawned=0; state.waveTarget=0; state.waveTimer=0; state.kills=0; state.genes=0; state.level=1; state.xp=0; state.nextXp=xpNeed(1); state.bossMilestone=0; state.currentBiome=state.biomeIndex; state.pendingFusion=false; state.bossKillCount=0; state.waveIsBoss=false; state.waveIsMega=false;
  Object.assign(player, { x:WORLD.width/2, y:WORLD.height/2, r:28, speed:320, vx:0, vy:0, maxHp:100, hp:100, regen:0.9, pickupRadius:145, baseDamage:18, damageMult:1, fireRate:0.30, projectileSpeed:635, projectileLife:1.15, projectileCount:1, critChance:0.08, critMult:1.65, targetRange:600, xpBonus:0.18, killHeal:0, thorns:0, dashTime:0, dashCd:0, burstCd:0, burstRadius:170, burstBonus:0, damageReduction:0, cooldownFactor:1, shopDashCdReduction:0, weaponDNA:{}, mutationLevels:{}, mutationOrder:[], unlockedFusions:[], weapons:{ acid:1, boneburst:0, mortar:0, brood:0, plasma:0, orbit:0, cloud:0, whip:0, void:0, bloom:0, hydra:0, starhalo:0, vitalbloom:0, hivequeen:0, needle:0, boomer:0, prism:0, chain:0, mine:0, geyser:0, frost:0, seeker:0, rail:0, ember:0, spiral:0, saw:0, mirror:0, venom:0, storm:0 }, cooldowns:{ acid:0,boneburst:0,mortar:0,brood:0,plasma:0,cloud:0,whip:0,void:0,bloom:0,starhalo:0, needle:0,boomer:0,prism:0,chain:0,mine:0,geyser:0,frost:0,seeker:0,rail:0,ember:0,spiral:0,saw:0,mirror:0,venom:0,storm:0 }, orbitAngle:0, contactTimer:0, contactBlink:0, predatorRush:0, predatorStacks:0, cocoonPulse:4.5, stormAngle:0 });
  applyShopUpgrades();
  player.hp = Math.min(player.maxHp, player.hp);
  gameStarted=true; freezeGame=false; spawnWave(1); hudUpdate(); refreshMetaUI();
}

function currentBiomeDef(){ return BIOMES[state.biomeIndex] || BIOMES[0]; }
function hudUpdate(){
  hud.hp.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  hud.gene.textContent = Math.floor(state.genes);
  if(hud.bank) hud.bank.textContent = Math.floor(profile.dnaBank || 0);
  hud.wave.textContent = `${state.biomeIndex+1}-${state.biomeWave}`;
  hud.enemy.textContent = state.enemies.length;
  hud.lvl.textContent = state.level;
  refreshMetaUI();
}
function selectEnemyType(w){
  const biome = currentBiomeDef();
  const cap = Math.min(biome.enemyPool.length, 2 + Math.floor((state.biomeWave-1)/3) + Math.floor(state.biomeIndex/2));
  const pool = biome.enemyPool.slice(0, cap);
  return pool[Math.floor(Math.random()*pool.length)];
}
function randomEdgePos(){
  // Спавн вокруг текущей камеры/игрока, а не на дальнем краю огромной карты.
  // Так волна сразу ощущается живой и игрок не смотрит на пустой экран.
  const margin = 140;
  const camX = clamp(player.x - canvas.width/2, 0, WORLD.width - canvas.width);
  const camY = clamp(player.y - canvas.height/2, 0, WORLD.height - canvas.height);
  const e = Math.floor(Math.random()*4);
  let x, y;
  if (e===0) { x = rand(camX - margin, camX + canvas.width + margin); y = camY - margin; }
  else if (e===1) { x = camX + canvas.width + margin; y = rand(camY - margin, camY + canvas.height + margin); }
  else if (e===2) { x = rand(camX - margin, camX + canvas.width + margin); y = camY + canvas.height + margin; }
  else { x = camX - margin; y = rand(camY - margin, camY + canvas.height + margin); }
  return {x:clamp(x,20,WORLD.width-20), y:clamp(y,20,WORLD.height-20)};
}

function randomBiomeIndex(){ return state.biomeIndex; }
function biomeWaveTarget(){
  if(state.waveIsMega) return 18 + state.biomeIndex*3;
  if(state.waveIsBoss) return 12 + state.biomeIndex*2 + Math.floor(state.biomeWave/5);
  return 16 + state.biomeWave*4 + state.biomeIndex*5;
}
function spawnEnemy(type, opts={}){
  const d=ENEMY_DEFS[type]; const p=opts.pos || randomEdgePos();
  const waveScale = state.wave + state.biomeIndex*3;
  const hpBase = opts.hp || Math.floor((d.hp + waveScale*(type==='boss'?18:type==='brood'?7:type==='brute'?6:3)) * (1 + Math.max(0,waveScale-1)*0.018));
  const enemy = { type, x:p.x, y:p.y, vx:0, vy:0, r:opts.r || d.r, hp:hpBase, maxHp:hpBase,
    speed:opts.speed || (d.speed + waveScale*(type==='runner'?2.25:type==='skitter'?1.9:0.95)),
    touch:opts.touch || d.touch, genes:opts.genes || d.genes, color:d.color, kind:d.kind, seed:Math.random()*100,
    shot:d.shot||0, summon:d.summon||0, dash:d.dash||0, dashTimer:1+Math.random()*0.5, splitDone:false,
    bossEvent:!!opts.bossEvent, bossLevel:opts.bossLevel || 0, mega:!!opts.mega, biomeIndex:state.biomeIndex,
    biomeHazard:(opts.biomeHazard || currentBiomeDef().hazard), name: opts.name || d.name };
  if(opts.spriteKey) enemy.spriteKey = opts.spriteKey;
  if(opts.bossPattern) enemy.bossPattern = opts.bossPattern;
  if(opts.bossSkillName) enemy.bossSkillName = opts.bossSkillName;
  state.enemies.push(enemy); return enemy;
}
function bossProfileForCurrentWave(){
  const biome = currentBiomeDef();
  if(state.waveIsMega) return biome.mega;
  const idx = Math.max(0, Math.floor(state.biomeWave/5)-1) % biome.bosses.length;
  return biome.bosses[idx];
}
function spawnBossEvent(levelMark){
  const profile = bossProfileForCurrentWave();
  const base = state.waveIsMega ? 4400 : 1800;
  const hp = Math.floor(base + state.biomeIndex*640 + state.biomeWave*145 + Math.pow(levelMark,1.18)*55);
  const boss = spawnEnemy('boss', { hp, r: state.waveIsMega ? 72 : 58, speed:(state.waveIsMega?98:92) + levelMark*1.0, touch:(state.waveIsMega?46:38) + Math.floor(levelMark*0.8), genes:(state.waveIsMega?160:62) + levelMark*7, bossEvent:true, bossLevel:levelMark, mega:state.waveIsMega, spriteKey:profile.sprite || 'boss', bossPattern:profile.id, bossSkillName:profile.skill, name:`${profile.title} • ${state.waveIsMega ? 'МЕГА' : 'БОСС'}` });
  boss.skillCd = state.waveIsMega ? 2.8 : 3.6; boss.chargeTime = 0; boss.gravityTime = 0; boss.supportCd = state.waveIsMega ? 5.2 : 999;
  ring(boss.x,boss.y,state.waveIsMega?'rgba(255,102,201,.88)':'rgba(255,214,92,.82)',state.waveIsMega?180:145,state.waveIsMega?1.0:0.82,state.waveIsMega?7:6);
  emit(boss.x,boss.y,state.waveIsMega?'#ff8ae8':'#ffd776',state.waveIsMega?58:42,300,4);
  popup(state.waveIsMega?'МЕГА-БОСС!':'БОСС!', boss.x, boss.y-58, state.waveIsMega?'#ffb5ff':'#ffe48a');
  toast(`${profile.title}: ${profile.skill}`);
  return boss;
}
function spawnWave(w){
  state.currentBiome = state.biomeIndex;
  state.waveIsBoss = (state.biomeWave % 5 === 0);
  state.waveIsMega = (state.biomeWave === 20);
  state.waveTarget = biomeWaveTarget();
  state.waveSpawned = 0;
  state.waveTimer = 0;
  const initial = Math.min(state.waveIsMega ? 10 + state.biomeIndex*2 : state.waveIsBoss ? 8 + state.biomeIndex*2 : 12 + state.biomeWave + state.biomeIndex*2, state.waveTarget);
  for(let i=0;i<initial;i++) spawnEnemy(selectEnemyType(w));
  state.waveSpawned = initial;
  if(state.waveIsBoss) spawnBossEvent(state.biomeWave + state.biomeIndex*20);
  const biome = currentBiomeDef();
  toast(`${biome.name} • Волна ${state.biomeWave}/20`);
}
function updateWaveSpawns(dt){
  if (state.waveSpawned >= state.waveTarget) return;
  state.waveTimer -= dt;
  if (state.waveTimer <= 0) {
    const pack = Math.min(state.waveIsMega ? 2 : state.waveIsBoss ? 3 : 4 + Math.floor(state.biomeWave/4), state.waveTarget - state.waveSpawned);
    for(let i=0;i<pack;i++) spawnEnemy(selectEnemyType(state.wave));
    state.waveSpawned += pack;
    state.waveTimer = state.waveIsMega ? 2.0 : state.waveIsBoss ? 1.35 : Math.max(0.35, 0.95 - state.biomeWave*0.02 - state.biomeIndex*0.03);
  }
}
function maybeSpawnBossMilestone(){}

function getActiveBoss(){ return state.enemies.find(e => e.bossEvent) || null; }
function countHazards(type){ return state.hazards.filter(h => h.type===type).length; }
function spawnPuddle(x,y,r=58,life=5.3,dps=12,warmup=0.7){ const max = getActiveBoss() ? (state.waveIsMega ? 5 : 4) : 3; if(countHazards('puddle') >= max) return false; state.hazards.push({type:'puddle', x, y, r, life, maxLife:life, dps, warmup, seed:Math.random()*99}); return true; }
function spawnResonance(x,y,r=70,warmup=0.9){ const max = getActiveBoss()?4:2; if(countHazards('resonance')>=max) return false; state.hazards.push({type:'resonance', x, y, r, life:0.45, maxLife:0.45, warmup, damage:18}); return true; }
function spawnRootBloom(x,y,r=72,warmup=0.85){ const max = getActiveBoss()?4:2; if(countHazards('roots')>=max) return false; state.hazards.push({type:'roots', x, y, r, life:2.8, maxLife:2.8, warmup, damage:9}); return true; }
function spawnAnomaly(x,y,r=76,warmup=0.5){ const max = getActiveBoss()?3:2; if(countHazards('anomaly')>=max) return false; state.hazards.push({type:'anomaly', x, y, r, life:4.4, maxLife:4.4, warmup, pulse:0.9, damage:12}); return true; }
function spawnTornado(x,y,r=54,life=9.5){ const max = getActiveBoss()?2:1; if(countHazards('tornado')>=max) return false; state.hazards.push({type:'tornado', x, y, r, life, maxLife:life, damage:10, vx:rand(-90,90), vy:rand(-90,90), turn:1.4+Math.random()*1.2}); return true; }
function hurtPlayerRaw(amount, color='#ff9fb0'){
  const dmg = Math.max(0.6, amount * (1 - player.damageReduction));
  player.hp -= dmg; player.contactBlink = Math.max(player.contactBlink, 0.12); player.contactTimer = 0.05;
  if(Math.random() < 0.24) popup(`${Math.round(dmg)}`, player.x + rand(-12,12), player.y - 36 + rand(-6,6), color);
}
function damageInHazard(x,y,r){ const d = dist(player.x,player.y,x,y); return d < (player.r + r); }
function spawnBiomeAmbientHazard(){
  const biome = currentBiomeDef();
  if(biome.hazard === 'puddle'){
    spawnPuddle(clamp(player.x + rand(-240,240), 80, WORLD.width-80), clamp(player.y + rand(-220,220), 80, WORLD.height-80), 54 + rand(-6,8), 4.8 + Math.random()*1.2, 10 + state.biomeIndex*1.4, 0.8);
  }else if(biome.hazard === 'tornado'){
    if(countHazards('tornado')===0 || (getActiveBoss() && countHazards('tornado')<2)) spawnTornado(clamp(player.x + rand(-260,260), 80, WORLD.width-80), clamp(player.y + rand(-220,220), 80, WORLD.height-80), 52+rand(-4,8), 8.5+Math.random()*2.5);
  }else if(biome.hazard === 'roots'){
    spawnRootBloom(clamp(player.x + rand(-250,250), 80, WORLD.width-80), clamp(player.y + rand(-220,220), 80, WORLD.height-80), 72+rand(-8,10), 0.8);
  }else if(biome.hazard === 'anomaly'){
    spawnAnomaly(clamp(player.x + rand(-220,220), 80, WORLD.width-80), clamp(player.y + rand(-180,180), 80, WORLD.height-80), 70+rand(-6,10), 0.55);
  }else {
    spawnResonance(clamp(player.x + rand(-250,250), 80, WORLD.width-80), clamp(player.y + rand(-220,220), 80, WORLD.height-80), 70+rand(-6,12), 0.95);
  }
}
function updateBiomeHazards(dt){
  state.biomeTimer -= dt;
  if(state.biomeTimer <= 0){
    spawnBiomeAmbientHazard();
    const biome = currentBiomeDef();
    if(biome.hazard === 'puddle') state.biomeTimer = getActiveBoss() ? 6.3 + Math.random()*1.4 : 8.4 + Math.random()*1.6;
    else if(biome.hazard === 'tornado') state.biomeTimer = getActiveBoss() ? 8.0 : 11.5;
    else if(biome.hazard === 'roots') state.biomeTimer = getActiveBoss() ? 5.2 + Math.random()*1.2 : 7.2 + Math.random()*1.4;
    else if(biome.hazard === 'anomaly') state.biomeTimer = getActiveBoss() ? 4.6 + Math.random()*1.1 : 6.6 + Math.random()*1.2;
    else state.biomeTimer = getActiveBoss() ? 6.2 + Math.random()*1.3 : 8.6 + Math.random()*1.5;
  }
  for(let i=state.hazards.length-1;i>=0;i--){
    const h = state.hazards[i];
    if(h.warmup !== undefined && h.warmup > 0){ h.warmup -= dt; if(h.warmup < 0) h.warmup = 0; }
    else {
      if(h.type==='puddle'){
        h.life -= dt;
        if(damageInHazard(h.x,h.y,h.r)) hurtPlayerRaw(h.dps*dt, '#9eff99');
      } else if(h.type==='resonance'){
        h.life -= dt;
        if(h.life > 0.22 && !h.blasted && damageInHazard(h.x,h.y,h.r)) { hurtPlayerRaw(h.damage, '#ffd97f'); h.blasted = true; ring(h.x,h.y,'rgba(255,223,127,.85)', h.r+18, 0.30, 4); }
      } else if(h.type==='roots'){
        h.life -= dt;
        if(damageInHazard(h.x,h.y,h.r)){
          hurtPlayerRaw(h.damage*dt, '#b6ff93');
          player.x = lerp(player.x, h.x, 0.08); player.y = lerp(player.y, h.y, 0.08);
        }
      } else if(h.type==='anomaly'){
        h.life -= dt; h.pulse -= dt;
        const d = dist(player.x,player.y,h.x,h.y);
        if(d < h.r + 36){ const a = angleTo(player.x,player.y,h.x,h.y); player.x += Math.cos(a) * 46 * dt; player.y += Math.sin(a) * 46 * dt; }
        if(h.pulse <= 0){ h.pulse = 0.95; if(damageInHazard(h.x,h.y,h.r)) hurtPlayerRaw(h.damage, '#dcb1ff'); ring(h.x,h.y,'rgba(169,132,255,.65)', h.r+10, 0.32, 4); }
      } else if(h.type==='tornado'){
        h.life -= dt; h.turn -= dt;
        if(h.turn <= 0){ h.turn = 1.2 + Math.random()*1.0; h.vx += rand(-80,80); h.vy += rand(-80,80); }
        const sp = Math.hypot(h.vx,h.vy) || 1; const cap = 120;
        h.vx = clamp(h.vx / sp * Math.min(sp, cap), -cap, cap); h.vy = clamp(h.vy / sp * Math.min(sp, cap), -cap, cap);
        h.x = clamp(h.x + h.vx*dt, 60, WORLD.width-60); h.y = clamp(h.y + h.vy*dt, 60, WORLD.height-60);
        if(damageInHazard(h.x,h.y,h.r)){
          hurtPlayerRaw(h.damage*dt, '#ffe1a3');
          player.x = clamp(player.x + h.vx*dt*0.55 + rand(-12,12)*dt*6, 25, WORLD.width-25);
          player.y = clamp(player.y + h.vy*dt*0.55 + rand(-12,12)*dt*6, 25, WORLD.height-25);
        }
      }
    }
    if(h.life !== undefined && h.life <= 0) state.hazards.splice(i,1);
  }
}
function drawBiomeHazards(){
  ctx.save();
  for(const h of state.hazards){
    const p = worldToScreen(h.x,h.y);
    const warm = h.warmup && h.warmup > 0;
    const alpha = warm ? 0.42 + Math.sin(state.t*8+h.x*0.01)*0.08 : 0.80;
    if(h.type==='puddle'){
      ctx.globalAlpha = alpha;
      ctx.fillStyle = warm ? 'rgba(141,255,122,.12)' : 'rgba(98,255,129,.18)';
      ctx.beginPath(); ctx.arc(p.x,p.y,h.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = warm ? 'rgba(184,255,147,.58)' : 'rgba(134,255,162,.75)'; ctx.lineWidth = warm?2:3; ctx.beginPath(); ctx.arc(p.x,p.y,h.r*(1+Math.sin(state.t*4+h.seed)*0.03),0,Math.PI*2); ctx.stroke();
    } else if(h.type==='resonance'){
      ctx.globalAlpha = warm ? 0.44 : 0.84;
      ctx.strokeStyle = warm ? 'rgba(255,222,128,.68)' : 'rgba(255,233,160,.96)'; ctx.lineWidth = warm ? 2.5 : 4;
      ctx.beginPath(); ctx.arc(p.x,p.y,h.r*(warm?1.0:1.12),0,Math.PI*2); ctx.stroke();
    } else if(h.type==='roots'){
      ctx.globalAlpha = warm ? 0.38 : 0.74;
      ctx.fillStyle = warm ? 'rgba(122,255,143,.10)' : 'rgba(94,209,103,.16)'; ctx.beginPath(); ctx.arc(p.x,p.y,h.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = warm ? 'rgba(173,255,164,.52)' : 'rgba(147,255,160,.92)'; ctx.lineWidth = 3; for(let i=0;i<5;i++){ const ang = i*Math.PI*0.4 + state.t*0.35; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+Math.cos(ang)*h.r*0.95,p.y+Math.sin(ang)*h.r*0.95); ctx.stroke(); }
    } else if(h.type==='anomaly'){
      ctx.globalAlpha = warm ? 0.34 : 0.82;
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,h.r); g.addColorStop(0,warm?'rgba(176,146,255,.14)':'rgba(147,137,255,.24)'); g.addColorStop(1,'rgba(79,54,122,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,h.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = warm ? 'rgba(193,162,255,.62)' : 'rgba(189,163,255,.92)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x,p.y,h.r*(1+Math.sin(state.t*3+h.x*0.01)*0.04),0,Math.PI*2); ctx.stroke();
    } else if(h.type==='tornado'){
      ctx.globalAlpha = 0.78;
      ctx.strokeStyle = 'rgba(255,228,180,.88)'; ctx.lineWidth = 3;
      for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(p.x, p.y - i*8, h.r*(0.34 + i*0.14), state.t*2.6+i, state.t*2.6+i+Math.PI*1.3); ctx.stroke(); }
    }
  }
  ctx.restore();
}

function gainXp(v,x,y){ const gain = v * 1.28 * (1 + player.xpBonus); state.xp += gain; state.genes += Math.max(1, Math.round(v*0.58)); if (x!==undefined) popup(`+${Math.round(gain)} XP`, x, y, '#9ef7bf'); while (state.xp >= state.nextXp) { state.xp -= state.nextXp; state.level += 1; state.nextXp = xpNeed(state.level); openLevelUp(); break; } }

function applyDamage(enemy, amount, source='hit'){
  if (!enemy) return;
  const crit = Math.random() < player.critChance;
  const rushLvl = player.mutationLevels.predatorrush || 0;
  const rushMult = (rushLvl > 0 && player.predatorRush > 0) ? (1 + player.predatorStacks * (0.03 + rushLvl*0.01)) : 1;
  const dmg = Math.round(amount * weaponBoost(source) * (crit ? player.critMult : 1) * player.damageMult * rushMult);
  enemy.hp -= dmg;
  const col = source==='acid'?'#9fff91':source==='beam'?'#7edfff':source==='void'?'#b885ff':source==='cloud'?'#b7ff8a':source==='frost'?'#98edff':source==='chain'?'#8df0ff':source==='ember'?'#ffb17a':source==='storm'?'#ffe16c':source==='venom'?'#76ff91':'#ffd1f6';
  emit(enemy.x, enemy.y, col, crit?9:4, crit?120:70, crit?2.8:1.8);
  if(crit) ring(enemy.x,enemy.y,'rgba(255,217,120,.74)',34,0.28,3);
  popup(`${crit?'Крит ':''}${dmg}`, enemy.x, enemy.y-6, crit?'#ffd978':'#fff');
  if (enemy.hp <= 0) killEnemy(enemy);
}
function killEnemy(enemy){ const i = state.enemies.indexOf(enemy); if (i>=0) state.enemies.splice(i,1); state.kills += 1; if (player.killHeal > 0) player.hp = Math.min(player.maxHp, player.hp + player.killHeal); if((player.mutationLevels.predatorrush||0)>0){ const lvl = player.mutationLevels.predatorrush; player.predatorStacks = Math.min(2 + lvl, (player.predatorStacks||0) + 1); player.predatorRush = 2.0 + lvl*0.45; emit(player.x,player.y,'#ff8fab',7+lvl,160,2.2); } const xp = enemy.bossEvent ? (155 + enemy.bossLevel*7) : enemy.type==='boss'?54:enemy.type==='brood'?18:enemy.type==='brute'?14:enemy.type==='blob'?13:enemy.type==='eye'?13:enemy.type==='spitter'?10:7; gainXp(xp, enemy.x, enemy.y); state.orbs.push({x:enemy.x,y:enemy.y,v:enemy.genes,r:10+enemy.genes*0.35,life:10}); if(enemy.bossEvent){ state.bossKillCount += 1; for(let k=0;k<6;k++) state.orbs.push({x:enemy.x+rand(-50,50),y:enemy.y+rand(-50,50),v:Math.ceil(enemy.genes*0.55),r:14,life:12}); toast('Босс побеждён! Доступен синтез.'); state.pendingFusion = true; } state.corpses.push({x:enemy.x,y:enemy.y,r:enemy.r,color:enemy.color,life:2.6}); ring(enemy.x,enemy.y, enemy.bossEvent?'rgba(255,214,109,.78)':'rgba(255,143,190,.52)', enemy.bossEvent?110:46, enemy.bossEvent?0.72:0.34, enemy.bossEvent?5:3); emit(enemy.x, enemy.y, enemy.bossEvent?'#ffd66d':'#ff8fab', enemy.bossEvent||enemy.type==='boss'?34:12, enemy.bossEvent?260:160, enemy.bossEvent?4:2.6); if (enemy.type==='blob') { for(let k=0;k<2;k++) { state.enemies.push({type:'runner', x:enemy.x+rand(-18,18), y:enemy.y+rand(-18,18), vx:0, vy:0, r:14, hp:18+state.wave, maxHp:18+state.wave, speed:160+state.wave, touch:7, genes:2, color:'#d5ff6a', kind:'melee', seed:Math.random()*100, shot:0, summon:0, dash:0, dashTimer:0.8+Math.random()*0.4, splitDone:false, bossEvent:false, bossLevel:0, name:'Бегунец' }); } } 
if (state.enemies.length === 0 && state.waveSpawned >= state.waveTarget) {
    const progress = state.biomeIndex*20 + state.biomeWave;
    state.bestWave = Math.max(state.bestWave, progress);
    saveBest();
    if (state.biomeWave >= 20) {
      completeBiomeRun();
    } else {
      state.wave += 1;
      state.biomeWave += 1;
      spawnWave(state.wave);
    }
  } }

function enemiesByDistance(fromX=player.x, fromY=player.y, range=player.targetRange){
  return [...state.enemies]
    .map(e => ({e, d:dist(fromX,fromY,e.x,e.y)}))
    .filter(o => o.d <= range)
    .sort((a,b)=>a.d-b.d)
    .map(o=>o.e);
}

function shootProjectile(fromX,fromY,target,opts={}){
  if (!target) return null;
  const a = angleTo(fromX,fromY,target.x,target.y) + (opts.spread||0);
  const proj = {
    x:fromX, y:fromY,
    vx:Math.cos(a)*(opts.speed||player.projectileSpeed),
    vy:Math.sin(a)*(opts.speed||player.projectileSpeed),
    r:opts.r||6,
    life:opts.life||player.projectileLife,
    damage:opts.damage||player.baseDamage,
    color:opts.color||'#7bf2ff',
    splash:opts.splash||0,
    pierce:opts.pierce||0,
    source:opts.source||'acid',
    mortar:!!opts.mortar,
    cloud:!!opts.cloud,
    void:!!opts.void,
    kind:opts.kind||null,
    hitSet:new Set()
  };
  for(const [k,v] of Object.entries(opts)){
    if(!(k in proj) || ['kind','rot','spin','returning','bounces','homing','trailTick','warmup','armed','armTime','range','owner','elapsed','chill','radius','pulse','targetX','targetY','spinDir','arc','size','once','ringColor'].includes(k)) proj[k]=v;
  }
  state.projectiles.push(proj);
  return proj;
}

function firePrimary(){
  const targets = enemiesByDistance(player.x, player.y, player.targetRange).slice(0, Math.max(1, player.projectileCount));
  if (!targets.length) return;
  for (let i=0;i<Math.max(1,player.projectileCount);i++){
    const target = targets[i] || targets[0];
    const offset = i===0 ? 0 : (i%2===0 ? 8 : -8);
    shootProjectile(player.x, player.y, {x:target.x+offset, y:target.y-offset}, {
      damage: player.baseDamage,
      color:'#7bf2ff',
      source:'acid',
      r:6
    });
  }
  if ((player.weapons.hydra||0) > 0){
    const lvl = player.weapons.hydra;
    const extraTargets = enemiesByDistance(player.x, player.y, player.targetRange+60).slice(0, 2 + Math.floor(lvl/2));
    extraTargets.forEach((target, idx)=>{
      shootProjectile(player.x, player.y, {x:target.x, y:target.y}, {
        damage: player.baseDamage*(0.55 + lvl*0.08),
        speed: player.projectileSpeed + 80,
        spread: (idx-1)*0.14,
        color:'#65ffd4',
        source:'acid',
        r:5
      });
    });
  }
  emit(player.x, player.y, '#78f0ff', 3, 36, 2);
}
function fireBoneburst(){
  const t = enemiesByDistance(player.x, player.y, 740)[0];
  if (!t) return;
  const level = player.weapons.boneburst || 0;
  const base = angleTo(player.x,player.y,t.x,t.y);
  const count = 5 + level;
  for(let i=0;i<count;i++){
    const spread = (i/(count-1 || 1)-0.5) * (0.62 + level*0.04);
    shootProjectile(player.x, player.y, {
      x: player.x + Math.cos(base+spread)*220,
      y: player.y + Math.sin(base+spread)*220
    }, {
      damage: player.baseDamage*0.72 + level*4,
      speed: 650 + level*28,
      life: 0.9,
      color:'#ffd0ff',
      source:'bone',
      r:4
    });
  }
}
function fireMortar(){
  const t = enemiesByDistance(player.x, player.y, 780)[0];
  if (!t) return;
  const level = player.weapons.mortar || 0;
  state.projectiles.push({
    x:player.x, y:player.y,
    vx:(t.x-player.x)*0.9,
    vy:(t.y-player.y)*0.9,
    r:10,
    life:0.7,
    damage: player.baseDamage*1.25 + level*7,
    color:'#95ff68',
    splash: 92 + level*18,
    source:'acidbomb',
    mortar:true,
    hitSet:new Set()
  });
}
function firePlasma(){
  const level = player.weapons.plasma || 0;
  const t = enemiesByDistance(player.x, player.y, 780)[0];
  if (!t) return;
  applyDamage(t, player.baseDamage*1.45 + level*8, 'beam');
  emit(t.x, t.y, '#7edfff', 10, 140, 3);
  state.texts.push({beam:true,x1:player.x,y1:player.y,x2:t.x,y2:t.y,life:0.15,color:'#6fdcff'});
  if(level >= 3){
    const chain = enemiesByDistance(t.x,t.y,170+level*22).filter(e=>e!==t).slice(0, level>=5?2:1);
    for(const e of chain){
      applyDamage(e, player.baseDamage*0.9 + level*5, 'beam');
      state.texts.push({beam:true,x1:t.x,y1:t.y,x2:e.x,y2:e.y,life:0.12,color:'#8ce8ff'});
    }
  }
}
function fireCloud(){
  const level = player.weapons.cloud || 0;
  state.projectiles.push({
    x:player.x, y:player.y, vx:0, vy:0,
    r:56 + level*14 + (player.weapons.vitalbloom||0)*8,
    life:0.85,
    damage:10 + level*4 + (player.weapons.vitalbloom||0)*4,
    color:'rgba(164,255,91,.38)',
    source:'cloud',
    cloud:true,
    hitSet:new Set()
  });
}
function fireWhip(){
  const level = player.weapons.whip || 0;
  const t = enemiesByDistance(player.x, player.y, 220 + level*18)[0];
  if(!t) return;
  applyDamage(t, player.baseDamage*1.05 + level*7, 'whip');
  state.texts.push({beam:true,x1:player.x,y1:player.y,x2:t.x,y2:t.y,life:0.08,color:'#d86dff'});
}
function fireVoid(){
  const level = player.weapons.void || 0;
  const t = enemiesByDistance(player.x, player.y, 780)[0];
  if(!t) return;
  state.projectiles.push({
    x:t.x, y:t.y, vx:0, vy:0,
    r:24,
    life:0.75,
    damage:16 + level*8,
    color:'rgba(162,74,255,.55)',
    source:'void',
    void:true,
    hitSet:new Set()
  });
}
function fireSolarBloom(){
  const level = player.weapons.bloom || 0;
  if(level <= 0) return;
  const radius = 120 + level*28;
  for(const e of [...state.enemies]) if(dist(player.x,player.y,e.x,e.y) < radius + e.r) applyDamage(e, player.baseDamage*(1.15 + level*0.14), 'bloom');
  emit(player.x, player.y, '#ffcf65', 28, 240, 4);
  popup('Солнечное цветение', player.x, player.y-58, '#ffd86c');
}
function fireStarHalo(){
  const level = player.weapons.starhalo || 0;
  if(level <= 0) return;
  const targets = enemiesByDistance(player.x, player.y, 760).slice(0, 2 + Math.floor(level/2));
  if(!targets.length) return;
  const count = Math.max(3, 2 + Math.floor(player.weapons.orbit/2));
  const radius = 74 + player.weapons.orbit*6;
  targets.forEach((t, idx)=>{
    const a = player.orbitAngle + idx*Math.PI*2/Math.max(1,count);
    const ox = player.x + Math.cos(a)*radius;
    const oy = player.y + Math.sin(a)*radius;
    applyDamage(t, player.baseDamage*(1.05 + level*0.18), 'beam');
    state.texts.push({beam:true,x1:ox,y1:oy,x2:t.x,y2:t.y,life:0.15,color:'#ffe086'});
  });
}
function ensureBroodMinions(){
  const level = player.weapons.brood || 0;
  if(level<=0) return;
  const cap = 2 + level + (player.weapons.hivequeen||0);
  while(state.minions.length < cap){
    state.minions.push({
      x:player.x+rand(-25,25),
      y:player.y+rand(-25,25),
      vx:0, vy:0, r:10,
      damage:8+level*4 + (player.weapons.hivequeen||0)*3,
      speed:220+level*12 + (player.weapons.hivequeen||0)*8,
      orbit:Math.random()*Math.PI*2,
      hitCd:0
    });
  }
}
function updateMinions(dt){
  for(const m of state.minions){
    const target = enemiesByDistance(m.x,m.y,320 + (player.weapons.hivequeen||0)*30)[0];
    if(target){
      const a = angleTo(m.x,m.y,target.x,target.y);
      m.vx = lerp(m.vx, Math.cos(a)*m.speed, 0.06);
      m.vy = lerp(m.vy, Math.sin(a)*m.speed, 0.06);
      if(dist(m.x,m.y,target.x,target.y) < m.r + target.r + 4 && m.hitCd <= 0){
        applyDamage(target, m.damage, 'parasite');
        if((player.weapons.hivequeen||0) > 0){
          for(const e of [...state.enemies]) if(e!==target && dist(target.x,target.y,e.x,e.y) < 56 + player.weapons.hivequeen*12) applyDamage(e, m.damage*0.55, 'parasite');
        }
        m.hitCd = 0.45;
        emit(m.x,m.y,'#ff9d7a',4,60,2);
      }
    } else {
      m.orbit += dt*1.7;
      const tx = player.x + Math.cos(m.orbit)*(36 + state.minions.indexOf(m)*4);
      const ty = player.y + Math.sin(m.orbit)*(36 + state.minions.indexOf(m)*4);
      m.vx = lerp(m.vx, (tx-m.x)*4, 0.08);
      m.vy = lerp(m.vy, (ty-m.y)*4, 0.08);
    }
    m.hitCd -= dt;
    m.x += m.vx*dt;
    m.y += m.vy*dt;
  }
}
function updateOrbitals(dt){
  if((player.weapons.orbit||0)<=0) return;
  player.orbitAngle += dt*(1.2 + player.weapons.orbit*0.08);
  const count = 2 + Math.floor(player.weapons.orbit/2);
  const radius = 64 + player.weapons.orbit*6;
  for(let i=0;i<count;i++){
    const a = player.orbitAngle + i*Math.PI*2/count;
    const ox = player.x + Math.cos(a)*radius;
    const oy = player.y + Math.sin(a)*radius;
    for(const e of [...state.enemies]){
      if(dist(ox,oy,e.x,e.y) < e.r + 12) applyDamage(e, 12 + player.weapons.orbit*4 + (player.weapons.starhalo||0)*2, 'orbit');
    }
  }
}

function nearestEnemyFrom(x,y,range=player.targetRange, exclude=new Set()){
  const list = [...state.enemies].filter(e => !exclude.has(e)).map(e=>({e,d:dist(x,y,e.x,e.y)})).filter(o=>o.d<=range).sort((a,b)=>a.d-b.d);
  return list.length ? list[0].e : null;
}
function enemiesNear(x,y,range, exclude=new Set()){
  return [...state.enemies].filter(e => !exclude.has(e) && dist(x,y,e.x,e.y)<=range).sort((a,b)=>dist(x,y,a.x,a.y)-dist(x,y,b.x,b.y));
}
function lineDistance(x1,y1,x2,y2,px,py){
  const A=px-x1,B=py-y1,C=x2-x1,D=y2-y1; const dot=A*C+B*D; const len=C*C+D*D || 1; const t=clamp(dot/len,0,1); const ex=x1+t*C, ey=y1+t*D; return dist(px,py,ex,ey);
}
function triggerCocoonPulse(){
  const lvl = player.mutationLevels.cocoon || 0;
  if(!lvl) return;
  const rad = 94 + lvl*18;
  const dmg = player.baseDamage * (0.85 + lvl*0.28);
  ring(player.x,player.y,'rgba(160,220,255,.64)',rad,0.42,4);
  emit(player.x,player.y,'#9ce6ff',18+lvl*3,200,3.2);
  for(const e of [...state.enemies]){
    const d = dist(player.x,player.y,e.x,e.y);
    if(d <= rad + e.r){
      applyDamage(e,dmg,'beam');
      const a = angleTo(player.x,player.y,e.x,e.y);
      e.x += Math.cos(a)*(42+lvl*10);
      e.y += Math.sin(a)*(42+lvl*10);
    }
  }
}
function fireNeedleCascade(){
  const lvl = player.weapons.needle; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+80); if(!target) return;
  const baseA = angleTo(player.x,player.y,target.x,target.y); const count = 2 + lvl;
  for(let i=0;i<count;i++){
    const spread = (i-(count-1)/2) * (0.085 - Math.min(0.045,lvl*0.004));
    shootProjectile(player.x,player.y,{x:player.x+Math.cos(baseA+spread)*100,y:player.y+Math.sin(baseA+spread)*100},{kind:'needle',damage:player.baseDamage*(0.48+lvl*0.13),speed:player.projectileSpeed+240,life:0.95+lvl*0.05,r:4,color:'#d9fbff',source:'acid',pierce:1+Math.floor(lvl/2)});
  }
}
function fireBoomer(){
  const lvl = player.weapons.boomer; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+60); if(!target) return;
  shootProjectile(player.x,player.y,target,{kind:'boomer',damage:player.baseDamage*(0.95+lvl*0.18),speed:340+lvl*18,life:1.55,r:11,color:'#6dffe4',source:'acid',range:210+lvl*32,elapsed:0,rot:0});
}
function firePrism(){
  const lvl = player.weapons.prism; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+100); if(!target) return;
  shootProjectile(player.x,player.y,target,{kind:'prism',damage:player.baseDamage*(0.82+lvl*0.18),speed:420+lvl*26,life:1.45,r:10,color:'#9ef6ff',source:'beam',bounces:1+Math.floor(lvl/2),rot:0});
}
function fireChain(){
  const lvl = player.weapons.chain; const first = nearestEnemyFrom(player.x,player.y,player.targetRange+120); if(!first) return;
  let prev = {x:player.x,y:player.y}; let current = first; const hit = new Set();
  for(let i=0;i<2+lvl;i++){
    if(!current || hit.has(current)) break;
    hit.add(current);
    state.texts.push({beam:true,x1:prev.x,y1:prev.y,x2:current.x,y2:current.y,color:'#8df0ff',life:0.16});
    applyDamage(current, player.baseDamage*(0.9+lvl*0.26)*(i===0?1:0.78), 'chain');
    emit(current.x,current.y,'#95f6ff',6,110,2);
    prev = current;
    current = nearestEnemyFrom(prev.x,prev.y,155+lvl*15,hit);
  }
}
function fireMine(){
  const lvl = player.weapons.mine; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+40) || {x:player.x+rand(-90,90),y:player.y+rand(-90,90)};
  state.projectiles.push({x:target.x,y:target.y,vx:0,vy:0,r:13,life:1.8+lvl*0.1,damage:player.baseDamage*(1.18+lvl*0.24),color:'#ff71d5',source:'acid',kind:'mine',armTime:Math.max(0.35,0.82-lvl*0.07),elapsed:0,splash:74+lvl*12,hitSet:new Set()});
}
function fireGeyser(){
  const lvl = player.weapons.geyser; const count = 1 + Math.floor(lvl/3); const targets = enemiesByDistance(player.x,player.y,player.targetRange+80).slice(0,count); if(!targets.length) return;
  targets.forEach((t,idx)=> state.projectiles.push({x:t.x+rand(-16,16),y:t.y+rand(-16,16),vx:0,vy:0,r:30+lvl*6,life:1.08,damage:player.baseDamage*(1.0+lvl*0.22),color:'#9bff8f',source:'acid',kind:'geyser',warmup:0.44+idx*0.05,elapsed:0,hitSet:new Set()}));
}
function fireFrost(){
  const lvl = player.weapons.frost; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+80); if(!target) return;
  const count = 2 + Math.ceil(lvl/2); const baseA = angleTo(player.x,player.y,target.x,target.y);
  for(let i=0;i<count;i++){
    const spread = (i-(count-1)/2)*0.12;
    shootProjectile(player.x,player.y,{x:player.x+Math.cos(baseA+spread)*80,y:player.y+Math.sin(baseA+spread)*80},{kind:'frost',damage:player.baseDamage*(0.65+lvl*0.12),speed:player.projectileSpeed+70,life:1.08,r:8,color:'#abf5ff',source:'frost',chill:0.65+lvl*0.1,pierce:Math.floor(lvl/3)});
  }
}
function fireSeeker(){
  const lvl = player.weapons.seeker; const count = 1 + Math.floor((lvl+1)/2);
  for(let i=0;i<count;i++){
    const ang = state.t*3 + i*Math.PI*2/count;
    state.projectiles.push({x:player.x+Math.cos(ang)*18,y:player.y+Math.sin(ang)*18,vx:Math.cos(ang)*220,vy:Math.sin(ang)*220,r:10,life:1.8+lvl*0.1,damage:player.baseDamage*(0.78+lvl*0.12),color:'#77f7ff',source:'beam',kind:'seeker',homing:0.08+lvl*0.012,rot:ang,hitSet:new Set()});
  }
}
function fireRail(){
  const lvl = player.weapons.rail; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+170); if(!target) return;
  const a = angleTo(player.x,player.y,target.x,target.y); const len = 680 + lvl*55; const x2 = player.x + Math.cos(a)*len, y2 = player.y + Math.sin(a)*len;
  state.texts.push({beam:true,x1:player.x,y1:player.y,x2,y2,color:'#fff2a8',life:0.18});
  emit(x2,y2,'#ffd87f',12,140,2.8);
  for(const e of [...state.enemies]) if(lineDistance(player.x,player.y,x2,y2,e.x,e.y) <= e.r + 18 + lvl*2) applyDamage(e, player.baseDamage*(1.2+lvl*0.28), 'rail');
}
function fireEmber(){
  const lvl = player.weapons.ember; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+80); if(!target) return;
  const count = 1 + Math.floor(lvl/3);
  for(let i=0;i<count;i++) shootProjectile(player.x,player.y,target,{kind:'ember',damage:player.baseDamage*(0.84+lvl*0.15),speed:player.projectileSpeed+120,life:1.02,r:9,color:'#ffb072',source:'ember',splash:26+lvl*8,trailTick:0});
}
function fireSpiral(){
  const lvl = player.weapons.spiral; const count = 5 + lvl; const base = state.t*2.6;
  for(let i=0;i<count;i++){
    const a = base + i*Math.PI*2/count;
    state.projectiles.push({x:player.x,y:player.y,vx:Math.cos(a)*(250+lvl*18),vy:Math.sin(a)*(250+lvl*18),r:8,life:1.2,damage:player.baseDamage*(0.54+lvl*0.12),color:'#ff9eff',source:'acid',kind:'spiral',rot:a,spin:5.5,hitSet:new Set()});
  }
}
function fireSaw(){
  const lvl = player.weapons.saw; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+80); if(!target) return;
  shootProjectile(player.x,player.y,target,{kind:'saw',damage:player.baseDamage*(1.0+lvl*0.18),speed:300+lvl*10,life:1.45,r:13,color:'#bfff4b',source:'acid',pierce:2+Math.floor(lvl/2),rot:0,spin:9+lvl});
}
function fireMirror(){
  const lvl = player.weapons.mirror; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+100); if(!target) return;
  const a = angleTo(player.x,player.y,target.x,target.y); const count = 2 + Math.floor(lvl/3);
  for(let i=0;i<count;i++){
    const dir = i%2===0 ? 1 : -1; const spread = dir*(0.22 + (i>1?0.08:0));
    shootProjectile(player.x,player.y,{x:player.x+Math.cos(a+spread)*100,y:player.y+Math.sin(a+spread)*100},{kind:'mirror',damage:player.baseDamage*(0.82+lvl*0.2),speed:player.projectileSpeed+110,life:1.18,r:10,color:'#ffc0ff',source:'beam',pierce:1,rot:a+spread});
  }
}
function fireVenom(){
  const lvl = player.weapons.venom; const target = nearestEnemyFrom(player.x,player.y,player.targetRange+140); if(!target) return;
  shootProjectile(player.x,player.y,target,{kind:'venom',damage:player.baseDamage*(1.05+lvl*0.2),speed:player.projectileSpeed+170,life:1.0,r:10,color:'#7bff8b',source:'venom',pierce:2+Math.floor(lvl/2),splash:18+lvl*4,rot:0});
}
function fireStorm(){
  const lvl = player.weapons.storm; const count = 7 + lvl*2; const base = player.stormAngle || 0;
  for(let i=0;i<count;i++){
    const a = base + i*Math.PI*2/count;
    state.projectiles.push({x:player.x,y:player.y,vx:Math.cos(a)*(210+lvl*16),vy:Math.sin(a)*(210+lvl*16),r:9,life:1.25,damage:player.baseDamage*(0.70+lvl*0.14),color:'#d6ff73',source:'storm',kind:'storm',rot:a,spin:4.2,hitSet:new Set()});
  }
  player.stormAngle = base + 0.45;
}


function updateWeapons(dt){
  const c = player.cooldowns;
  for(const key of Object.keys(c)) c[key] -= dt;
  const cd = player.cooldownFactor || 1;
  if(c.acid <= 0){ firePrimary(); c.acid = player.fireRate * cd; }
  if((player.weapons.boneburst||0)>0 && c.boneburst <= 0){ fireBoneburst(); c.boneburst = Math.max(0.55, 1.45 - player.weapons.boneburst*0.08) * cd; }
  if((player.weapons.mortar||0)>0 && c.mortar <= 0){ fireMortar(); c.mortar = Math.max(0.95, 2.5 - player.weapons.mortar*0.12) * cd; }
  if((player.weapons.plasma||0)>0 && c.plasma <= 0){ firePlasma(); c.plasma = Math.max(0.7, 2.1 - player.weapons.plasma*0.13) * cd; }
  if((player.weapons.cloud||0)>0 && c.cloud <= 0){ fireCloud(); c.cloud = Math.max(1.0, 2.6 - player.weapons.cloud*0.12) * cd; }
  if((player.weapons.whip||0)>0 && c.whip <= 0){ fireWhip(); c.whip = Math.max(0.32, 1.1 - player.weapons.whip*0.08) * cd; }
  if((player.weapons.void||0)>0 && c.void <= 0){ fireVoid(); c.void = Math.max(1.8, 4.2 - player.weapons.void*0.18) * cd; }
  if((player.weapons.bloom||0)>0 && c.bloom <= 0){ fireSolarBloom(); c.bloom = Math.max(2.6, 5.2 - player.weapons.bloom*0.35) * cd; }
  if((player.weapons.starhalo||0)>0 && c.starhalo <= 0){ fireStarHalo(); c.starhalo = Math.max(2.0, 4.8 - player.weapons.starhalo*0.35) * cd; }
  if((player.weapons.needle||0)>0 && c.needle <= 0){ fireNeedleCascade(); c.needle = Math.max(0.48, 1.25 - player.weapons.needle*0.08) * cd; }
  if((player.weapons.boomer||0)>0 && c.boomer <= 0){ fireBoomer(); c.boomer = Math.max(0.9, 2.0 - player.weapons.boomer*0.12) * cd; }
  if((player.weapons.prism||0)>0 && c.prism <= 0){ firePrism(); c.prism = Math.max(0.75, 1.75 - player.weapons.prism*0.11) * cd; }
  if((player.weapons.chain||0)>0 && c.chain <= 0){ fireChain(); c.chain = Math.max(0.95, 2.45 - player.weapons.chain*0.16) * cd; }
  if((player.weapons.mine||0)>0 && c.mine <= 0){ fireMine(); c.mine = Math.max(0.95, 2.45 - player.weapons.mine*0.14) * cd; }
  if((player.weapons.geyser||0)>0 && c.geyser <= 0){ fireGeyser(); c.geyser = Math.max(0.85, 2.3 - player.weapons.geyser*0.13) * cd; }
  if((player.weapons.frost||0)>0 && c.frost <= 0){ fireFrost(); c.frost = Math.max(0.65, 1.55 - player.weapons.frost*0.1) * cd; }
  if((player.weapons.seeker||0)>0 && c.seeker <= 0){ fireSeeker(); c.seeker = Math.max(0.8, 1.8 - player.weapons.seeker*0.1) * cd; }
  if((player.weapons.rail||0)>0 && c.rail <= 0){ fireRail(); c.rail = Math.max(1.0, 2.9 - player.weapons.rail*0.18) * cd; }
  if((player.weapons.ember||0)>0 && c.ember <= 0){ fireEmber(); c.ember = Math.max(0.55, 1.35 - player.weapons.ember*0.08) * cd; }
  if((player.weapons.spiral||0)>0 && c.spiral <= 0){ fireSpiral(); c.spiral = Math.max(0.85, 1.8 - player.weapons.spiral*0.1) * cd; }
  if((player.weapons.saw||0)>0 && c.saw <= 0){ fireSaw(); c.saw = Math.max(0.75, 1.65 - player.weapons.saw*0.11) * cd; }
  if((player.weapons.mirror||0)>0 && c.mirror <= 0){ fireMirror(); c.mirror = Math.max(0.85, 2.0 - player.weapons.mirror*0.12) * cd; }
  if((player.weapons.venom||0)>0 && c.venom <= 0){ fireVenom(); c.venom = Math.max(0.7, 1.6 - player.weapons.venom*0.1) * cd; }
  if((player.weapons.storm||0)>0 && c.storm <= 0){ fireStorm(); c.storm = Math.max(1.0, 2.4 - player.weapons.storm*0.15) * cd; }
  ensureBroodMinions();
  updateOrbitals(dt);
  updateMinions(dt);
}


function updatePlayer(dt){
  const mx = (keys.KeyD?1:0) - (keys.KeyA?1:0);
  const my = (keys.KeyS?1:0) - (keys.KeyW?1:0);
  const len = Math.hypot(mx,my) || 1;
  player.predatorRush = Math.max(0, (player.predatorRush||0) - dt);
  if(player.predatorRush<=0 && player.predatorStacks>0) player.predatorStacks = 0;
  const rushMul = player.predatorRush>0 ? 1 + player.predatorStacks*0.055 : 1;
  const sp = player.speed * rushMul * (player.dashTime>0 ? 2.3 : 1);
  player.vx = (mx/len)*sp; player.vy = (my/len)*sp;
  player.x = clamp(player.x + player.vx*dt, 25, WORLD.width-25);
  player.y = clamp(player.y + player.vy*dt, 25, WORLD.height-25);
  player.hp = Math.min(player.maxHp, player.hp + player.regen*dt);
  player.dashTime -= dt; player.dashCd -= dt; player.burstCd -= dt; player.contactTimer = Math.max(0, player.contactTimer - dt); player.contactBlink = Math.max(0, player.contactBlink - dt);
  if((player.mutationLevels.cocoon||0)>0){
    player.cocoonPulse -= dt;
    if(player.cocoonPulse<=0){ triggerCocoonPulse(); player.cocoonPulse = Math.max(4.2, 8.4 - (player.mutationLevels.cocoon||0)*0.65); }
  }
  if(Math.hypot(player.vx,player.vy)>40 && Math.random()<0.18) emit(player.x-rand(-8,8), player.y+26, 'rgba(110,235,255,.35)', 1, 22, 1.6);
  updateWeapons(dt);
}
function useDash(){ if (player.dashCd>0) return; player.dashCd=Math.max(1.55, 2.8 - (player.shopDashCdReduction || 0)); player.dashTime=0.16; emit(player.x,player.y,'#fff',14,220,3); }
function useBurst(){ if (player.burstCd>0) return; player.burstCd=7; emit(player.x,player.y,'#ff79df',22,240,3); for(const e of [...state.enemies]) if(dist(player.x,player.y,e.x,e.y)<player.burstRadius) applyDamage(e, player.baseDamage*(1.7+player.burstBonus),'burst'); }

function updateProjectiles(dt){
  for (let i=state.projectiles.length-1;i>=0;i--) {
    const p = state.projectiles[i];
    p.elapsed = (p.elapsed||0) + dt;
    if (p.mortar) {
      p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
      if (p.life <= 0) { for(const e of [...state.enemies]) if(dist(p.x,p.y,e.x,e.y) < p.splash + e.r) applyDamage(e, p.damage, p.kind || 'acid'); emit(p.x,p.y,'#9fff91',16,180,4); state.projectiles.splice(i,1); }
      continue;
    }
    if (p.cloud) {
      p.life -= dt; p.x = player.x; p.y = player.y;
      for(const e of [...state.enemies]) if(dist(p.x,p.y,e.x,e.y) < p.r + e.r && !p.hitSet.has(e)) { applyDamage(e, p.damage, p.kind || 'cloud'); if((player.weapons.vitalbloom||0)>0) player.hp = Math.min(player.maxHp, player.hp + 1.2 + player.weapons.vitalbloom*0.7); p.hitSet.add(e); }
      if (p.life<=0) state.projectiles.splice(i,1);
      continue;
    }
    if (p.void) {
      p.life -= dt; p.r += dt*(36 + player.weapons.void*12);
      for(const e of state.enemies) {
        const d = dist(p.x,p.y,e.x,e.y);
        if (d < p.r + e.r && !p.hitSet.has(e)) { applyDamage(e, p.damage, p.kind || 'void'); p.hitSet.add(e); }
        if (d < 170 + player.weapons.void*18) { const a = angleTo(e.x,e.y,p.x,p.y); e.x += Math.cos(a)*50*dt; e.y += Math.sin(a)*50*dt; }
      }
      if (p.life<=0) { emit(p.x,p.y,'#b885ff',18,200,4); state.projectiles.splice(i,1); }
      continue;
    }
    if (p.kind==='boomer') {
      p.life -= dt;
      p.rot = (p.rot||0) + dt*9;
      if(!p.returning && (p.elapsed > 0.55 || dist(player.x,player.y,p.x,p.y) > (p.range||220))) p.returning = true;
      if(p.returning){ const a = angleTo(p.x,p.y,player.x,player.y); const sp = Math.hypot(p.vx,p.vy) || 320; p.vx = lerp(p.vx, Math.cos(a)*sp, 0.18); p.vy = lerp(p.vy, Math.sin(a)*sp, 0.18); }
      p.x += p.vx*dt; p.y += p.vy*dt;
      for(const e of [...state.enemies]) if(!p.hitSet.has(e) && dist(p.x,p.y,e.x,e.y) < p.r + e.r){ applyDamage(e,p.damage,p.kind || 'acid'); p.hitSet.add(e); }
      if(p.life<=0 || (p.returning && dist(p.x,p.y,player.x,player.y) < player.r + 10)){ state.projectiles.splice(i,1); }
      continue;
    }
    if (p.kind==='mine') {
      p.life -= dt;
      if(p.life <= p.armTime || p.elapsed >= p.armTime){
        for(const e of [...state.enemies]) if(dist(p.x,p.y,e.x,e.y) < (p.splash*0.62) + e.r){ applyDamage(e,p.damage,p.kind || 'ember'); }
        ring(p.x,p.y,'rgba(255,115,212,.70)',p.splash,0.28,4); emit(p.x,p.y,'#ff7cd8',18,180,3.2); state.projectiles.splice(i,1);
      }
      continue;
    }
    if (p.kind==='geyser') {
      p.life -= dt;
      if(p.elapsed >= p.warmup && !p.once){
        p.once = true;
        for(const e of [...state.enemies]) if(dist(p.x,p.y,e.x,e.y) < p.r + e.r){ applyDamage(e,p.damage,p.kind || 'acid'); e.y -= 12; }
        ring(p.x,p.y,'rgba(168,255,137,.72)',p.r,0.22,5); emit(p.x,p.y,'#95ffcf',22,210,3.6);
      }
      if(p.life<=0) state.projectiles.splice(i,1);
      continue;
    }
    if (p.kind==='seeker') {
      p.life -= dt; const t = nearestEnemyFrom(p.x,p.y,player.targetRange+120,p.hitSet); if(t){ const a=angleTo(p.x,p.y,t.x,t.y); const sp=Math.hypot(p.vx,p.vy)||260; p.vx=lerp(p.vx,Math.cos(a)*sp,clamp(p.homing||0.08,0.03,0.35)); p.vy=lerp(p.vy,Math.sin(a)*sp,clamp(p.homing||0.08,0.03,0.35)); p.rot=a; }
    }
    if (p.kind==='ember') {
      p.trailTick = (p.trailTick||0) - dt;
      if(p.trailTick<=0){ emit(p.x,p.y,'rgba(255,146,93,.55)',3,60,1.2); p.trailTick = 0.06; }
    }
    if (p.kind==='spiral' || p.kind==='mirror' || p.kind==='storm' || p.kind==='saw' || p.kind==='prism' || p.kind==='venom' || p.kind==='needle' || p.kind==='frost'){
      p.rot = (p.rot||0) + dt*((p.spin||0) + 2.5);
    }
    if (p.kind==='prism') {
      p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
      let removed = p.life<=0;
      for (const e of [...state.enemies]) {
        if(p.hitSet.has(e)) continue;
        if(dist(p.x,p.y,e.x,e.y) < p.r + e.r){
          applyDamage(e,p.damage,p.kind || 'beam'); p.hitSet.add(e);
          if((p.bounces||0)>0){ const next = nearestEnemyFrom(e.x,e.y,210,p.hitSet); if(next){ const a=angleTo(e.x,e.y,next.x,next.y); const sp=Math.hypot(p.vx,p.vy)||360; p.vx=Math.cos(a)*sp; p.vy=Math.sin(a)*sp; p.bounces -= 1; p.x=e.x; p.y=e.y; removed=false; emit(e.x,e.y,'#9bf6ff',6,100,2); break; } }
          removed = true; break;
        }
      }
      if(removed) state.projectiles.splice(i,1);
      continue;
    }
    p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
    let remove = p.life<=0 || p.x<0 || p.y<0 || p.x>WORLD.width || p.y>WORLD.height;
    for (const e of [...state.enemies]) {
      if (p.hitSet.has(e)) continue;
      if (dist(p.x,p.y,e.x,e.y) < p.r + e.r) {
        applyDamage(e, p.damage, p.kind || p.source);
        p.hitSet.add(e);
        if (p.chill) e.chill = Math.max(e.chill||0, p.chill);
        if (p.splash>0) for(const ex of [...state.enemies]) if(ex!==e && dist(p.x,p.y,ex.x,ex.y) < p.splash + ex.r) applyDamage(ex, p.damage*0.6, p.kind || p.source);
        if ((p.kind==='saw' || p.kind==='venom' || p.kind==='needle' || p.kind==='frost' || p.kind==='mirror' || p.kind==='storm') && p.pierce>0) { p.pierce -= 1; remove = false; continue; }
        if (p.kind==='seeker' || p.kind==='ember') { emit(p.x,p.y,p.kind==='ember'?'#ffb072':'#76f4ff',8,90,2); remove = true; }
        else if (p.kind==='boomer') remove = false;
        else remove = true;
        break;
      }
    }
    if (remove) state.projectiles.splice(i,1);
  }
}
function enemyShoot(enemy, color='#57e8a4', speed=320, damage=10, angle=null){ const a=angle===null ? angleTo(enemy.x,enemy.y,player.x,player.y) : angle; state.enemyProjectiles.push({x:enemy.x+Math.cos(a)*enemy.r,y:enemy.y+Math.sin(a)*enemy.r,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:5,life:2.4,damage,color}); }
function resolveCrowding(){ let pushX=0, pushY=0, contacts=0; for (let i=0;i<state.enemies.length;i++){ const e=state.enemies[i]; const dx=player.x-e.x, dy=player.y-e.y; let d=Math.hypot(dx,dy); if(d<0.001){ d=0.001; } const minDist = player.r + e.r - 6; if(d < minDist){ const overlap = minDist - d; const nx = dx/d, ny = dy/d; pushX += nx * overlap; pushY += ny * overlap; e.x -= nx * overlap * 0.42; e.y -= ny * overlap * 0.42; contacts++; } for (let j=i+1;j<state.enemies.length;j++){ const o=state.enemies[j]; const ex=e.x-o.x, ey=e.y-o.y; let ed=Math.hypot(ex,ey); if(ed<0.001){ ed=0.001; } const need = e.r + o.r - 10; if(ed < need){ const ov = need - ed; const nx = ex/ed, ny = ey/ed; const shove = ov * 0.26; e.x += nx * shove; e.y += ny * shove; o.x -= nx * shove; o.y -= ny * shove; } } } if(contacts){ const gain = Math.min(1.45, 0.80 + contacts*0.08); player.x = clamp(player.x + pushX * gain, 25, WORLD.width-25); player.y = clamp(player.y + pushY * gain, 25, WORLD.height-25); } }
function updateEnemyProjectiles(dt){
  for(let i=state.enemyProjectiles.length-1;i>=0;i--){
    const p=state.enemyProjectiles[i];
    p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt;
    if(dist(p.x,p.y,player.x,player.y) < p.r + player.r){
      const damage = Math.max(1, p.damage * (1 - player.damageReduction));
      player.hp -= damage;
      popup(`-${Math.round(damage)}`, player.x, player.y-25, '#ff9a9a');
      emit(player.x,player.y,p.color,5,120,3);
      state.enemyProjectiles.splice(i,1); continue;
    }
    if(p.life<=0 || p.x<0||p.y<0||p.x>WORLD.width||p.y>WORLD.height) state.enemyProjectiles.splice(i,1);
  }
}

function updateBossPattern(e, dt, baseAngle){
  e.skillCd -= dt;
  if (e.supportCd !== undefined) e.supportCd -= dt;
  if (e.bossPattern === 'charger' && e.chargeTime > 0){ e.chargeTime -= dt; }
  if (e.bossPattern === 'gravity' && e.gravityTime > 0){
    e.gravityTime -= dt;
    const d = dist(player.x,player.y,e.x,e.y);
    if(d < 320 + (e.mega?60:0)){ const a = angleTo(player.x,player.y,e.x,e.y); player.x += Math.cos(a)*(e.mega?105:85)*dt; player.y += Math.sin(a)*(e.mega?105:85)*dt; }
  }
  if(e.mega && e.supportCd <= 0){
    for(let k=0;k<3;k++) spawnEnemy(Math.random()<0.4?'runner':(Math.random()<0.7?'spitter':'skitter'), { pos:{ x:clamp(e.x+rand(-180,180),30,WORLD.width-30), y:clamp(e.y+rand(-180,180),30,WORLD.height-30) } });
    popup('Призыв роя', e.x, e.y-e.r-36, '#ffe5ff');
    emit(e.x,e.y,'#ffb3ef',18,180,3);
    e.supportCd = 7.0;
  }
  if (e.skillCd > 0) return;
  if (e.bossPattern === 'nova'){
    const shots = e.mega ? 18 : 12;
    for(let i=0;i<shots;i++) enemyShoot(e, e.mega ? '#ff9ff5' : '#ffcb6a', e.mega?310:270, (e.mega?18:12) + state.wave*0.7, i*Math.PI*2/shots);
    popup(e.bossSkillName, e.x, e.y-e.r-26, e.mega?'#ffc3ff':'#ffd57a');
    emit(e.x,e.y,e.mega?'#ff9ff5':'#ffd57a',24,180,3);
    e.skillCd = e.mega ? 4.2 : 4.8;
  } else if (e.bossPattern === 'summoner'){
    const count = e.mega ? 7 : 5;
    for(let k=0;k<count;k++) spawnEnemy(Math.random()<0.4?'brute':(Math.random()<0.65?'spitter':'runner'), { pos:{ x:clamp(e.x+rand(-180,180),30,WORLD.width-30), y:clamp(e.y+rand(-180,180),30,WORLD.height-30) } });
    popup(e.bossSkillName, e.x, e.y-e.r-26, '#d8b0ff');
    emit(e.x,e.y,'#c48cff',18,160,3);
    e.skillCd = e.mega ? 4.8 : 6.2;
  } else if (e.bossPattern === 'charger'){
    e.chargeTime = e.mega ? 1.0 : 0.72;
    e.chargeAngle = baseAngle;
    popup(e.bossSkillName, e.x, e.y-e.r-26, '#ff9f8a');
    emit(e.x,e.y,'#ff9f8a',16,160,3);
    e.skillCd = e.mega ? 4.2 : 5.2;
  } else if (e.bossPattern === 'gravity'){
    e.gravityTime = e.mega ? 2.7 : 2.0;
    popup(e.bossSkillName, e.x, e.y-e.r-26, '#b78eff');
    emit(e.x,e.y,'#b78eff',18,180,3);
    e.skillCd = e.mega ? 4.9 : 6.0;
  }
  if(e.biomeHazard === 'puddle'){
    const n = e.mega ? 3 : 2;
    for(let i=0;i<n;i++) spawnPuddle(clamp(player.x + rand(-120,120), 70, WORLD.width-70), clamp(player.y + rand(-120,120), 70, WORLD.height-70), 52+rand(-4,10), e.mega?6.0:5.2, e.mega?14:12, 0.85);
  } else if(e.biomeHazard === 'tornado'){
    spawnTornado(clamp(player.x + rand(-160,160), 70, WORLD.width-70), clamp(player.y + rand(-140,140), 70, WORLD.height-70), e.mega?62:54, e.mega?11:9);
  } else if(e.biomeHazard === 'roots'){
    for(let i=0;i<(e.mega?3:2);i++) spawnRootBloom(clamp(player.x + rand(-160,160), 70, WORLD.width-70), clamp(player.y + rand(-140,140), 70, WORLD.height-70), 68+rand(-4,10), 0.8);
  } else if(e.biomeHazard === 'anomaly'){
    spawnAnomaly(clamp(player.x + rand(-150,150), 70, WORLD.width-70), clamp(player.y + rand(-150,150), 70, WORLD.height-70), e.mega?88:74, 0.55);
  } else {
    for(let i=0;i<(e.mega?2:1);i++) spawnResonance(clamp(player.x + rand(-150,150), 70, WORLD.width-70), clamp(player.y + rand(-150,150), 70, WORLD.height-70), 66+rand(-4,10), 0.9);
  }
}
function updateEnemies(dt){
  let contactCount=0; let contactDamage=0;
  for (const e of [...state.enemies]) {
    e.chill = Math.max(0,(e.chill||0)-dt);
    const slowMul = 1 - Math.min(0.55, (e.chill||0)*0.28);
    const a = angleTo(e.x,e.y,player.x,player.y); const d = dist(e.x,e.y,player.x,player.y);
    let vx=0, vy=0;
    if (e.kind==='dash') {
      e.dashTimer -= dt; const mult = e.dashTimer<0.25 ? 2.3 : 1;
      vx = Math.cos(a)*e.speed*mult*slowMul; vy = Math.sin(a)*e.speed*mult*slowMul;
      if (e.dashTimer<=0) e.dashTimer = 1.5 + Math.random()*0.8;
    } else {
      let moveAngle = a;
      let moveSpeed = e.speed * slowMul;
      if (e.bossEvent){
        updateBossPattern(e, dt, a);
        if (e.bossPattern === 'charger' && e.chargeTime > 0){ moveAngle = e.chargeAngle ?? a; moveSpeed *= 3.0; }
      }
      vx = Math.cos(moveAngle)*moveSpeed; vy = Math.sin(moveAngle)*moveSpeed;
    }
    e.x += vx*dt; e.y += vy*dt; e.vx=vx; e.vy=vy;
    if (e.kind==='ranged' || e.kind==='boss' || e.kind==='eye') {
      e.shot -= dt;
      if (d < 580 && e.shot <= 0) {
        if(e.bossEvent && e.bossPattern === 'nova'){
          enemyShoot(e, '#ffb05b', 330, 15+state.wave*0.7);
          enemyShoot(e, '#ffb05b', 330, 15+state.wave*0.7, a+0.28);
          enemyShoot(e, '#ffb05b', 330, 15+state.wave*0.7, a-0.28);
        } else {
          enemyShoot(e, e.type==='eye'?'#c79cff':'#57e8a4', e.type==='eye'?360:320, e.type==='boss'?14:10+state.wave*0.6);
        }
        e.shot = (ENEMY_DEFS[e.type].shot||2.2) + Math.random()*0.6;
      }
    }
    if (e.kind==='summon' || (e.kind==='boss' && !e.bossEvent)) {
      e.summon -= dt;
      if (e.summon<=0) { for(let k=0;k<(e.type==='boss'?2:1);k++) spawnEnemy(Math.random()<0.5?'runner':'spitter'); e.summon = (ENEMY_DEFS[e.type].summon||4.5) + Math.random()*1.0; }
    }
    if (d < e.r + player.r + 4) {
      contactCount++;
      let bossMul = e.bossEvent ? 1.4 : (e.type==='boss'?1.25:1);
      if(e.bossEvent && e.bossPattern === 'charger' && e.chargeTime > 0) bossMul = 1.9;
      contactDamage = Math.max(contactDamage, e.touch*bossMul);
      if (player.thorns>0 && Math.random()<0.12) applyDamage(e, player.thorns, 'thorns');
    }
  }
  resolveCrowding();
  if (contactCount>0 && player.contactTimer<=0){
    const totalDamage = (contactDamage + Math.max(0, contactCount-1) * 1.75) * (1 - player.damageReduction);
    player.hp -= totalDamage;
    player.contactTimer = 0.34; player.contactBlink = 0.18;
    popup(`-${Math.round(totalDamage)}`, player.x, player.y-26, '#ff9a9a');
    ring(player.x,player.y,'rgba(255,116,137,.48)',54,0.28,3); emit(player.x,player.y,'#ff9a9a',9,135,3);
  }
}
function updateOrbs(dt){ for (let i=state.orbs.length-1;i>=0;i--) { const o=state.orbs[i]; o.life -= dt; const d=dist(o.x,o.y,player.x,player.y); if(d<player.pickupRadius){ const a=angleTo(o.x,o.y,player.x,player.y); o.x += Math.cos(a)*390*dt; o.y += Math.sin(a)*390*dt; } if(d < o.r + player.r){ state.genes += o.v; profile.dnaBank += o.v; saveProfile(); refreshMetaUI(); popup(`+${o.v}🧬`, o.x, o.y, '#9ef7bf'); state.orbs.splice(i,1); continue; } if(o.life<=0) state.orbs.splice(i,1); } }
function updateParticles(dt){
  for(let i=state.particles.length-1;i>=0;i--){
    const p=state.particles[i];
    if(!p.ring){ p.x += p.vx*dt; p.y += p.vy*dt; p.vx*=0.982; p.vy*=0.982; }
    else { p.r += 110*dt; }
    p.life -= dt;
    if(p.life<=0) state.particles.splice(i,1);
  }
  for(let i=state.texts.length-1;i>=0;i--){
    const t=state.texts[i]; t.life -= dt; if(!t.beam) t.y -= 26*dt; if(t.life<=0) state.texts.splice(i,1);
  }
  for(let i=state.corpses.length-1;i>=0;i--){ const c=state.corpses[i]; c.life -= dt; if(c.life<=0) state.corpses.splice(i,1); }
}
function updateCamera(){ state.camera.x = clamp(player.x - canvas.width/2, 0, WORLD.width-canvas.width); state.camera.y = clamp(player.y - canvas.height/2, 0, WORLD.height-canvas.height); }
function worldToScreen(x,y){ return {x:x-state.camera.x, y:y-state.camera.y}; }
function drawSpriteImage(name, x, y, size, opts={}){
  const img = SPRITES[name];
  if (!img) return false;
  const rot = opts.rot || 0;
  const alpha = opts.alpha === undefined ? 1 : opts.alpha;
  const sx = opts.sx === undefined ? 1 : opts.sx;
  const sy = opts.sy === undefined ? 1 : opts.sy;
  const glow = opts.glow || 0;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rot);
  ctx.scale(sx,sy);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = opts.shadowColor || 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = opts.shadow === false ? 0 : 10 + glow;
  ctx.drawImage(img, -size/2, -size/2, size, size);
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  return true;
}
function drawStepDust(x,y,phase,color='rgba(160,235,255,.22)'){
  ctx.fillStyle = color;
  for(let i=0;i<3;i++){
    const a = phase + i*2.1;
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(a)*18, y + 22 + Math.cos(a)*5, 7 + Math.sin(a)*2, 3, 0, 0, Math.PI*2);
    ctx.fill();
  }
}
function drawSpeedStreaks(x,y,vx,vy,phase,color='rgba(130,225,255,.32)'){
  const sp = Math.hypot(vx||0,vy||0);
  if (sp < 60) return;
  const a = Math.atan2(vy, vx);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for(let i=0;i<3;i++){
    const off = (i-1)*12 + Math.sin(phase+i)*4;
    const bx = x - Math.cos(a)*(34+i*10) - Math.sin(a)*off;
    const by = y - Math.sin(a)*(34+i*10) + Math.cos(a)*off;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - Math.cos(a)*(16+i*4), by - Math.sin(a)*(16+i*4));
    ctx.stroke();
  }
  ctx.restore();
}
function drawAnimatedAppendages(type,x,y,r,phase,vx=0,vy=0){
  ctx.save();
  ctx.lineCap='round';
  if(type==='runner'){
    ctx.strokeStyle='rgba(106,235,255,.52)'; ctx.lineWidth=4;
    for(let i=0;i<4;i++){
      const side = i<2?-1:1;
      const k = i%2;
      const swing = Math.sin(phase + k*Math.PI) * 10;
      ctx.beginPath();
      ctx.moveTo(x+side*14, y+2+k*10);
      ctx.quadraticCurveTo(x+side*(24+swing*.3), y+10+k*7, x+side*(34+swing), y+18+k*4);
      ctx.stroke();
    }
    drawSpeedStreaks(x,y,vx,vy,phase,'rgba(95,212,255,.35)');
  } else if(type==='skitter'){
    ctx.strokeStyle='rgba(204,166,255,.62)'; ctx.lineWidth=4;
    for(let i=0;i<6;i++){
      const side=i<3?-1:1;
      const k=i%3;
      const swing=Math.sin(phase*1.35+i)*12;
      ctx.beginPath();
      ctx.moveTo(x+side*12,y-8+k*10);
      ctx.lineTo(x+side*(28+swing*.35), y-18+k*16);
      ctx.lineTo(x+side*(42+swing), y-12+k*16);
      ctx.stroke();
    }
  } else if(type==='brute' || type==='boss'){
    ctx.fillStyle= type==='boss' ? 'rgba(255,225,110,.30)' : 'rgba(180,245,110,.30)';
    for(let i=0;i<4;i++){
      const side=i<2?-1:1;
      const k=i%2;
      const step=Math.sin(phase+i)*4;
      ctx.beginPath();
      ctx.ellipse(x+side*(r*.65), y+10+k*18+step, r*.28, r*.16, 0, 0, Math.PI*2);
      ctx.fill();
    }
  } else if(type==='spitter'){
    ctx.fillStyle='rgba(191,255,109,.28)';
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.arc(x+26+i*9, y+Math.sin(phase+i)*6, 4+i, 0, Math.PI*2);
      ctx.fill();
    }
  } else if(type==='blob'){
    ctx.fillStyle='rgba(165,245,255,.35)';
    for(let i=0;i<4;i++){
      ctx.beginPath();
      ctx.arc(x + Math.sin(phase+i)*18, y + Math.cos(phase*1.2+i)*10, 4+i*.7, 0, Math.PI*2);
      ctx.fill();
    }
  } else if(type==='leech'){
    ctx.strokeStyle='rgba(120,245,220,.45)'; ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(x-26,y+8);
    for(let i=0;i<4;i++) ctx.quadraticCurveTo(x-10+i*12,y+16+Math.sin(phase+i)*7,x+i*12,y+10+Math.cos(phase+i)*5);
    ctx.stroke();
  } else if(type==='eye'){
    ctx.strokeStyle='rgba(218,160,255,.55)'; ctx.lineWidth=3;
    for(let i=0;i<6;i++){
      const a=phase*.7+i*Math.PI*2/6;
      ctx.beginPath();
      ctx.moveTo(x+Math.cos(a)*18,y+Math.sin(a)*18);
      ctx.lineTo(x+Math.cos(a)*(r+22),y+Math.sin(a)*(r+22));
      ctx.stroke();
      ctx.fillStyle='rgba(230,175,255,.75)';
      ctx.beginPath(); ctx.arc(x+Math.cos(a)*(r+25),y+Math.sin(a)*(r+25),4,0,Math.PI*2); ctx.fill();
    }
  } else if(type==='brood'){
    ctx.fillStyle='rgba(225,255,120,.42)';
    for(let i=0;i<4;i++){
      const a=i*Math.PI*2/4+phase*.3;
      ctx.beginPath();
      ctx.ellipse(x+Math.cos(a)*28,y+Math.sin(a)*16+12,8,6,0,0,Math.PI*2);
      ctx.fill();
    }
  }
  ctx.restore();
}
function mutationIsUnlocked(m){ const biomeOk = (state.biomeIndex || 0) >= (m.biomeMin || 0); return biomeOk && (!m.recipe || player.unlockedFusions.includes(m.id)); }
function mutationCanAppear(m){ return mutationIsUnlocked(m) && (player.mutationLevels[m.id]||0) < m.max; }
function rarityInfo(m){ return RARITY_DATA[m.rarity || 'common'] || RARITY_DATA.common; }
function weightedTake(pool){
  const weights = pool.map(m => {
    const lvl=player.mutationLevels[m.id]||0;
    let w = rarityInfo(m).weight;
    if (lvl > 0) w *= 1.22 + lvl*0.10;
    if (lvl === 0 && m.type==='Оружие') w *= 1.35;
    if (lvl === 0 && NEW_ARSENAL_IDS.includes(m.id)) w *= 1.75;
    if (m.recipe) w *= 1.16;
    return w;
  });
  const sum = weights.reduce((a,b)=>a+b,0);
  let r = Math.random()*sum;
  for(let i=0;i<pool.length;i++){ r -= weights[i]; if(r<=0) return pool.splice(i,1)[0]; }
  return pool.pop();
}
const NEW_ARSENAL_IDS = ['needle','boomer','prism','chain','mine','geyser','frost','seeker','rail','ember','spiral','saw','mirror','venom','storm','predatorrush','cocoon'];
function pickChoices(){
  const pool = MUTATIONS.filter(mutationCanAppear);
  const chosen = [];
  const availableWeapons = pool.filter(m => m.type === 'Оружие' && !chosen.includes(m));
  const newArsenal = availableWeapons.filter(m => NEW_ARSENAL_IDS.includes(m.id));
  const shouldForceWeapon = state.level <= 20 || Math.random() < 0.58;
  if (shouldForceWeapon && newArsenal.length){
    const forced = weightedTake(newArsenal);
    chosen.push(forced);
    const idx = pool.findIndex(m=>m.id===forced.id); if(idx>=0) pool.splice(idx,1);
  }
  while(chosen.length < 3 && pool.length){ chosen.push(weightedTake(pool)); }
  return chosen;
}
function openLevelUp(){ freezeGame = true; const options = pickChoices(); ui.levelText.textContent = `Уровень ${state.level}. Организм готов принять новую форму.`; ui.cards.innerHTML=''; for(const m of options){ ui.cards.appendChild(makeCard(m)); } ui.level.classList.remove('hidden'); }
function cardTypeText(m){ return m.recipe ? `${m.type} · слияние` : m.type; }
function makeCard(m){
  const lvl = player.mutationLevels[m.id]||0; const next = lvl+1; const rarity = rarityInfo(m);
  const card=document.createElement('div'); card.className=`card rarity-${rarity.key}`;
  const top=document.createElement('div'); top.className='cardTop';
  const img=document.createElement('img'); img.src = ICONS[m.icon].src;
  const meta=document.createElement('div');
  meta.innerHTML = `<div class="tag">${cardTypeText(m)}</div><h3>${m.name}</h3><div class="rank">Ранг ${next} / ${m.max}</div><div class="rarityBadge">${rarity.title}</div>`;
  top.append(img, meta);
  const desc=document.createElement('div'); desc.className='desc'; desc.textContent = m.desc;
  const stats=document.createElement('div'); stats.className='stats'; stats.textContent = m.statText(lvl);
  const note=document.createElement('div'); note.className='note'; note.textContent = '';
  const btn=document.createElement('button'); btn.className='primary'; btn.textContent = 'Выбрать'; btn.onclick = () => applyMutation(m.id);
  card.append(top, desc, stats, note, btn); return card;
}
function getAvailableFusionRecipes(){
  return MUTATIONS
    .filter(m => m.recipe && !player.unlockedFusions.includes(m.id) && m.recipe.every(id => (player.mutationLevels[id]||0) > 0))
    .map(m => ({ mutation:m, pair:m.recipe, explicit:true }));
}
function getAdaptiveFusionOptions(){
  const taken = player.mutationOrder.filter(id => (player.mutationLevels[id]||0) > 0 && !MUTATIONS.find(m=>m.id===id)?.recipe);
  const locked = MUTATIONS.filter(m => m.recipe && !player.unlockedFusions.includes(m.id));
  const options = [];
  if(taken.length < 2 || !locked.length) return options;
  const shuffledTaken = [...taken].sort(()=>Math.random()-0.5);
  const shuffledLocked = [...locked].sort(()=>Math.random()-0.5);
  for(const m of shuffledLocked){
    let a = shuffledTaken[options.length % shuffledTaken.length];
    let b = shuffledTaken[(options.length + 1) % shuffledTaken.length];
    if(a === b) b = shuffledTaken.find(x=>x!==a) || b;
    options.push({ mutation:m, pair:[a,b], explicit:false });
    if(options.length >= 3) break;
  }
  return options;
}
function sampleFusionOptions(){
  const explicit = getAvailableFusionRecipes();
  const pool = explicit.length ? explicit : getAdaptiveFusionOptions();
  const out = [];
  while(out.length < 3 && pool.length) out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  return out;
}
function makeFusionCard(option){
  const m = option.mutation || option;
  const pair = option.pair || m.recipe;
  const card=document.createElement('div'); card.className=`card rarity-${rarityInfo(m).key}`;
  const top=document.createElement('div'); top.className='cardTop';
  const img=document.createElement('img'); img.src = ICONS[m.icon].src;
  const meta=document.createElement('div');
  meta.innerHTML = `<div class="tag">Синтез</div><h3>${m.name}</h3><div class="rank">Откроет новую редкую мутацию</div><div class="rarityBadge">${rarityInfo(m).title}</div>`;
  const ingA = MUTATIONS.find(x=>x.id===pair[0]);
  const ingB = MUTATIONS.find(x=>x.id===pair[1]);
  const desc=document.createElement('div'); desc.className='desc'; desc.textContent = m.desc;
  const recipe=document.createElement('div'); recipe.className='recipeLine';
  recipe.textContent = option.explicit ? `Рецепт: ${ingA.name} + ${ingB.name}` : `Адаптивное слияние: ${ingA.name} + ${ingB.name}`;
  const note=document.createElement('div'); note.className='note';
  note.textContent = '';
  const btn=document.createElement('button'); btn.className='primary'; btn.textContent = 'Слить'; btn.onclick = ()=>unlockFusion(m.id, pair);
  top.append(img, meta); card.append(top, desc, recipe, note, btn); return card;
}
function openFusionForge(){
  const options = sampleFusionOptions();
  if(!options.length){ state.pendingFusion = false; toast('Все доступные слияния уже открыты.'); return; }
  freezeGame = true; state.pendingFusion = false;
  ui.fusionCards.innerHTML = '';
  ui.fusionText.textContent = 'Босс повержен. Ядро улья готово сплести новую форму.';
  for(const option of options) ui.fusionCards.appendChild(makeFusionCard(option));
  ui.fusion.classList.remove('hidden');
}
function unlockFusion(id, pair=null){
  const m = MUTATIONS.find(x=>x.id===id); if(!m) return;
  if(!player.unlockedFusions.includes(id)) player.unlockedFusions.push(id);
  ui.fusion.classList.add('hidden'); freezeGame = false;
  const pairText = pair ? ` (${MUTATIONS.find(x=>x.id===pair[0]).name} + ${MUTATIONS.find(x=>x.id===pair[1]).name})` : '';
  emit(player.x,player.y,'#ffd576',22,220,4); popup(`Синтез: ${m.name}`, player.x, player.y-48, '#ffd576'); toast(`${m.name}${pairText} разблокирована`);
}
function maybeOpenPendingFusion(){ if(state.pendingFusion && !freezeGame && gameStarted) openFusionForge(); }
function applyMutation(id){ const m = MUTATIONS.find(x=>x.id===id); if(!m) return; const lvl=player.mutationLevels[id]||0; if(lvl>=m.max) return; player.mutationLevels[id] = lvl+1; if(!player.mutationOrder.includes(id)) player.mutationOrder.push(id); m.apply(lvl); ui.level.classList.add('hidden'); freezeGame = false; emit(player.x,player.y,'#95f2ff',18,220,3); popup(`${m.name}`, player.x, player.y-48, '#95f2ff'); toast(`${m.name} — ранг ${lvl+1}`); hudUpdate(); maybeOpenPendingFusion(); }
function drawMap(){
  const bg = BACKGROUNDS[state.currentBiome % BACKGROUNDS.length];
  if (bg && bg.complete && bg.naturalWidth) {
    // ВАЖНО: фон больше не рисуется параллаксом и не накладывается вторым слоем.
    // Он растянут как единая большая карта мира и просто кропается камерой.
    // Так уходит неприятное "двоение" и старая сетка.
    const scale = Math.max(WORLD.width / bg.naturalWidth, WORLD.height / bg.naturalHeight);
    const drawW = bg.naturalWidth * scale;
    const drawH = bg.naturalHeight * scale;
    const ox = (WORLD.width - drawW) / 2;
    const oy = (WORLD.height - drawH) / 2;
    ctx.drawImage(bg, ox - state.camera.x, oy - state.camera.y, drawW, drawH);
  } else {
    const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    g.addColorStop(0,'#0a1533'); g.addColorStop(1,'#060a16');
    ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // Единый мягкий фильтр для читабельности боя, без сетки и без повторных изображений.
  const veil = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height*0.1, canvas.width/2, canvas.height/2, canvas.width*0.72);
  veil.addColorStop(0,'rgba(13,24,60,.10)');
  veil.addColorStop(0.58,'rgba(5,10,25,.24)');
  veil.addColorStop(1,'rgba(2,5,14,.54)');
  ctx.fillStyle = veil;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Небольшие живые частицы фона вместо плиточной сетки.
  ctx.save();
  ctx.globalAlpha = 0.28;
  for(let i=0;i<42;i++){
    const seed = i*19.37;
    const x = (hash2(seed, state.currentBiome+2)*WORLD.width - state.camera.x*0.35 + Math.sin(state.t*0.18+seed)*18) % canvas.width;
    const y = (hash2(seed+7, state.currentBiome+5)*WORLD.height - state.camera.y*0.35 + Math.cos(state.t*0.16+seed)*16) % canvas.height;
    const px = x < 0 ? x + canvas.width : x;
    const py = y < 0 ? y + canvas.height : y;
    const r = 1.4 + hash2(seed+3, seed+8)*2.6;
    ctx.fillStyle = hash2(seed, seed+1) > 0.5 ? 'rgba(112,232,255,.32)' : 'rgba(199,112,255,.26)';
    ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
function drawBlobEntity(x,y,r,color,points=6,time=0){ const p=worldToScreen(x,y); ctx.save(); ctx.translate(p.x,p.y); ctx.fillStyle=color; ctx.beginPath(); for(let i=0;i<points;i++){ const a=i*Math.PI*2/points; const rr=r + Math.sin(time+i*1.4)*(r*0.12); const px=Math.cos(a)*rr, py=Math.sin(a)*rr; if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=4; ctx.stroke(); ctx.restore(); }


function drawCreatureLeg(baseX,baseY,kneeX,kneeY,footX,footY,width,colors={}){
  const shell = colors.shell || 'rgba(38,56,95,.95)';
  const fill = colors.fill || 'rgba(190,245,255,.92)';
  const glow = colors.glow || 'rgba(120,240,255,.20)';
  const claw = colors.claw || '#ffffff';
  ctx.save();
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.strokeStyle = glow; ctx.lineWidth = width + 5;
  ctx.beginPath(); ctx.moveTo(baseX,baseY); ctx.lineTo(kneeX,kneeY); ctx.lineTo(footX,footY); ctx.stroke();
  ctx.strokeStyle = shell; ctx.lineWidth = width + 1.8;
  ctx.beginPath(); ctx.moveTo(baseX,baseY); ctx.lineTo(kneeX,kneeY); ctx.lineTo(footX,footY); ctx.stroke();
  ctx.strokeStyle = fill; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(baseX,baseY); ctx.lineTo(kneeX,kneeY); ctx.lineTo(footX,footY); ctx.stroke();
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(baseX,baseY,Math.max(2.2,width*0.45),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(kneeX,kneeY,Math.max(2.0,width*0.40),0,Math.PI*2); ctx.fill();
  const ang = Math.atan2(footY-kneeY, footX-kneeX);
  const spread = 0.48;
  const toeLen = width*1.45;
  ctx.strokeStyle = shell; ctx.lineWidth = Math.max(2,width*0.46);
  for(const s of [-1,1]){
    ctx.beginPath();
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX + Math.cos(ang + spread*s)*toeLen, footY + Math.sin(ang + spread*s)*toeLen);
    ctx.stroke();
  }
  ctx.strokeStyle = claw; ctx.lineWidth = Math.max(1.2,width*0.22);
  for(const s of [-1,1]){
    ctx.beginPath();
    ctx.moveTo(footX + Math.cos(ang + spread*s)*(toeLen*0.45), footY + Math.sin(ang + spread*s)*(toeLen*0.45));
    ctx.lineTo(footX + Math.cos(ang + spread*s)*(toeLen*0.95), footY + Math.sin(ang + spread*s)*(toeLen*0.95));
    ctx.stroke();
  }
  ctx.restore();
}
function drawWalkingLegs(type,x,y,r,phase,speed,vx=0,vy=0,layer='all'){
  const dir = vx >= 0 ? 1 : -1;
  const moveAmp = Math.max(0.45, Math.min(1.4, speed/135));
  const sets = [];
  let palette = {shell:'rgba(45,61,96,.92)', fill:'rgba(214,247,255,.95)', glow:'rgba(105,235,255,.22)', claw:'#ffffff'};
  const pushLeg = (side,row,baseX,baseY,kneeX,kneeY,footX,footY,width,front=false)=>sets.push({side,row,baseX,baseY,kneeX,kneeY,footX,footY,width,front});

  if(type==='runner'){
    palette = {shell:'rgba(37,76,126,.96)', fill:'rgba(167,241,255,.96)', glow:'rgba(77,222,255,.22)', claw:'#ffffff'};
    for(let side of [-1,1]) for(let row=0; row<3; row++){
      const p = phase*1.25 + row*0.95 + (side>0 ? Math.PI : 0);
      const lift = Math.max(0, Math.sin(p));
      const swing = Math.cos(p) * (8 + moveAmp*7) * dir;
      const baseX = x + side*(r*0.36);
      const baseY = y - 6 + row*12;
      const kneeX = x + side*(r*0.62) + swing*0.26;
      const kneeY = baseY + 4 - lift*3;
      const footX = x + side*(r*0.98) + swing;
      const footY = baseY + 12 - lift*11;
      pushLeg(side,row,baseX,baseY,kneeX,kneeY,footX,footY,4.6,row>0);
    }
  } else if(type==='skitter'){
    palette = {shell:'rgba(88,72,158,.98)', fill:'rgba(236,224,255,.96)', glow:'rgba(173,144,255,.22)', claw:'#ffffff'};
    for(let side of [-1,1]) for(let row=0; row<3; row++){
      const p = phase*1.45 + row*0.85 + (side>0 ? Math.PI*0.85 : 0);
      const lift = Math.max(0, Math.sin(p));
      const spread = 10 + row*4 + moveAmp*4;
      const baseX = x + side*(r*0.30);
      const baseY = y - 12 + row*12;
      const kneeX = x + side*(r*0.66) + Math.cos(p)*5;
      const kneeY = baseY + 4 - lift*3.5;
      const footX = x + side*(r + spread);
      const footY = baseY + 9 - lift*12;
      pushLeg(side,row,baseX,baseY,kneeX,kneeY,footX,footY,4.1,row>0);
    }
  } else if(type==='spitter' || type==='leech' || type==='blob'){
    if(type==='spitter') palette = {shell:'rgba(77,118,60,.95)', fill:'rgba(223,255,186,.95)', glow:'rgba(181,245,103,.18)', claw:'#ffffff'};
    if(type==='leech') palette = {shell:'rgba(36,109,93,.95)', fill:'rgba(200,255,242,.95)', glow:'rgba(120,238,204,.20)', claw:'#ffffff'};
    if(type==='blob') palette = {shell:'rgba(55,120,160,.95)', fill:'rgba(223,251,255,.95)', glow:'rgba(128,220,255,.20)', claw:'#ffffff'};
    for(let side of [-1,1]) for(let row=0; row<2; row++){
      const p = phase*1.1 + row*Math.PI + (side>0 ? Math.PI*0.9 : 0);
      const lift = Math.max(0, Math.sin(p));
      const swing = Math.cos(p) * (6 + moveAmp*5) * dir;
      const baseX = x + side*(r*0.38);
      const baseY = y - 2 + row*16;
      const kneeX = x + side*(r*0.64) + swing*0.25;
      const kneeY = baseY + 5 - lift*3;
      const footX = x + side*(r*0.92) + swing;
      const footY = baseY + 13 - lift*9;
      pushLeg(side,row,baseX,baseY,kneeX,kneeY,footX,footY,4.2,row>0);
    }
  } else if(type==='brute' || type==='brood' || type==='boss'){
    palette = type==='boss'
      ? {shell:'rgba(113,91,23,.98)', fill:'rgba(255,245,187,.96)', glow:'rgba(255,220,98,.18)', claw:'#fffef5'}
      : type==='brood'
      ? {shell:'rgba(108,73,162,.98)', fill:'rgba(247,221,255,.96)', glow:'rgba(217,168,255,.18)', claw:'#ffffff'}
      : {shell:'rgba(84,110,22,.98)', fill:'rgba(238,255,188,.96)', glow:'rgba(194,232,99,.18)', claw:'#ffffff'};
    for(let side of [-1,1]) for(let row=0; row<2; row++){
      const p = phase*0.72 + row*Math.PI + (side>0 ? Math.PI*0.85 : 0);
      const lift = Math.max(0, Math.sin(p));
      const baseX = x + side*(r*0.42);
      const baseY = y + 2 + row*16;
      const kneeX = x + side*(r*0.58) + Math.cos(p)*2;
      const kneeY = baseY + 7 - lift*2;
      const footX = x + side*(r*0.78);
      const footY = baseY + 15 - lift*7;
      pushLeg(side,row,baseX,baseY,kneeX,kneeY,footX,footY,type==='boss'?6.2:5.2,row>0);
    }
  } else if(type==='eye'){
    palette = {shell:'rgba(104,54,160,.98)', fill:'rgba(246,226,255,.96)', glow:'rgba(218,164,255,.16)', claw:'#ffffff'};
    for(let side of [-1,1]) for(let row=0; row<2; row++){
      const p = phase*0.9 + row*Math.PI + (side>0 ? Math.PI : 0);
      const lift = Math.max(0, Math.sin(p));
      const baseX = x + side*(r*0.26);
      const baseY = y + row*14;
      const kneeX = x + side*(r*0.60) + Math.cos(p)*4;
      const kneeY = baseY + 6 - lift*2;
      const footX = x + side*(r*0.86) + Math.cos(p)*4;
      const footY = baseY + 14 - lift*7;
      pushLeg(side,row,baseX,baseY,kneeX,kneeY,footX,footY,3.6,row>0);
    }
  }
  const filtered = sets.filter(s => layer==='all' ? true : layer==='back' ? !s.front : s.front);
  for(const s of filtered){
    drawCreatureLeg(s.baseX,s.baseY,s.kneeX,s.kneeY,s.footX,s.footY,s.width,palette);
  }
}
function drawPlayerFeet(x,y,phase,speed,vx=0,vy=0,layer='all'){
  const dir = vx >= 0 ? 1 : -1;
  const amp = Math.max(0.55, Math.min(1.3, speed/155));
  const legs = [];
  const push = (row,side,front,baseX,baseY,kneeX,kneeY,footX,footY,width)=>legs.push({row,side,front,baseX,baseY,kneeX,kneeY,footX,footY,width});
  for(let side of [-1,1]) for(let row=0; row<2; row++){
    const p = phase*1.2 + row*Math.PI + (side>0 ? Math.PI*0.9 : 0);
    const lift = Math.max(0, Math.sin(p));
    const swing = Math.cos(p)*(8 + amp*5)*dir;
    const baseX = x + side*18;
    const baseY = y + 2 + row*16;
    const kneeX = x + side*30 + swing*0.22;
    const kneeY = baseY + 6 - lift*2;
    const footX = x + side*42 + swing;
    const footY = baseY + 15 - lift*10;
    push(row,side,row>0,baseX,baseY,kneeX,kneeY,footX,footY,5.1);
  }
  const filtered = legs.filter(l => layer==='all' ? true : layer==='back' ? !l.front : l.front);
  for(const l of filtered){
    drawCreatureLeg(l.baseX,l.baseY,l.kneeX,l.kneeY,l.footX,l.footY,l.width,{shell:'rgba(26,89,106,.98)', fill:'rgba(195,255,240,.97)', glow:'rgba(111,255,232,.22)', claw:'#ffffff'});
  }
}
function drawEnemy(e){
  const p = worldToScreen(e.x,e.y); const speed = Math.hypot(e.vx||0,e.vy||0); const phase = state.t * (5.3 + Math.min(speed,320)/80) + e.seed;
  const step = Math.abs(Math.sin(phase)); const bob = Math.sin(phase) * (speed>20 ? 3.0 : 1.4); const lean = clamp((e.vx||0) / 520, -0.16, 0.16) + Math.sin(phase)*0.018;
  const sx = 1 + (speed>20 ? 0.04*step : 0.015*Math.sin(phase)); const sy = 1 - (speed>20 ? 0.032*step : 0.010*Math.sin(phase));
  const shadowW = e.bossEvent ? e.r*1.6 : e.type==='boss' ? e.r*1.45 : e.r*1.10; let spriteSize = e.bossEvent ? 188 : e.type==='boss' ? 134 : e.type==='brood' ? 118 : e.type==='brute' ? 104 : e.type==='blob' ? 96 : e.type==='runner' ? 92 : 88; if (e.bossEvent && (e.spriteKey==='boss_voidmanta')) spriteSize = 204; if (e.bossEvent && (e.spriteKey==='boss_hivematron' || e.spriteKey==='boss_bloomhydra')) spriteSize = 198;
  ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(p.x,p.y+e.r+9,shadowW*(1+step*.06),10*(1-step*.08),0,0,Math.PI*2); ctx.fill();
  drawStepDust(p.x,p.y+e.r,phase,'rgba(155,235,255,.14)'); if (speed > 90) drawSpeedStreaks(p.x,p.y,e.vx||0,e.vy||0,phase,e.type==='skitter'?'rgba(220,160,255,.18)':'rgba(110,225,255,.16)');
  if (e.bossEvent){ ctx.strokeStyle='rgba(255,226,126,.20)'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(p.x,p.y+6,e.r*1.08 + Math.sin(phase)*2.6,0,Math.PI*2); ctx.stroke(); }
  const spriteName = e.bossEvent ? (e.spriteKey || 'boss') : e.type;
  drawSpriteImage(spriteName, p.x, p.y + bob, spriteSize, {rot:lean, sx:sx, sy:sy, glow:e.bossEvent?8:(e.type==='boss'?4:0)});
  if (speed > 110 && (e.type==='runner' || e.type==='skitter')) drawSpriteImage(e.type, p.x-(e.vx||0)*0.045, p.y-(e.vy||0)*0.045+bob, spriteSize, {rot:lean, sx:sx, sy:sy, alpha:0.10, shadow:false});
  if (!e.bossEvent){ ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(p.x-24,p.y-e.r-26,48,6); ctx.fillStyle='#7dff99'; ctx.fillRect(p.x-24,p.y-e.r-26,48*(e.hp/e.maxHp),6); }
}
function drawEyes(x,y,s,dark){
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.ellipse(x-9,y-3,7+s*8,10+s*9,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+9,y-3,7+s*8,10+s*9,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=dark;
  ctx.beginPath(); ctx.arc(x-8,y,4+s*4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+10,y,4+s*4,0,Math.PI*2); ctx.fill();
}
function drawShell(x,y,r){
  ctx.strokeStyle='rgba(255,255,255,.26)'; ctx.lineWidth=4;
  ctx.beginPath(); ctx.arc(x,y,r,0.6,2.6); ctx.stroke();
  ctx.beginPath(); ctx.arc(x,y+4,r*0.72,0.7,2.5); ctx.stroke();
}
function roundRect(ctx,x,y,w,h,r,fill,stroke){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); if(fill)ctx.fill(); if(stroke)ctx.stroke(); }
function creatureGradient(x,y,rx,ry,c1,c2){ const g=ctx.createRadialGradient(x-rx*0.3,y-ry*0.45,6,x,y,Math.max(rx,ry)*1.2); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; }
function drawLimbSet(x,y,count,len,width,color,phase=0,dir=1){
  ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round';
  for(let i=0;i<count;i++){
    const t = count===1 ? 0.5 : i/(count-1);
    const side = t < 0.5 ? -1 : 1;
    const local = (t-0.5)*2;
    const sx = x + side*10;
    const sy = y + local*18;
    const bend = side * (len*0.42 + Math.sin(state.t*6 + phase + i)*5);
    const ey = sy + local*9;
    ctx.beginPath();
    ctx.moveTo(sx,sy);
    ctx.quadraticCurveTo(x + bend*0.45, sy+8, x + side*len, ey);
    ctx.stroke();
  }
}
function drawCuteMouth(x,y,w,color='#60406b'){ ctx.strokeStyle=color; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,w,0.15,Math.PI-0.15); ctx.stroke(); }
function drawCrest(x,y,r,count,color){ ctx.fillStyle=color; for(let i=0;i<count;i++){ const a = -1.1 + (i/(count-1||1))*2.2; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*(r*0.2), y-r*0.25+Math.sin(a)*(r*0.1)); ctx.lineTo(x+Math.cos(a)*(r*0.9), y-r*1.1); ctx.lineTo(x+Math.cos(a+0.08)*(r*0.58), y-r*0.12); ctx.closePath(); ctx.fill(); } }
function drawCheeks(x,y,dx,dy,r,color){ ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x-dx,y+dy,r,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+dx,y+dy,r,0,Math.PI*2); ctx.fill(); }
function drawEyeBand(x,y,w,h,color){ ctx.fillStyle=color; roundRect(ctx,x-w/2,y-h/2,w,h,h/2,true,false); }
function drawShinySpot(x,y,r){ ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x-r*0.25,y-r*0.35,r*0.22,0,Math.PI*2); ctx.fill(); }

function drawPlayer(){
  const p=worldToScreen(player.x,player.y); const speed = Math.hypot(player.vx||0, player.vy||0); const phase = state.t * (speed>10 ? 8 : 4); const step = Math.abs(Math.sin(phase));
  const bob = Math.sin(phase) * (speed>10 ? 3.2 : 1.3); const lean = clamp((player.vx||0)/620, -0.16, 0.16); const sx = 1 + (speed>10 ? 0.032*step : 0.012*Math.sin(phase)); const sy = 1 - (speed>10 ? 0.028*step : 0.012*Math.sin(phase));
  ctx.fillStyle='rgba(0,0,0,.26)'; ctx.beginPath(); ctx.ellipse(p.x,p.y+40,50*(1+step*.04),18*(1-step*.04),0,0,Math.PI*2); ctx.fill();
  if (speed>30) drawSpeedStreaks(p.x,p.y,player.vx,player.vy,phase,'rgba(130,245,255,.22)'); drawStepDust(p.x,p.y+34,phase,'rgba(140,245,255,.16)');
  const aura = ctx.createRadialGradient(p.x,p.y,10,p.x,p.y,72); aura.addColorStop(0,'rgba(126,251,239,.08)'); aura.addColorStop(1,'rgba(126,251,239,0)'); ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(p.x,p.y,72,0,Math.PI*2); ctx.fill(); if(player.predatorRush>0){ const pr = 78 + Math.sin(state.t*18)*6; ctx.strokeStyle='rgba(255,120,176,.42)'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(p.x,p.y,pr,0,Math.PI*2); ctx.stroke(); } if((player.mutationLevels.cocoon||0)>0){ const cRad = 56 + Math.sin(state.t*4)*4; ctx.strokeStyle='rgba(155,220,255,.28)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(p.x,p.y+2,cRad,cRad*0.74,0,0,Math.PI*2); ctx.stroke(); }
  drawSpriteImage('player', p.x, p.y + bob, 122, {rot:lean, sx:sx, sy:sy, glow:3, alpha: player.contactBlink>0 ? (0.74 + Math.sin(state.t*45)*0.22) : 1});
  if ((player.mutationLevels.spines||0)>0) { ctx.fillStyle='rgba(210,240,255,.9)'; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(p.x+i*12,p.y-42); ctx.lineTo(p.x-4+i*12,p.y-60); ctx.lineTo(p.x+4+i*12,p.y-60); ctx.closePath(); ctx.fill(); } }
  if (player.weapons.orbit>0) { const count=2+Math.floor(player.weapons.orbit/2); const radius=64+player.weapons.orbit*6; for(let i=0;i<count;i++){ const a=player.orbitAngle+i*Math.PI*2/count; const ox=p.x+Math.cos(a)*radius, oy=p.y+Math.sin(a)*radius; drawSpriteImage('drone', ox, oy + Math.sin(phase+i)*2, 36, {rot:a + Math.PI/2, sx:1+Math.sin(phase+i)*0.05, sy:1-Math.sin(phase+i)*0.05, glow:3}); } }
  for (const m of state.minions){ const s=worldToScreen(m.x,m.y); const ma = Math.atan2(m.vy||0, m.vx||1); drawSpriteImage('minion', s.x, s.y + Math.sin(state.t*8+m.orbit)*2, 36, {rot:ma*0.18 + Math.sin(state.t*9+m.orbit)*0.12, sx:1.05, sy:0.95}); }
  ctx.fillStyle='rgba(0,0,0,.34)'; ctx.fillRect(p.x-34,p.y-70,68,8); ctx.fillStyle='#ff6f91'; ctx.fillRect(p.x-34,p.y-70,68*(player.hp/player.maxHp),8);
}

function drawProjectiles(){
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  for(const p of state.projectiles){
    const s=worldToScreen(p.x,p.y);
    if(p.cloud||p.void){
      const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,p.r);
      g.addColorStop(0,p.color);
      g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(s.x,s.y,p.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.stroke();
      continue;
    }
    if(p.kind==='mine'){
      const pulse = 1 + Math.sin(state.t*10)*0.08; ctx.fillStyle='#7cff7f'; ctx.globalAlpha=0.16; ctx.beginPath(); ctx.arc(s.x,s.y,(p.splash||50)*0.55*pulse,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; ctx.fillStyle='#ff7adc'; ctx.beginPath(); ctx.arc(s.x,s.y,p.r*pulse,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=2; ctx.stroke(); continue;
    }
    if(p.kind==='geyser'){
      if(!p.once){ ctx.strokeStyle='rgba(176,255,170,.55)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(s.x,s.y,p.r,Math.max(10,p.r*0.38),0,0,Math.PI*2); ctx.stroke(); }
      else { const h = 42 + Math.sin(state.t*24)*6; const g=ctx.createLinearGradient(s.x,s.y-h,s.x,s.y+h); g.addColorStop(0,'rgba(156,255,202,0)'); g.addColorStop(.45,'rgba(156,255,202,.95)'); g.addColorStop(1,'rgba(233,255,186,0)'); ctx.strokeStyle=g; ctx.lineWidth=Math.max(10,p.r*0.48); ctx.beginPath(); ctx.moveTo(s.x,s.y+h*0.25); ctx.lineTo(s.x,s.y-h); ctx.stroke(); } continue;
    }
    const tailX = s.x - (p.vx||0)*0.03, tailY = s.y - (p.vy||0)*0.03;
    ctx.shadowColor=p.color; ctx.shadowBlur=14;
    if(p.kind==='needle' || p.kind==='venom'){
      const ang = Math.atan2(p.vy,p.vx); ctx.strokeStyle=p.kind==='venom'?'#7aff86':'#dffcff'; ctx.lineWidth=p.kind==='venom'?6:4; ctx.beginPath(); ctx.moveTo(s.x-Math.cos(ang)*14,s.y-Math.sin(ang)*14); ctx.lineTo(s.x+Math.cos(ang)*14,s.y+Math.sin(ang)*14); ctx.stroke(); if(p.kind==='venom'){ ctx.fillStyle='rgba(122,255,134,.8)'; ctx.beginPath(); ctx.arc(s.x-Math.cos(ang)*6,s.y-Math.sin(ang)*6,3,0,Math.PI*2); ctx.fill(); }
    } else if(p.kind==='boomer'){
      ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(p.rot||0); ctx.strokeStyle='#7dffe0'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(0,0,12,0.55,5.5); ctx.stroke(); ctx.restore();
    } else if(p.kind==='prism'){
      ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(p.rot||0); ctx.fillStyle='#9ef6ff'; ctx.beginPath(); ctx.moveTo(0,-p.r); ctx.lineTo(p.r*0.8,0); ctx.lineTo(0,p.r); ctx.lineTo(-p.r*0.8,0); ctx.closePath(); ctx.fill(); ctx.restore();
    } else if(p.kind==='frost'){
      ctx.strokeStyle='#b7f6ff'; ctx.lineWidth=2.5; for(let k=0;k<3;k++){ const a=(p.rot||0)+k*Math.PI/3; ctx.beginPath(); ctx.moveTo(s.x-Math.cos(a)*p.r,s.y-Math.sin(a)*p.r); ctx.lineTo(s.x+Math.cos(a)*p.r,s.y+Math.sin(a)*p.r); ctx.stroke(); }
    } else if(p.kind==='seeker'){
      ctx.fillStyle='#7cf5ff'; ctx.beginPath(); ctx.arc(s.x,s.y,p.r,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=2; ctx.stroke(); for(let t=0;t<3;t++){ ctx.strokeStyle='rgba(124,245,255,.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.quadraticCurveTo(s.x-10+t*8,s.y+8+t*2,s.x-6+t*6,s.y+16+t*3); ctx.stroke(); }
    } else if(p.kind==='ember'){
      ctx.strokeStyle='rgba(255,153,92,.35)'; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(tailX,tailY); ctx.lineTo(s.x,s.y); ctx.stroke(); ctx.fillStyle='#ffbd82'; ctx.beginPath(); ctx.arc(s.x,s.y,p.r,0,Math.PI*2); ctx.fill();
    } else if(p.kind==='spiral' || p.kind==='mirror'){
      ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(p.rot||0); ctx.fillStyle=p.kind==='mirror'?'#ffd4ff':'#ffa4ff'; ctx.beginPath(); ctx.moveTo(0,-p.r*1.35); ctx.quadraticCurveTo(p.r*0.85,-p.r*0.25,0,p.r*1.1); ctx.quadraticCurveTo(-p.r*0.85,-p.r*0.25,0,-p.r*1.35); ctx.fill(); ctx.restore();
    } else if(p.kind==='saw'){
      ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(p.rot||0); ctx.fillStyle='#b8ff4f'; for(let k=0;k<8;k++){ const a=k*Math.PI/4; ctx.beginPath(); ctx.moveTo(Math.cos(a)*6,Math.sin(a)*6); ctx.lineTo(Math.cos(a+0.2)*p.r,Math.sin(a+0.2)*p.r); ctx.lineTo(Math.cos(a-0.2)*p.r,Math.sin(a-0.2)*p.r); ctx.closePath(); ctx.fill(); } ctx.fillStyle='#ff7ce0'; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); ctx.restore();
    } else if(p.kind==='storm'){
      ctx.save(); ctx.translate(s.x,s.y); ctx.rotate((p.rot||0)+state.t*2); ctx.fillStyle='#e6ff7e'; ctx.beginPath(); ctx.moveTo(0,-p.r*1.5); ctx.lineTo(p.r*0.7,0); ctx.lineTo(0,p.r*1.2); ctx.lineTo(-p.r*0.7,0); ctx.closePath(); ctx.fill(); ctx.restore();
    } else {
      ctx.strokeStyle=p.color; ctx.globalAlpha=.34; ctx.lineWidth=Math.max(2,p.r*0.75); ctx.beginPath(); ctx.moveTo(tailX,tailY); ctx.lineTo(s.x,s.y); ctx.stroke();
      ctx.globalAlpha=1; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(s.x,s.y,p.r,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
  for(const p of state.enemyProjectiles){
    const s=worldToScreen(p.x,p.y);
    ctx.shadowColor=p.color; ctx.shadowBlur=12; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(s.x,s.y,p.r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
  }
  ctx.restore();
}
function drawOrbs(){ ctx.save(); ctx.globalCompositeOperation='lighter'; for(const o of state.orbs){ const p=worldToScreen(o.x,o.y); const pulse=0.85+Math.sin(state.t*5+o.x*.01)*0.15; const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,o.r*1.15); g.addColorStop(0,'rgba(170,255,160,.92)'); g.addColorStop(.45,'rgba(94,255,178,.38)'); g.addColorStop(1,'rgba(94,255,178,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,o.r*pulse,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.24)'; ctx.lineWidth=2; ctx.stroke(); } ctx.restore(); }
function drawParticles(){
  for(const c of state.corpses){
    const p=worldToScreen(c.x,c.y); ctx.globalAlpha=Math.max(0,c.life/2.6)*0.36; ctx.fillStyle=c.color; ctx.beginPath(); ctx.arc(p.x,p.y,c.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
  }
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const p of state.particles){
    const s=worldToScreen(p.x,p.y); const k=clamp(p.life/(p.maxLife||1),0,1);
    ctx.globalAlpha=k;
    if(p.ring){ ctx.strokeStyle=p.color; ctx.lineWidth=(p.width||3)*k; ctx.beginPath(); ctx.arc(s.x,s.y,p.r*(1-k*0.18),0,Math.PI*2); ctx.stroke(); }
    else { ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(s.x,s.y,p.size*(0.7+k*0.7),0,Math.PI*2); ctx.fill(); }
  }
  ctx.restore(); ctx.globalAlpha=1;
  for(const t of state.texts){
    if(t.beam){ const a=worldToScreen(t.x1,t.y1), b=worldToScreen(t.x2,t.y2); ctx.globalAlpha=clamp(t.life/0.15,0,1); ctx.strokeStyle=t.color; ctx.lineWidth=4; ctx.shadowColor=t.color; ctx.shadowBlur=14; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.shadowBlur=0; ctx.globalAlpha=1; continue; }
    const p=worldToScreen(t.x,t.y); ctx.globalAlpha=clamp(t.life,0,1); ctx.fillStyle=t.color; ctx.font='900 16px Trebuchet MS, Segoe UI, Arial'; ctx.textAlign='center'; ctx.shadowColor='rgba(0,0,0,.55)'; ctx.shadowBlur=8; ctx.fillText(t.text,p.x,p.y); ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
}
function drawMinimap(){ const w=186,h=186,pad=18,x=canvas.width-w-pad,y=canvas.height-h-pad; ctx.fillStyle='rgba(10,16,34,.76)'; roundRect(ctx,x,y,w,h,22,true,false); ctx.strokeStyle='rgba(153,206,255,.18)'; ctx.lineWidth=1.5; roundRect(ctx,x,y,w,h,22,false,true); for(const e of state.enemies.slice(0,90)){ const ex=x+(e.x/WORLD.width)*w, ey=y+(e.y/WORLD.height)*h; ctx.fillStyle=e.bossEvent?'#ffd167':e.type==='boss'?'#ffd167':e.type==='brute'?'#8f68ff':e.type==='spitter'?'#53d5a5':e.type==='skitter'?'#ff93f0':e.type==='blob'?'#d9ff73':e.type==='eye'?'#c79cff':'#ff6a6a'; ctx.fillRect(ex-2,ey-2,e.bossEvent?6:4,e.bossEvent?6:4); } const px=x+(player.x/WORLD.width)*w, py=y+(player.y/WORLD.height)*h; ctx.fillStyle='#6de8ff'; ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill(); const vx=x+(state.camera.x/WORLD.width)*w, vy=y+(state.camera.y/WORLD.height)*h, vw=(canvas.width/WORLD.width)*w, vh=(canvas.height/WORLD.height)*h; ctx.strokeStyle='rgba(255,255,255,.35)'; roundRect(ctx,vx,vy,vw,vh,8,false,true); ctx.fillStyle='rgba(255,255,255,.9)'; ctx.font='700 12px Inter'; ctx.textAlign='left'; ctx.fillText('Карта', x+14, y+18); }
function drawXpBar(){ const need=state.nextXp || xpNeed(state.level || 1),w=420,h=18,x=canvas.width/2-w/2,y=getActiveBoss()?82:20; ctx.fillStyle='rgba(10,16,34,.78)'; roundRect(ctx,x-10,y-12,w+20,42,18,true,false); ctx.fillStyle='rgba(0,0,0,.32)'; roundRect(ctx,x,y,w,h,10,true,false); const fill = ctx.createLinearGradient(x,0,x+w,0); fill.addColorStop(0,'#68d4ff'); fill.addColorStop(1,'#90ffe1'); ctx.fillStyle=fill; roundRect(ctx,x,y,w*(state.xp/need),h,10,true,false); ctx.strokeStyle='rgba(255,255,255,.14)'; roundRect(ctx,x,y,w,h,10,false,true); ctx.fillStyle='rgba(255,255,255,.96)'; ctx.font='700 12px Inter'; ctx.textAlign='center'; ctx.fillText(`Опыт ${Math.floor(state.xp)} / ${state.nextXp}`, x+w/2, y+13); }
function drawBossBar(){ const boss = getActiveBoss(); if(!boss) return; const pad=26, w=canvas.width-pad*2, h=22, x=pad, y=20; ctx.fillStyle='rgba(20,12,16,.82)'; roundRect(ctx,x-12,y-14,w+24,66,24,true,false); const fill = ctx.createLinearGradient(x,0,x+w,0); fill.addColorStop(0,'#ff8aa0'); fill.addColorStop(1,'#ffd66d'); ctx.fillStyle='rgba(255,255,255,.07)'; roundRect(ctx,x,y,w,h,12,true,false); ctx.fillStyle=fill; roundRect(ctx,x,y,w*(boss.hp/boss.maxHp),h,12,true,false); ctx.strokeStyle='rgba(255,255,255,.16)'; roundRect(ctx,x,y,w,h,12,false,true); ctx.fillStyle='#fff6d7'; ctx.font='800 18px Inter'; ctx.textAlign='center'; ctx.fillText(`${boss.name} — ${Math.ceil(boss.hp)} / ${boss.maxHp} HP`, x+w/2, y-6); ctx.fillStyle='rgba(255,240,205,.86)'; ctx.font='700 12px Inter'; ctx.fillText(`${boss.mega ? 'Мега-способности' : 'Уникальная способность'}: ${boss.bossSkillName || '—'}`, x+w/2, y+h+16); }
function render(){ ctx.clearRect(0,0,canvas.width,canvas.height); drawMap(); drawBiomeHazards(); drawOrbs(); drawProjectiles(); for(const e of state.enemies) drawEnemy(e); drawPlayer(); drawParticles(); drawMinimap(); drawXpBar(); drawBossBar(); }
function gameOver(){ Music.playMenu(); gameStarted=false; freezeGame=true; postRunNextBiome = null; ui.nextBiomeBtn.classList.add('hiddenAction'); document.getElementById('restartBtn').textContent = 'Повторить биом'; state.bestWave=Math.max(state.bestWave,state.biomeIndex*20+state.biomeWave); saveBest(); refreshMetaUI(); ui.gameOverText.textContent = `Ты дошёл до ${currentBiomeDef().name}, волна ${state.biomeWave}/20, уничтожил ${state.kills} врагов и собрал ${Math.floor(state.genes)} ДНК за этот забег.`; ui.gameOver.classList.remove('hidden'); }
function update(dt){ if (!gameStarted) { updateParticles(dt); updateCamera(); hudUpdate(); return; } state.t += dt; updateParticles(dt); if (freezeGame) { updateCamera(); hudUpdate(); return; } updateBiomeHazards(dt); updateWaveSpawns(dt); updatePlayer(dt); updateEnemies(dt); updateProjectiles(dt); updateEnemyProjectiles(dt); updateOrbs(dt); maybeOpenPendingFusion(); updateCamera(); hudUpdate(); if (player.hp<=0) gameOver(); }
function loop(now){ const dt=Math.min(0.033,(now-last)/1000); last=now; update(dt); render(); requestAnimationFrame(loop); } requestAnimationFrame(loop);
function resizeCanvas(){ canvas.width=Math.max(960,window.innerWidth); canvas.height=Math.max(540,window.innerHeight); }
window.addEventListener('resize',resizeCanvas); resizeCanvas();
canvas.tabIndex = 0;
window.addEventListener('pointerdown',()=>{ canvas.focus(); Music.unlock(); }, {once:true});
window.addEventListener('load',()=>canvas.focus());
window.addEventListener('keydown',e=>{
  const code = e.code || '';
  keys[code]=true;
  const k = (e.key||'').toLowerCase();
  if(k==='w') keys.KeyW = true;
  if(k==='a') keys.KeyA = true;
  if(k==='s') keys.KeyS = true;
  if(k==='d') keys.KeyD = true;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(code)) e.preventDefault();
  if(code==='ArrowUp') keys.KeyW = true;
  if(code==='ArrowLeft') keys.KeyA = true;
  if(code==='ArrowDown') keys.KeyS = true;
  if(code==='ArrowRight') keys.KeyD = true;
  if(code==='KeyM'){ e.preventDefault(); Music.toggleMute(); return; }
  if(code==='ShiftLeft'||code==='ShiftRight') useDash();
  if(code==='Space'){ useBurst(); }
});
window.addEventListener('keydown',e=>{
  if(e.code==='Escape'){
    e.preventDefault();
    if(ui.biomePanel && !ui.biomePanel.classList.contains('hiddenPanel')) { ui.biomePanel.classList.add('hiddenPanel'); return; }
    if(ui.shop && !ui.shop.classList.contains('hidden')) { closeShop(); return; }
    if(ui.pause && !ui.pause.classList.contains('hidden')) { resumeGame(); return; }
    togglePause();
  }
});
window.addEventListener('keyup',e=>{
  const code = e.code || '';
  keys[code]=false;
  const k = (e.key||'').toLowerCase();
  if(k==='w'||code==='ArrowUp') keys.KeyW = false;
  if(k==='a'||code==='ArrowLeft') keys.KeyA = false;
  if(k==='s'||code==='ArrowDown') keys.KeyS = false;
  if(k==='d'||code==='ArrowRight') keys.KeyD = false;
});

function setupMenuButtonPressFx(){
  const panel = document.querySelector('.splashArtPanel');
  const buttons = document.querySelectorAll('.hotspotBtn');
  const clear = (btn)=>btn.classList.remove('pressed');
  buttons.forEach(btn=>{
    btn.addEventListener('pointerdown', e=>{
      Music.unlock();
      if(btn.id==='playBtn' || btn.id==='playBtnBottom') Music.playBiome(selectedBiomeIndex);
      else Music.playMenu();
      btn.classList.add('pressed');
      if(panel){
        const panelRect = panel.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'menuClickRipple';
        ripple.style.left = `${e.clientX - panelRect.left}px`;
        ripple.style.top = `${e.clientY - panelRect.top}px`;
        panel.appendChild(ripple);
        setTimeout(()=>ripple.remove(), 420);
      }
    });
    btn.addEventListener('pointerup', ()=>setTimeout(()=>clear(btn), 110));
    btn.addEventListener('pointerleave', ()=>setTimeout(()=>clear(btn), 80));
    btn.addEventListener('pointercancel', ()=>clear(btn));
    btn.addEventListener('keydown', e=>{
      if(e.code === 'Space' || e.code === 'Enter'){
        btn.classList.add('pressed');
        setTimeout(()=>clear(btn), 160);
      }
    });
  });
}



function menuPressAction(button, action, delay=230){
  if(!button) return;
  button.addEventListener('click', e=>{
    e.preventDefault();
    e.stopPropagation();
    button.classList.add('pressed');
    setTimeout(()=>button.classList.remove('pressed'), Math.max(160, delay - 30));
    setTimeout(()=>action(), delay);
  });
}

// menu button actions use delayed execution so the press animation is visible

menuPressAction(document.getElementById('playBtn'), ()=>startRunAtBiome(selectedBiomeIndex), 250);
menuPressAction(document.getElementById('playBtnBottom'), ()=>startRunAtBiome(selectedBiomeIndex), 250);
document.getElementById('restartBtn').onclick=()=>{ ui.gameOver.classList.add('hidden'); closeShop(); resetRun(state.biomeIndex); };
document.getElementById('nextBiomeBtn').onclick=()=>{ if(postRunNextBiome !== null) startRunAtBiome(postRunNextBiome); };
document.getElementById('backMenuBtn').onclick=()=> showMainMenu();
menuPressAction(document.getElementById('resetBestBtn'), ()=>{ profile.bestWave = 1; state.bestWave = 1; saveProfile(); refreshMetaUI(); toast('Рекорд сброшен'); }, 220);
document.getElementById('shopBtn').onclick=()=>openShop();
menuPressAction(document.getElementById('shopMenuBtn'), ()=>openShop(), 220);
menuPressAction(ui.biomeToggleBtn, ()=>ui.biomePanel.classList.toggle('hiddenPanel'), 170);
const settingsBtn = document.getElementById('settingsBtn'); menuPressAction(settingsBtn, ()=>ui.biomePanel.classList.toggle('hiddenPanel'), 170);
if(ui.closeBiomePanelBtn) ui.closeBiomePanelBtn.onclick = ()=> ui.biomePanel.classList.add('hiddenPanel');
document.getElementById('shopCloseBtn').onclick=()=>closeShop();
if(ui.resumeBtn) ui.resumeBtn.onclick=()=>resumeGame();
if(ui.pauseMenuBtn) ui.pauseMenuBtn.onclick=()=>showMainMenu();
hudUpdate(); refreshMetaUI(); render();
