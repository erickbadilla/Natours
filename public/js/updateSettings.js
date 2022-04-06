/* eslint-disable */
import axios from 'axios';
import { serverAPIRouteV1 } from './serverConfig';
import { showAlert } from './alerts';

export const updateUserDataSettings = async (data, type) => {
  try {
    const url = `${serverAPIRouteV1}/users/${
      type === 'password' ? 'updateMyPassword' : 'updateMe'
    }`;

    const response = await axios.patch(url, data);

    if (response.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);

      window.setTimeout(() => {
        location.reload();
      }, 1200);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};
