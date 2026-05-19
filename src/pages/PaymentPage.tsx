import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import type { Item } from '../types/types';
import { apiUrl } from '../lib/api';

type PaymentPageProps = {
  cart: Item[];
  boxIsFull: boolean;
  sessionId: string;
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

const BackButton = styled.button<{ danger?: boolean }>`
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

const CountdownNotice = styled.div`
  margin: 10px 0;
  padding: 12px;
  border-radius: 8px;
  background-color: #fff3cd;
  color: #664d03;
  font-weight: 600;
`;

const InputWrapper = styled.div`
  width: 100%;
`;

const HOLD_DURATION_MS = 10 * 60 * 1000;
const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1000;

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

export default function PaymentPage({ cart, boxIsFull, sessionId }: PaymentPageProps) {
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(HOLD_DURATION_MS);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch(apiUrl('/config'))
      .then(async (r) => {
        if (!r.ok) {
          throw new Error('Unable to load Stripe config');
        }
        const { publishableKey } = await r.json();
        setStripePromise(loadStripe(publishableKey));
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    fetch(apiUrl('/create-payment-intent'), {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then(async (result) => {
        if (!result.ok) {
          throw new Error('Unable to create payment intent');
        }
        const { clientSecret: paymentClientSecret } = await result.json();
        setClientSecret(paymentClientSecret);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    fetch(apiUrl(`/cart-hold?sessionId=${encodeURIComponent(sessionId)}`))
      .then(async (result) => {
        if (!result.ok) {
          throw new Error('Unable to load reservation hold timer');
        }
        const payload = await result.json();
        if (typeof payload.expiresAt === 'number') {
          setHoldExpiresAt(payload.expiresAt);
        } else {
          setHoldExpiresAt(Date.now() + HOLD_DURATION_MS);
        }
      })
      .catch((error) => {
        console.error(error);
        setHoldExpiresAt(Date.now() + HOLD_DURATION_MS);
      });
  }, [sessionId]);

  useEffect(() => {
    if (holdExpiresAt === null) {
      return undefined;
    }

    const updateTimer = () => {
      const nextRemainingMs = Math.max(holdExpiresAt - Date.now(), 0);
      setRemainingMs(nextRemainingMs);
      if (nextRemainingMs <= 0) {
        window.location.reload();
      }
    };

    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [holdExpiresAt]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const completePurchase = () => {
    fetch(apiUrl('/purchase'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (result) => {
        if (!result.ok) {
          throw new Error('Unable to complete purchase');
        }
        window.location.assign('/completion');
      })
      .catch((error) => {
        console.error('Error completing purchase:', error);
        window.alert('Unable to complete purchase. Please try again.');
    });
  };

  const minutesLeft = Math.floor(remainingMs / MS_PER_MINUTE);
  const secondsLeft = Math.floor((remainingMs % MS_PER_MINUTE) / MS_PER_SECOND);
  const timeLeft = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;

  return (
    <Box>
      <IconWrapper>
        <UnarchiveIcon />
      </IconWrapper>
      <div>
        The box {boxIsFull ? 'is now full with ' : 'contains '}
        <b>{cart.length}</b> {cart.length === 1 ? 'item' : 'items'} <br /> It
        can be shipped anywhere in America in exchange for $20.
      </div>
      <CountdownNotice>
        Checkout timer: <b>{timeLeft}</b> remaining to secure your items.
      </CountdownNotice>

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
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </InputWrapper>
        </div>
      </Flex>
      <Total>
        Total Amount: <b>$20</b>
      </Total>
      {clientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      )}
      <ButtonWrapper>
        <PayButton disabled>Get Package</PayButton>
        {!confirmReset ? (
          <BackButton
            onClick={() => {
              setConfirmReset(true);
            }}
          >
            Delete this and try again
          </BackButton>
        ) : (
          <BackButton
            onClick={() => {
              window.location.reload();
            }}
            danger
          >
            Are you sure?
          </BackButton>
        )}
        <button
          onClick={() => {
            completePurchase();
          }}
        >
          Complete purchase
        </button>
      </ButtonWrapper>
    </Box>
  );
}
