// Mock data for screens
const PLAYERS = [
  { name: 'Хосе', level: 'B+', side: 'R' },
  { name: 'Кристиан', level: 'C', side: 'L' },
  { name: 'Энди', level: 'C+', side: 'R' },
  { name: 'Абдурахман', level: 'C+', side: 'L' },
  { name: 'Никита', level: 'A', side: 'R' },
  { name: 'Иван', level: 'B+', side: 'L' },
  { name: 'Ирина', level: 'B', side: 'U' },
  { name: 'Павел', level: 'B', side: 'R' },
  { name: 'Дмитрий', level: 'C+', side: 'L' },
  { name: 'Алекс', level: 'C', side: 'R' },
  { name: 'Артём', level: 'C', side: 'L' },
  { name: 'Рустам', level: 'C-', side: 'U' },
  { name: 'Илья', level: 'B', side: 'R' },
  { name: 'Саша', level: 'A+', side: 'L' },
  { name: 'Влад', level: 'C-strong', side: 'R' },
  { name: 'Гаджи', level: 'D', side: 'U' },
];

// 4 courts × 4 players, 8 teams
const COURTS = [
  { court: 1, points: 3, medal: 1,
    team1: [PLAYERS[4], PLAYERS[13]], team2: [PLAYERS[5], PLAYERS[6]] },
  { court: 2, points: 2, medal: 2,
    team1: [PLAYERS[7], PLAYERS[8]], team2: [PLAYERS[12], PLAYERS[0]] },
  { court: 3, points: 1, medal: 3,
    team1: [PLAYERS[1], PLAYERS[2]], team2: [PLAYERS[3], PLAYERS[9]] },
  { court: 4, points: 1, medal: null,
    team1: [PLAYERS[10], PLAYERS[14]], team2: [PLAYERS[11], PLAYERS[15]] },
];

const LEADERBOARD = [
  { name: 'Никита', level: 'A',  points: 88, w: 7, l: 0 },
  { name: 'Иван',    level: 'B+', points: 79, w: 4, l: 3 },
  { name: 'Ирина',   level: 'B',  points: 78, w: 4, l: 3 },
  { name: 'Павел',   level: 'B',  points: 72, w: 4, l: 3 },
  { name: 'Дмитрий', level: 'C+', points: 71, w: 2, l: 5 },
  { name: 'Алекс',   level: 'C',  points: 70, w: 3, l: 4 },
  { name: 'Артём',   level: 'C',  points: 69, w: 3, l: 4 },
  { name: 'Гаджи',   level: 'D',  points: 61, w: 1, l: 6 },
];

window.PLAYERS = PLAYERS;
window.COURTS = COURTS;
window.LEADERBOARD = LEADERBOARD;
