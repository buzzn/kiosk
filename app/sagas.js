import { put, select, fork, spawn, call, take, cancel, delay } from 'redux-saga/effects';
import Bubbles from '@buzzn/module_bubbles';
import { constants, actions } from './actions';
import api from './api';
import { logException } from './_util';
import store from './configure_store';

export const getConfig = state => state.config;
export const getAppVer = state => state.app.appVer;

export function setScale() {
  const scaleX = window.innerWidth / 1920;
  const scaleY = window.innerHeight / 1080;
  const scale = scaleX < scaleY ? scaleX : scaleY;
  if (store) store.dispatch(actions.setWidgetScale(scale));
  document.body.style.transform = `scale(${scale})`;
  if (scale < 1) {
    document.body.style.transformOrigin = `${window.innerWidth - 1920 * scale}px 0 0`;
  } else {
    document.body.style.transformOrigin = `${window.innerWidth - 1600 / scale}px 0 0`;
  }
}

export function hackScale() {
  document.onload = setScale();
  window.addEventListener('resize', setScale);

  window.addEventListener(
    'touchmove',
    (event) => {
      if (event.scale !== 1) {
        event.preventDefault();
      }
    },
    false,
  );

  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 500) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false,
  );
}

export function getGroupFromUrl() {
  return new URL(window.location.href).pathname.split('/')[1];
}

export function* windowReload() {
  while (true) {
    const currentVer = yield select(getAppVer);
    try {
      const { version: newVer } = yield call(api.fetchVersion);
      yield put(actions.setAppVer(newVer));
      if (currentVer && currentVer !== newVer) {
        window.location.reload();
      }
    } catch (error) {
      logException(error);
    }
    yield delay(10 * 60 * 1000);
  }
}

export function* getCharts({ apiUrl, apiPath }, { groupId }) {
  while (true) {
    try {
      const charts = yield call(api.fetchGroupChart, {
        apiUrl,
        apiPath,
        groupId,
      });
      yield put(actions.setCharts(charts));
    } catch (error) {
      logException(error);
    }
    // FIXME: temporary fix for broken charts
    yield delay(40 * 1000);
    // yield delay(15 * 60 * 1000);
  }
}

export function* setHealth({ apiUrl }) {
  while (true) {
    try {
      const health = yield call(api.fetchHealth, { apiUrl });
      yield put(actions.setHealth(health));
    } catch (error) {
      logException(error);
      yield put(actions.setHealth({}));
    }
    yield delay(60 * 1000);
  }
}

export function* setUI() {
  const parsedURL = new URL(window.location.href);
  let urlDisplay = parsedURL.searchParams.get('display');
  const urlNoTitle = parsedURL.searchParams.get('no-title');
  const urlNoClock = parsedURL.searchParams.get('no-clock');
  let ui = yield call(api.getUI);
  if (urlDisplay) {
    if (!['computer', 'tizen'].includes(urlDisplay)) urlDisplay = 'computer';
    ui.display = urlDisplay;
    yield call(api.setUI, ui);
  }
  if (urlNoTitle) {
    ui.noTitle = urlNoTitle === 'true';
    yield call(api.setUI, ui);
  }
  if (urlNoClock) {
    ui.noClock = urlNoClock === 'true';
    yield call(api.setUI, ui);
  }
  yield put(actions.setUI(ui));

  while (true) {
    const { ui: uiPart } = yield take(constants.SET_UI);
    ui = { ...ui, ...uiPart };
    yield put(actions.setUI(ui));
    yield call(api.setUI, ui);
  }
}

export default function* appLoop() {
  const { apiUrl, apiPath, secure, timeout } = yield select(getConfig);

  yield fork(setHealth, { apiUrl });
  yield fork(setUI);

  if (secure && window.location.protocol !== 'https:') {
    window.location.href = `https:${window.location.href.substring(window.location.protocol.length)}`;
  }

  let groupId = yield call(getGroupFromUrl);
  const metaGroup = new URL(window.location.href).searchParams.get('metagroup');
  const customTitle = new URL(window.location.href).searchParams.get('custom-title');

  if (!metaGroup && !groupId) return false;

  if (customTitle) yield put(actions.setCustomTitle(customTitle));

  if (metaGroup) groupId = metaGroup.split(',');

  yield spawn(windowReload);
  yield put(actions.setUrlGroupId(groupId));
  yield put(
    Bubbles.actions.setApiParams({
      apiUrl,
      apiPath: `${apiPath}/groups`,
      timeout,
    }),
  );
  yield put(Bubbles.actions.setToken({ token: null }));

  yield call(hackScale);

  while (true) {
    try {
      yield put(actions.loadingGroup());
      let group = {};

      if (Array.isArray(groupId)) {
        group = { id: 'meta', name: '' };
      } else {
        const mentors = yield call(api.fetchGroupMentors, {
          apiUrl,
          apiPath,
          groupId,
        });
        yield put(actions.setMentors(mentors));
        group = yield call(api.fetchGroup, { apiUrl, apiPath, groupId });
      }

      if (group.id) {
        yield put(actions.setGroup(group));
        yield put(actions.loadedGroup());
        const chartSaga = yield fork(getCharts, { apiUrl, apiPath }, { groupId });
        yield put(Bubbles.actions.setGroupId(groupId));

        yield take(constants.CANCEL);

        yield put(actions.setGroup({}));
        yield cancel(chartSaga);
        yield put(Bubbles.actions.stopRequests());
      } else {
        yield delay(10 * 60 * 1000);
      }
    } catch (error) {
      if (error._status === 404 || error._status === 403) {
        yield put(actions.setMentors({ _status: error._status, array: [] }));
      } else {
        logException(error.error);
      }
      // FIXME: temporary hack, please change to proper err code handling
      yield put(actions.loadedGroup());
      yield delay(10 * 60 * 1000);
    }
  }
}
