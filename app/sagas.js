import { put, select, fork, spawn, call, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import Bubbles from '@buzzn/module_bubbles';
import { constants, actions } from './actions';
import api from './api';
import { logException } from './_util';

export const getConfig = state => state.config;

export function setScale() {
  const scale = window.innerWidth / 1920;
  document.body.style.zoom = scale;
  document.body.style.MozTransform = `scale(${scale})`;
}

export function hackScale() {
  document.onload = setScale();
  window.addEventListener('resize', setScale);
}

export function getGroupFromUrl() {
  return window.location.href.split('/')[3].split('?')[0];
}

export function windowReload() {
  setInterval(() => {
    window.location.reload(true);
  }, 1000 * 60 * 60 * 24);
}

export function* bubbles({ groupId }) {
  yield put(Bubbles.actions.setGroupId(groupId));
}

export function* getCharts({ apiUrl, apiPath }, { groupId }) {
  while (true) {
    try {
      const charts = yield call(api.fetchGroupChart, { apiUrl, apiPath, groupId });
      yield put(actions.setCharts(charts));
    } catch (error) {
      logException(error);
    }
    yield call(delay, 15 * 60 * 1000);
  }
}

export function* getGroup({ apiUrl, apiPath }, { groupId }) {
  try {
    const group = yield call(api.fetchGroup, { apiUrl, apiPath, groupId });
    const mentors = yield call(api.fetchGroupMentors, { apiUrl, apiPath, groupId });
    group.mentors = mentors.array;
    yield put(actions.setGroup(group));
  } catch (error) {
    logException(error);
  }
}

export function* getGroups({ apiUrl, apiPath }) {
  try {
    const groups = yield call(api.fetchGroups, { apiUrl, apiPath });
    yield put(actions.setGroups(groups.array));
  } catch (error) {
    logException(error);
  }
}

export default function* appLoop() {
  const { apiUrl, apiPath, secure } = yield select(getConfig);

  yield call(hackScale);

  if (secure && window.location.protocol !== 'https:') {
    window.location.href = `https:${window.location.href.substring(window.location.protocol.length)}`;
  }

  const groupId = yield call(getGroupFromUrl);
  yield put(Bubbles.actions.setApiParams({ apiUrl, apiPath: `${apiPath}/groups` }));
  yield put(Bubbles.actions.setToken({ token: null }));
  if (groupId) {
    yield put(actions.setUrlGroupId(groupId));
    yield call(getGroup, { apiUrl, apiPath }, { groupId });
    yield fork(getCharts, { apiUrl, apiPath }, { groupId });
    yield put(Bubbles.actions.setGroupId(groupId));
    yield spawn(windowReload);
  } else {
    yield call(getGroups, { apiUrl, apiPath });
    yield fork(takeLatest, constants.SET_GROUP_ID, getGroup, { apiUrl, apiPath });
    yield fork(takeLatest, constants.SET_GROUP_ID, getCharts, { apiUrl, apiPath });
    yield fork(takeLatest, constants.SET_GROUP_ID, bubbles);
  }
}
