/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import 'mapbox-gl/dist/mapbox-gl.css';
import { updateUserDataSettings } from './updateSettings';
import { bookTour } from './stripe';
import { signUp } from './signup';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.getElementById('login-form');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
const userSignUpForm = document.getElementById('sign-up-form');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('photo').files[0];

    form.append('name', name);
    form.append('email', email);
    form.append('photo', photo);

    await updateUserDataSettings(form, 'data');
  });

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;
    await updateUserDataSettings(
      { currentPassword, password, confirmPassword },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (userSignUpForm) {
  userSignUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('confirm-password').value;

    if (password !== passwordConfirm) {
      return passwordConfirm.setCustomValidity('Password must be matching.');
    }

    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;

    await signUp({
      name,
      email,
      password,
      passwordConfirm,
    });
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'Processing...';

    const { tourId } = e.target.dataset;

    await bookTour(tourId);
  });
}
