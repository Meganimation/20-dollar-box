import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import BackgroundImage from '../assets/paper-background.jpg';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { loadStripe } from '@stripe/stripe-js';
import { TextField, Input } from '@mui/material';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { Item } from '../types';

type PaymentPageProps = {
  cart: Item[];
  boxIsFull: boolean;
};

const IconWrapper = styled.div`
  svg {
    font-size: 7rem;
    color: black;
  }
`;

const Flex = styled.div`
  display: flex;
  padding-top: 10px;
  justify-content: space-between;
`;

const CutWidth = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Box = styled.div`
  background-image: white;
  display: flex;
  flex-direction: column;
  width: 50%;
  text-align: center;
  color: black;
  padding: 20px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-self: center;
  justify-content: space-around;
  padding-top: 20px;
  min-width: 200px;
`;

const PayButton = styled.button<{ disabled: boolean }>`
  background-color: ${(props) => (props.disabled ? 'gray' : 'black')};
  color: white;
  padding: 10px;
  border-radius: 5px;
  border: none;
  width: 100%;
  font-size: 1rem;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
`;

const BackButton = styled.button<{ danger: true }>`
  background-color: white;
  color: ${(props) => (props.danger ? 'red' : 'black')};
  padding: 10px;
  border-radius: 5px;
  border: none;
  width: 100%;
  font-size: 1rem;
`;

const Total = styled.div`
  font-size: 1.75rem;
  padding: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 0;
  background-color: white;
  color: black;
  border-radius: 5px;
  transition: background 0.15s ease, border 0.15s ease, box-shadow 0.15s ease,
    color 0.15s ease;
  border: 1px solid #e6e6e6;
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(0, 0, 0, 0.02);
  font-size: 1rem;
  text-indent: 10px;
`;

const Select = styled.select`
  width: 100px;
  text-indent: 10px;

  padding: 0.75rem 0;
  background-color: white;
  color: black;
  border-radius: 5px;
  transition: background 0.15s ease, border 0.15s ease, box-shadow 0.15s ease,
    color 0.15s ease;
  border: 1px solid #e6e6e6;
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(0, 0, 0, 0.02);
  font-size: 1rem;
`;

const Label = styled.div`
  text-align: left;

  font-size: 0.9rem;
`;

const InputWrapper = styled.div`
  width: 100%;
`;

const ALL_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
];

export default function PaymentPage({ cart, boxIsFull }: PaymentPageProps) {
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    fetch('http://localhost:5252/config').then(async (r) => {
      const { publishableKey } = await r.json();
      setStripePromise(loadStripe(publishableKey));
    });
  }, []);

  useEffect(() => {
    fetch('http://localhost:5252/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({}),
    }).then(async (result) => {
      const { clientSecret } = await result.json();
      console.log('client secret', clientSecret);
      setClientSecret(clientSecret);
    });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Box>
      <IconWrapper>
        <UnarchiveIcon />
      </IconWrapper>
      <div>
        {' '}
        The box {boxIsFull ? 'is now full with ' : 'contains '}
        <b>{cart.length}</b> {cart.length === 1 ? 'item' : 'items'} <br /> It
        can be shipped anywhere in America in exchange for $20.
      </div>

      {/* //TODO: ADD address */}
      <CutWidth>
        <Label>Street Name</Label>
        <Input placeholder="1234 Package Lane" />
      </CutWidth>
      <Flex>
        <div>
          <Label>City</Label>
          <InputWrapper>
            <Input placeholder="Boxtown" />
          </InputWrapper>
        </div>
        <div>
          <Label>State</Label>
          <InputWrapper>
            <Select>
              {ALL_STATES.map((state) => (
                <option value={state}>{state}</option>
              ))}
            </Select>
          </InputWrapper>
        </div>
      </Flex>
      <Total>
        {' '}
        Total Amount: <b>$20</b>
      </Total>
      {clientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      )}
      <ButtonWrapper>
        {' '}
        <PayButton disabled> Get Package</PayButton>
        {!confirmReset ? (
          <BackButton
            onClick={() => {
              setConfirmReset(true);
            }}
          >
            {' '}
            Delete this and try again
          </BackButton>
        ) : (
          <BackButton
            onClick={() => {
              window.location.reload();
            }}
            danger
          >
            {' '}
            Are you sure?
          </BackButton>
        )}
      </ButtonWrapper>
    </Box>
  );
}
