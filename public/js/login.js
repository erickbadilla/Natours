/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
import { serverAPIRouteV1 } from './serverConfig';
export const login = async (email, password) => {
  try {
    const response = await axios({
      withCredentials: true,
      method: 'POST',
      url: `${serverAPIRouteV1}/users/login`,
      data: {
        email,
        password,
      },
    });

    if (response.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};

export const logout = async () => {
  try {
    const response = await axios({
      withCredentials: true,
      method: 'GET',
      url: `${serverAPIRouteV1}/users/logout`,
    });

    if (response.data.status === 'success') location.reload();
  } catch (e) {
    showAlert('error', 'Error logging out! Please try again.');
  }
};
