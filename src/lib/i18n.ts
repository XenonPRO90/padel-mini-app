// Lightweight i18n (EN/RU). Module-level store + useSyncExternalStore so any
// component re-renders on language change. Default: Telegram language_code,
// overridable via a manual toggle, persisted in localStorage.
import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'ru';

function detectInitial(): Lang {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'ru') return saved;
  } catch { /* noop */ }
  const lc = (window as unknown as {
    Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } };
  }).Telegram?.WebApp?.initDataUnsafe?.user?.language_code || '';
  return lc.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

let _lang: Lang = detectInitial();
const listeners = new Set<() => void>();

export function getLang(): Lang { return _lang; }
export function setLang(l: Lang) {
  if (l === _lang) return;
  _lang = l;
  try { localStorage.setItem('lang', l); } catch { /* noop */ }
  listeners.forEach((f) => f());
}
function subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

type Entry = { en: string; ru: string };

export const STR = {
  // tabs / nav
  'tab.tournament': { ru: 'Турнир', en: 'Tournament' },
  'tab.players': { ru: 'Игроки', en: 'Players' },
  'tab.club': { ru: 'Клуб', en: 'Club' },
  'tab.history': { ru: 'История', en: 'History' },
  'tab.cabinet': { ru: 'Кабинет', en: 'Profile' },
  'common.back': { ru: 'Назад', en: 'Back' },
  'common.ok': { ru: 'OK', en: 'OK' },
  'common.gotit': { ru: 'Понятно', en: 'Got it' },
  'common.nodata': { ru: 'Пока нет данных', en: 'No data yet' },

  // Club
  'club.title': { ru: 'Клуб', en: 'Club' },
  'club.rating': { ru: 'Рейтинг', en: 'Rating' },
  'club.pairs': { ru: 'Дуэты', en: 'Duos' },
  'club.records': { ru: 'Рекорды', en: 'Records' },
  'club.allTime': { ru: 'Всё время', en: 'All time' },
  'club.month': { ru: 'Месяц', en: 'Month' },
  'club.byPoints': { ru: 'Очки', en: 'Points' },
  'club.byWinrate': { ru: 'Винрейт', en: 'Win rate' },
  'club.byRating': { ru: 'Рейтинг', en: 'Rating' },
  'club.byElo': { ru: 'ELO', en: 'ELO' },
  'club.playsAs': { ru: 'играет как {lvl}', en: 'plays as {lvl}' },
  'club.eloFooter': { ru: 'ELO по результатам · старт от уровня · тренер вне зачёта', en: 'ELO from results · seeded by level · coach excluded' },
  'club.validating': { ru: 'уровень на валидации', en: 'level validating' },
  'club.ratingFooter': { ru: 'композит: качество · титулы · опыт · форма · всё время',
    en: 'composite: quality · titles · experience · form · all-time' },
  'club.winrateNote': { ru: 'в рейтинге по винрейту — от 10 игр', en: 'win-rate ranking — 10+ games' },
  'club.pairsEmpty': { ru: 'Пока мало совместных игр', en: 'Not enough games together yet' },
  'club.recordsTitle': { ru: 'Рекорды клуба', en: 'Club records' },
  'club.recMostTitles': { ru: 'Больше титулов', en: 'Most titles' },
  'club.recLongestStreak': { ru: 'Самая длинная серия', en: 'Longest streak' },
  'club.recMostPoints': { ru: 'Больше всего очков', en: 'Most points' },
  'club.recMostWins': { ru: 'Больше всего побед', en: 'Most wins' },
  'club.hallOfFame': { ru: 'Зал славы · чемпионы', en: 'Hall of fame · champions' },
  'club.games': { ru: '{n}и', en: '{n}g' },

  // Rating explainer modal
  'rating.title': { ru: 'Как считается рейтинг', en: 'How the rating works' },
  'rating.intro': { ru: 'Единый балл 0–1000 за всё время и по всем форматам. Складывается из четырёх частей:',
    en: 'A single 0–1000 score across all time and formats. Four parts:' },
  'rating.qualityT': { ru: 'Качество', en: 'Quality' },
  'rating.qualityD': { ru: 'процент побед с поправкой на силу соперника — побеждать сильных ценнее.',
    en: 'win rate adjusted for opponent strength — beating stronger players counts more.' },
  'rating.titlesT': { ru: 'Титулы', en: 'Titles' },
  'rating.titlesD': { ru: 'чемпионства и подиумы в завершённых турнирах.',
    en: 'championships and podiums in finished tournaments.' },
  'rating.expT': { ru: 'Опыт', en: 'Experience' },
  'rating.expD': { ru: 'сколько игр сыграно — стабильность важнее одной удачной серии.',
    en: 'games played — consistency over a single lucky run.' },
  'rating.formT': { ru: 'Форма', en: 'Form' },
  'rating.formD': { ru: 'результаты за последние 30 дней.', en: 'results over the last 30 days.' },
  'rating.note': { ru: 'У кого мало игр, рейтинг осторожнее — пара побед не выводит новичка в топ, нужна история.',
    en: 'With few games the rating stays cautious — a couple of wins won’t push a newcomer to the top.' },

  // Profile
  'profile.title': { ru: 'Профиль', en: 'Profile' },
  'profile.share': { ru: 'Поделиться', en: 'Share' },
  'profile.invite': { ru: 'Пригласить', en: 'Invite' },
  'profile.winsInMatches': { ru: 'побед в матчах', en: 'match win rate' },
  'profile.days30': { ru: '30 дней', en: '30 days' },
  'profile.inClub': { ru: '#{n} в клубе', en: '#{n} in club' },
  'profile.inApp': { ru: '✓ в приложении', en: '✓ in app' },
  'profile.racketPh': { ru: 'Твоя ракетка (напр. Babolat Air)', en: 'Your racket (e.g. Babolat Air)' },
  'profile.stats': { ru: 'Статистика', en: 'Stats' },
  'profile.bestPartner': { ru: 'Лучший партнёр', en: 'Best partner' },
  'profile.worstPartner': { ru: '🤝 Пока не сложилось', en: "🤝 Not our duo (yet)" },
  'profile.h2h': { ru: 'Личные счёты', en: 'Head-to-head' },
  'profile.nemesis': { ru: 'Немезида', en: 'Nemesis' },
  'profile.favOpp': { ru: 'Любимый соперник', en: 'Favourite opponent' },
  'profile.courts': { ru: 'Корты · King of the Court', en: 'Courts · King of the Court' },
  'profile.court': { ru: 'Корт {n}', en: 'Court {n}' },
  'profile.recentTournaments': { ru: 'Последние турниры', en: 'Recent tournaments' },
  'profile.frequentPartners': { ru: 'Частые партнёры', en: 'Frequent partners' },
  'profile.noTournaments': { ru: 'Пока нет сыгранных турниров', en: 'No tournaments played yet' },
  'profile.gamesWr': { ru: '{games} игр · {wr}%', en: '{games} games · {wr}%' },
  'profile.inviteText': { ru: 'Открой свой профиль в Padel Club', en: 'Open your profile in Padel Club' },
  'profile.inviteFail': { ru: 'Не удалось создать приглашение', en: 'Could not create invite' },

  // achievement labels (by backend id)
  'ach.champion': { ru: 'Чемпион', en: 'Champion' },
  'ach.podium': { ru: 'Подиум', en: 'Podium' },
  'ach.tournaments': { ru: 'Турниров', en: 'Tournaments' },
  'ach.games': { ru: 'Игр сыграно', en: 'Games played' },
  'ach.win_rate': { ru: 'Винрейт', en: 'Win rate' },
  'ach.podium_rate': { ru: '% призовых', en: 'Podium %' },
  'ach.streak_best': { ru: 'Лучшая серия', en: 'Best streak' },
  'ach.giant_kills': { ru: 'Гроза старших', en: 'Giant-killer' },
  'ach.total_points': { ru: 'Очков за карьеру', en: 'Career points' },
  'ach.giantSub': { ru: 'из {n} со старшими', en: 'of {n} vs stronger' },
  'ach.giantNone': { ru: 'не играл со старшими', en: 'none vs stronger' },

  // stat help (legend)
  'help.tournaments': { ru: 'сколько турниров сыграно', en: 'tournaments played' },
  'help.games': { ru: 'сколько матчей (игр на корте) сыграно', en: 'matches (court games) played' },
  'help.win_rate': { ru: '% выигранных матчей: победы ÷ все матчи', en: '% of matches won: wins ÷ all matches' },
  'help.podium_rate': { ru: 'доля турниров, где попал в топ-3', en: 'share of tournaments finishing top-3' },
  'help.champion': { ru: 'сколько раз занял 1-е место в турнире', en: 'times finished 1st in a tournament' },
  'help.podium': { ru: 'сколько раз попал в топ-3 (1–3 место)', en: 'times finished top-3 (1st–3rd)' },
  'help.streak_best': { ru: 'самая длинная серия побед подряд', en: 'longest run of consecutive wins' },
  'help.giant_kills': { ru: 'победы над теми, кто на 2+ ступени выше по уровню (и сколько было таких матчей)',
    en: 'wins vs players 2+ levels above you (and how many such matches)' },
  'help.total_points': { ru: 'сумма очков по всем турнирам', en: 'total points across all tournaments' },

  // common (slice 2)
  'common.retry': { ru: 'Повторить', en: 'Retry' },
  'common.couldNotLoad': { ru: 'Не удалось загрузить', en: 'Could not load' },
  'common.cancel': { ru: 'Отмена', en: 'Cancel' },
  'common.error': { ru: 'Ошибка', en: 'Error' },
  'common.send': { ru: 'Отправить', en: 'Send' },
  'form.name': { ru: 'Имя', en: 'Name' },
  'form.level': { ru: 'Уровень', en: 'Level' },
  'form.namePh': { ru: 'Как тебя зовут', en: 'Your name' },
  'form.enterName': { ru: 'Укажи имя', en: 'Enter your name' },
  'form.submit': { ru: 'Отправить заявку', en: 'Submit application' },
  'form.submitting': { ru: 'Отправка…', en: 'Submitting…' },
  'form.submitFail': { ru: 'Не удалось отправить заявку', en: 'Could not submit' },

  // Welcome
  'welcome.tagline': { ru: 'Клуб любительского падела. Турниры каждую неделю, личная статистика и рейтинг игроков.',
    en: 'Amateur padel club. Weekly tournaments, personal stats and player rating.' },
  'welcome.f1t': { ru: 'Интересные форматы', en: 'Fun formats' },
  'welcome.f2t': { ru: 'Личный кабинет', en: 'Personal profile' },
  'welcome.f2x': { ru: 'статистика, места, серии и достижения', en: 'stats, places, streaks and achievements' },
  'welcome.f3t': { ru: 'Рейтинг клуба', en: 'Club rating' },
  'welcome.f3x': { ru: 'следи за топом игроков и лучшими дуэтами', en: 'follow the top players and best duos' },
  'welcome.pending': { ru: '⏳ Заявка на рассмотрении — организатор скоро подтвердит, и откроется твой кабинет.',
    en: '⏳ Application under review — the organizer will confirm soon and your profile will open.' },
  'welcome.apply': { ru: 'Подать заявку', en: 'Apply to join' },

  // Join banner
  'join.pendingTitle': { ru: 'Заявка на рассмотрении', en: 'Application under review' },
  'join.pendingSub': { ru: 'Организатор скоро её подтвердит — тогда откроется твой кабинет.',
    en: 'The organizer will confirm it soon — then your profile opens.' },
  'join.wantTitle': { ru: 'Хочешь в клуб?', en: 'Want to join the club?' },
  'join.wantSub': { ru: 'Подай заявку — после подтверждения появится личный кабинет со статистикой.',
    en: 'Apply — once approved you get a personal profile with stats.' },
  'join.formTitle': { ru: 'Заявка на вступление', en: 'Join request' },

  // Player home
  'home.hi': { ru: 'Привет, {name} 👋', en: 'Hi, {name} 👋' },
  'home.winsShort': { ru: '{wr}% побед', en: '{wr}% wins' },
  'home.live': { ru: '· Идёт турнир · смотреть', en: '· Tournament live · view' },
  'home.round': { ru: 'Раунд {n} / {total}', en: 'Round {n} / {total}' },
  'home.myCabinet': { ru: 'Мой кабинет', en: 'My profile' },
  'home.myCabinetSub': { ru: 'статистика и достижения', en: 'stats and achievements' },
  'home.clubRating': { ru: 'Рейтинг клуба', en: 'Club rating' },
  'home.clubRatingSub': { ru: 'топ, дуэты, рекорды', en: 'top, duos, records' },
  'home.noActive': { ru: 'Сейчас активных турниров нет — заглядывай в кабинет и рейтинг.',
    en: 'No active tournaments right now — check your profile and the rating.' },
  'home.organizersCreate': { ru: 'Турниры создают организаторы', en: 'Tournaments are created by organizers' },

  // Casual games
  'casual.organize': { ru: 'Организовать игру', en: 'Organize a game' },
  'casual.title': { ru: 'Товарищеская игра', en: 'Casual game' },
  'casual.pickPlayers': { ru: 'Выбери игроков (до 4)', en: 'Pick players (up to 4)' },
  'casual.onlyLinked': { ru: 'Только привязанные игроки', en: 'Linked players only' },
  'casual.need4': { ru: 'Нужно выбрать 4 игроков', en: 'Pick exactly 4 players' },
  'casual.games': { ru: 'Геймы', en: 'Games' },
  'casual.addGame': { ru: '+ Добавить гейм', en: '+ Add game' },
  'casual.team': { ru: 'Команда', en: 'Team' },
  'casual.tapToSplit': { ru: 'Назначь команду каждому игроку', en: 'Assign each player to a team' },
  'casual.need2v2': { ru: 'Нужно по 2 игрока в каждой команде', en: 'Need 2 players per team' },
  'casual.score': { ru: 'Счёт', en: 'Score' },
  'casual.noGames': { ru: 'Пока нет геймов — добавь хотя бы один', en: 'No games yet — add at least one' },
  'casual.submit': { ru: 'Отправить на подтверждение', en: 'Send for confirmation' },
  'casual.submitting': { ru: 'Отправка…', en: 'Sending…' },
  'casual.sent': { ru: 'Отправлено! Ждём подтверждения соперников.', en: 'Sent! Waiting for opponents to confirm.' },
  'casual.confirmTitle': { ru: 'Подтверди игру', en: 'Confirm the game' },
  'casual.confirmFrom': { ru: 'от {name}', en: 'from {name}' },
  'casual.confirm': { ru: 'Подтвердить', en: 'Confirm' },
  'casual.dispute': { ru: 'Оспорить', en: 'Dispute' },
  'casual.pendingMine': { ru: 'Ждёт подтверждения: {ok}/{total}', en: 'Awaiting confirmation: {ok}/{total}' },
  'casual.statusApproved': { ru: 'подтверждена', en: 'confirmed' },
  'casual.statusDisputed': { ru: 'оспорена', en: 'disputed' },
  'casual.statusPending': { ru: 'на подтверждении', en: 'pending' },
  'casual.note': { ru: 'Товарищеские игры идут в статистику с меньшим весом', en: 'Casual games count toward stats with a lower weight' },
  'home.startTournament': { ru: 'Начать турнир', en: 'Start new tournament' },

  // History
  'history.tournaments': { ru: 'Турниры', en: 'Tournaments' },
  'history.monthLeaders': { ru: 'Лидеры месяца', en: 'Month leaders' },
  'history.noFinished': { ru: 'Пока нет завершённых турниров', en: 'No finished tournaments yet' },
  'history.leaders': { ru: 'Лидеры', en: 'Leaders' },
  'history.noMonth': { ru: 'В этом месяце турниров не было', en: 'No tournaments this month' },
  'history.played': { ru: '{n} сыграно', en: '{n} played' },
  'history.nTournaments': { ru: 'турниров', en: 'tournaments' },

  // Players
  'players.eyebrow': { ru: '· Игроки · клуб', en: '· Players · the library' },
  'players.guests': { ru: 'игроков', en: 'guests' },
  'players.add': { ru: 'Добавить', en: 'Add' },
  'players.searchPh': { ru: 'Поиск по имени…', en: 'Search by name…' },
  'players.noMatches': { ru: 'Ничего не найдено', en: 'No matches' },

  // Admin requests
  'admin.requests': { ru: 'Заявки', en: 'Requests' },
  'admin.noRequests': { ru: 'Новых заявок нет', en: 'No new requests' },
  'admin.pending': { ru: 'На рассмотрении · {n}', en: 'Pending · {n}' },
  'admin.approve': { ru: 'Принять', en: 'Approve' },
  'admin.approveFail': { ru: 'Не удалось одобрить', en: 'Could not approve' },
  'admin.levelTitle': { ru: 'Уровни игроков', en: 'Player levels' },
  'admin.levelHint': { ru: 'Подсказки по ELO — подтвердите или пропустите', en: 'ELO-based suggestions — confirm or skip' },
  'admin.sugAssign': { ru: 'Назначить', en: 'Assign' },
  'admin.sugUp': { ru: 'Повысить', en: 'Promote' },
  'admin.sugDown': { ru: 'Понизить', en: 'Demote' },
  'admin.sugCalibrated': { ru: 'новичок · калибровка пройдена ({g} игр)', en: 'new · calibrated ({g} games)' },
  'form.levelCalib': { ru: 'Уровень определится автоматически после первых игр', en: 'Your level is set automatically after your first games' },
  'profile.calibrating': { ru: 'калибровка', en: 'calibrating' },

  // Tournament detail
  'td.finalStandings': { ru: 'Итоги', en: 'Final standings' },
  'td.roundsPlayed': { ru: 'Сыгранные раунды', en: 'Rounds played' },
  'td.round': { ru: 'Раунд', en: 'Round' },
  'td.pts': { ru: 'очк', en: 'pts' },
  'td.sendResults': { ru: '📤 Отправить результаты игрокам', en: '📤 Send results to players' },
  'td.sendConfirm': { ru: 'Отправить {n} карточек привязанным игрокам (из {total})?',
    en: 'Send {n} cards to linked players (of {total})?' },
  'td.sending': { ru: 'Отправляю карточки…', en: 'Sending cards…' },
  'td.sent': { ru: 'Отправлено: {n}', en: 'Sent: {n}' },
  'td.failed': { ru: ' · не доставлено: {k}', en: ' · not delivered: {k}' },
} satisfies Record<string, Entry>;

const MONTHS: Record<Lang, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
       'September', 'October', 'November', 'December'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август',
       'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};
export function monthNameL(lang: Lang, m1to12: number): string {
  return MONTHS[lang]?.[m1to12 - 1] ?? String(m1to12);
}

export type StrKey = keyof typeof STR;

export function tr(lang: Lang, key: StrKey, vars?: Record<string, string | number>): string {
  let s: string = STR[key]?.[lang] ?? String(key);
  if (vars) for (const k in vars) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
  return s;
}

export function useT() {
  const lang = useLang();
  return (key: StrKey, vars?: Record<string, string | number>) => tr(lang, key, vars);
}
