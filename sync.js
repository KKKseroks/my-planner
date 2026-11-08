import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const OWNER_KEY = 'plannerFirebaseOwnerUid';
const KEYS = ['calendarTasks','dailyPlannerTasks','weeklyPlannerTasks','plannerHabits','plannerHabitLogs','plannerStartHour','plannerEndHour'];
const overlay = document.getElementById('authOverlay');
const status = document.getElementById('cloudStatus');
const errorLabel = document.getElementById('authError');
const logoutButton = document.getElementById('logoutButton');
const form = document.getElementById('authForm');
const registerButton = document.getElementById('registerButton');
let auth, db, activeUser = null, initialized = false;
let unsubscribe = [];
let remoteApplying = false;
const pending = new Map();
const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;
const setLocal = (key, value) => originalSetItem.call(localStorage, key, value);
const getLocal = key => localStorage.getItem(key);
function showStatus(message) { status.textContent = message; }
function clearPlannerLocal() {
  for (const key of KEYS) originalRemoveItem.call(localStorage, key);
}
function safeRefresh() {
  if (pending.size || document.querySelector('.modal.active') ||
      ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
    sessionStorage.setItem('plannerNeedsRefresh', '1');
    return;
  }
  sessionStorage.removeItem('plannerNeedsRefresh');
  location.reload();
}
function errorMessage(error) {
  const codes = {
    'auth/invalid-email':'Неверный адрес почты.',
    'auth/invalid-credential':'Неверная почта или пароль.',
    'auth/email-already-in-use':'Такая почта уже зарегистрирована.',
    'auth/weak-password':'Пароль слишком короткий.',
    'auth/network-request-failed':'Нет подключения к интернету.',
    'permission-denied':'Нет доступа к базе. Проверьте правила Firestore.'
  };
  return codes[error?.code] || error?.message || 'Произошла ошибка.';
}
function remoteRef(key) { return doc(db, 'users', activeUser.uid, 'planner', key); }
function queueWrite(key, value) {
  if (!activeUser || remoteApplying || !KEYS.includes(key)) return;
  // Одна последовательная очередь на набор данных; поздняя запись не обгоняет раннюю.
  const previous = pending.get(key) || Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    showStatus(navigator.onLine ? 'Сохранение…' : 'Нет сети — изменения ожидают отправки');
    await setDoc(remoteRef(key), { value, updatedAt: Date.now() });
    showStatus('Синхронизировано');
  }).catch(err => { showStatus('Ошибка синхронизации'); console.error('Firebase sync:', err); });
  pending.set(key, next);
  next.finally(() => { if (pending.get(key) === next) pending.delete(key); });
}
Storage.prototype.setItem = function(key, value) {
  originalSetItem.call(this, key, value);
  if (this === localStorage && initialized && KEYS.includes(key)) queueWrite(key, String(value));
};
Storage.prototype.removeItem = function(key) {
  originalRemoveItem.call(this, key);
  if (this === localStorage && initialized && KEYS.includes(key)) queueWrite(key, null);
};
async function bootstrap(user) {
  activeUser = user;
  showStatus('Загрузка данных…');
  // Не смешиваем локальные записи разных аккаунтов.
  const owner = getLocal(OWNER_KEY);
  if (owner !== user.uid) {
    if (owner) {
      clearPlannerLocal();
    } else if (KEYS.some(key => getLocal(key) !== null)) {
      const importOld = confirm('Найдены старые записи на этом устройстве. Перенести их в текущий аккаунт Firebase? Нажмите «Отмена», если это не ваши записи.');
      if (!importOld) clearPlannerLocal();
    }
    setLocal(OWNER_KEY, user.uid);
  }
  // До запуска существующего script.js получаем данные из облака.
  for (const key of KEYS) {
    const ref = remoteRef(key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const value = snap.data().value;
      if (value !== null && value !== undefined) setLocal(key, String(value));
      else originalRemoveItem.call(localStorage, key);
    } else {
      const local = getLocal(key);
      if (local !== null) await setDoc(ref, { value: local, updatedAt: Date.now() });
    }
  }
  initialized = true;
  if (!window.__plannerLoaded) {
    const script = document.createElement('script');
    script.src = './script.js';
    script.onload = () => { window.__plannerLoaded = true; overlay.hidden = true; logoutButton.hidden = false; showStatus('Синхронизировано'); };
    script.onerror = () => { errorLabel.textContent = 'Не удалось загрузить планер.'; };
    document.body.appendChild(script);
  } else {
    overlay.hidden = true;
    logoutButton.hidden = false;
  }
  for (const key of KEYS) {
    const unsub = onSnapshot(remoteRef(key), snap => {
      if (!snap.exists() || !initialized || pending.has(key)) return;
      const remote = snap.data().value;
      const local = getLocal(key);
      if (remote === local || remote == null) return;
      remoteApplying = true;
      setLocal(key, String(remote));
      remoteApplying = false;
      // Приложение держит данные в переменных. Для обновления интерфейса
      // требуется перезагрузка; не прерываем ввод текста в активной вкладке.
      if (document.visibilityState === 'hidden') sessionStorage.setItem('plannerNeedsRefresh','1');
      else safeRefresh();
    }, err => { showStatus('Ошибка доступа к облаку'); console.error(err); });
    unsubscribe.push(unsub);
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && sessionStorage.getItem('plannerNeedsRefresh') === '1') {
    safeRefresh();
  }
});
form.addEventListener('submit', async event => {
  event.preventDefault(); errorLabel.textContent = '';
  try { await signInWithEmailAndPassword(auth, document.getElementById('authEmail').value.trim(), document.getElementById('authPassword').value); }
  catch (err) { errorLabel.textContent = errorMessage(err); }
});
registerButton.addEventListener('click', async () => {
  errorLabel.textContent = '';
  if (!form.reportValidity()) return;
  try { await createUserWithEmailAndPassword(auth, document.getElementById('authEmail').value.trim(), document.getElementById('authPassword').value); }
  catch (err) { errorLabel.textContent = errorMessage(err); }
});
logoutButton.addEventListener('click', async () => {
  if (!confirm('Выйти из аккаунта? Несинхронизированные изменения могут быть потеряны.')) return;
  await Promise.allSettled([...pending.values()]);
  await signOut(auth);
  clearPlannerLocal();
  originalRemoveItem.call(localStorage, OWNER_KEY);
  sessionStorage.removeItem('plannerNeedsRefresh');
  location.reload();
});
async function start() {
  if (firebaseConfig.apiKey.startsWith('PASTE_')) {
    errorLabel.textContent = 'Сначала заполните файл firebase-config.js данными своего проекта Firebase.';
    showStatus('Требуется настройка Firebase'); return;
  }
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app); db = getFirestore(app);
  // Сохраняем вход между запусками Safari и установленного PWA.
  await setPersistence(auth, browserLocalPersistence);
  try { await enableIndexedDbPersistence(db); } catch (err) { console.warn('Кеш Firestore недоступен:', err); }
  onAuthStateChanged(auth, async user => {
    unsubscribe.forEach(fn => fn()); unsubscribe = [];
    initialized = false;
    if (!user) { activeUser = null; clearPlannerLocal(); originalRemoveItem.call(localStorage, OWNER_KEY); overlay.hidden = false; logoutButton.hidden = true; showStatus('Войдите в аккаунт'); return; }
    try { await bootstrap(user); }
    catch (err) { errorLabel.textContent = errorMessage(err); showStatus('Не удалось загрузить данные'); }
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);
}
start().catch(err => { errorLabel.textContent = errorMessage(err); });
