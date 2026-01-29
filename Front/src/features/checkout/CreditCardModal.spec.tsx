import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import checkoutReducer from './checkoutSlice';
import CreditCardModal from './CreditCardModal';

jest.mock('../../utils/persistence', () => ({
  loadState: jest.fn(() => null),
  saveState: jest.fn(),
  clearState: jest.fn(),
}));

const createStore = () =>
  configureStore({
    reducer: { checkout: checkoutReducer },
  });

describe('CreditCardModal', () => {
  it('should render card form fields', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    expect(screen.getByPlaceholderText('Card Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Card Holder Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('MM/YY')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('CVC')).toBeInTheDocument();
  });

  it('should render delivery form fields', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Delivery Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
  });

  it('should show validation errors on empty submit', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    fireEvent.click(screen.getByText('Continue to Summary'));
    expect(screen.getByText('Enter a valid card number')).toBeInTheDocument();
    expect(screen.getByText('Valid email required')).toBeInTheDocument();
  });

  it('should format card number with spaces', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    const input = screen.getByPlaceholderText('Card Number');
    fireEvent.change(input, { target: { value: '4242424242424242' } });
    expect((input as HTMLInputElement).value).toBe('4242 4242 4242 4242');
  });

  it('should show Visa logo for Visa card', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText('Card Number'), { target: { value: '4242' } });
    const logo = document.querySelector('img[alt="visa"]');
    expect(logo).toBeTruthy();
  });

  it('should show MasterCard logo for MC card', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText('Card Number'), { target: { value: '5500' } });
    const logo = document.querySelector('img[alt="mastercard"]');
    expect(logo).toBeTruthy();
  });

  it('should validate Luhn check', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText('Card Number'), { target: { value: '1234567890123456' } });
    fireEvent.change(screen.getByPlaceholderText('Card Holder Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('MM/YY'), { target: { value: '12/30' } });
    fireEvent.change(screen.getByPlaceholderText('CVC'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Delivery Address'), { target: { value: 'Addr' } });
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'City' } });
    fireEvent.click(screen.getByText('Continue to Summary'));
    expect(screen.getByText('Invalid card number')).toBeInTheDocument();
  });

  it('should close modal on X click', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    fireEvent.click(screen.getByText('×'));
    expect(store.getState().checkout.step).toBe(1);
  });

  it('should dispatch card and customer info on valid submit', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <CreditCardModal />
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText('Card Number'), { target: { value: '4242424242424242' } });
    fireEvent.change(screen.getByPlaceholderText('Card Holder Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('MM/YY'), { target: { value: '12/30' } });
    fireEvent.change(screen.getByPlaceholderText('CVC'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByPlaceholderText('Delivery Address'), { target: { value: 'Calle 123' } });
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Bogota' } });
    fireEvent.click(screen.getByText('Continue to Summary'));

    const state = store.getState().checkout;
    expect(state.step).toBe(3);
    expect(state.customerInfo?.email).toBe('john@example.com');
    expect(state.cardInfo?.lastFour).toBe('4242');
  });
});
