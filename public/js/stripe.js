/* eslint-disable */
import { showAlert } from './alerts';
import { loadStripe } from '@stripe/stripe-js';

import axios from 'axios';
import { serverAPIRouteV1 } from './serverConfig';

export const bookTour = async (tourId) => {
  const stripe = await loadStripe(
    'pk_test_51KkFuaLzFR6JR9MNEbx3zj6s60AVnD6PN5IWVIq9RMhaugjOCuJYTFlFkpdn6ipm3bbI9rYSKUQrbLSJrC5TBA1M00bcfTmwH5'
  );
  //1 Get checkout session from API

  try {
    const session = await axios.get(
      `${serverAPIRouteV1}/bookings/checkout-session/${tourId}`
    );

    //2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (e) {
    console.error(e);
    showAlert('error', e);
  }
};
