import axios from 'axios';
import { showAlert } from './alerts';
import { serverAPIRouteV1 } from './serverConfig';

export const signUp = async (userData) => {
  try {
    const signUpResponse = await axios({
      withCredentials: true,
      method: 'POST',
      url: `${serverAPIRouteV1}/users/signup`,
      data: userData,
    });

    if (signUpResponse.data.status === 'success') {
      window.setTimeout(() => {
        showAlert('success', 'Sign up successfully! Please check your email');
        location.assign('/');
      }, 2000);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};
