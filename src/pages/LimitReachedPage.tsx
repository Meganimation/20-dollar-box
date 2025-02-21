import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  background-color: black;
  color: white;
  padding: 10px;
  border-radius: 5px;
  border: none;
  width: 100%;
  font-size: 1rem;
`;

const TextWrapper = styled.div`
  font-size: 1.75rem;
  padding: 10px;
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

type LimitReachedPageProps = {
  setIsReadyToPay: (isReadyToPay: boolean) => void;
  cartIsEmpty: boolean;
};

export default function LimitReachedPage({
  setIsReadyToPay,
  cartIsEmpty,
}: LimitReachedPageProps) {
  return (
    <div>
      {' '}
      <TextWrapper>
        {cartIsEmpty
          ? "You didn't put anything in the box this time."
          : "That's not enough items to fill up the box."}
      </TextWrapper>
      <ButtonWrapper>
        <Button
          onClick={() => {
            window.location.reload();
          }}
        >
          {' '}
          Try again
        </Button>
        {!cartIsEmpty && (
          <Button
            onClick={() => {
              setIsReadyToPay(true);
            }}
          >
            {' '}
            Ship Anyway
          </Button>
        )}
      </ButtonWrapper>
    </div>
  );
}
