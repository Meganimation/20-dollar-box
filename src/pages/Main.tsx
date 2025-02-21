import { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { Item } from '../types';
import PaymentPage from './PaymentPage';
import LimitReachedPage from './LimitReachedPage';
import styled, { keyframes } from 'styled-components';
import Image from '../assets/image.png';
import BackgroundImage from '../assets/paper-background.jpg';
import { itemsForSale } from '../data/Data';

//itemsForSale
//name
//image

//value
//weight?
//id

//limit = max items or up to 40ish

//randomize array before loading

const ProgressBar = styled.progress<{ color: string }>`
  width: 55%;
  height: 50px;
  accent-color: ${(props) => props.color};
`;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;
  align-items: center;
  justify-content: center;
  background: white;
  color: black;
  overflow: hidden;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  align-items: center;
  height: 100%;
  width: 75%;
`;

const Flex = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 20px;
  position: absolute;
  bottom: 20px;
`;

const FadeIn = keyframes`
    from {
        opacity: 0;

    }
    to {
        opacity: 1;
    }
    `;

const FadeLeft = keyframes`
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100%);
    }
    `;
const FadeRight = keyframes`
    from {
        opacity: 1;
        transform: translateX(0);   
    }
    to {
        opacity: 0;
        transform: translateX(-200%);
    }
    `;

const FadeUp = keyframes`
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-100%);
    }
    `;

const FadeDown = keyframes`
    from {
        opacity: 0;
        transform: translateY(100%);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
    `;

const Card = styled.div<{ animate: boolean; animateDirection: string }>`
  display: flex;
  background-image: url(${BackgroundImage});
  background-size: cover;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0px;

  min-height: 450px;
  height: 50%;
  border-radius: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(5px);
  width: 40%;

  animation: ${(props) =>
      props.animateDirection === 'none'
        ? FadeDown
        : props.animateDirection === 'left'
        ? FadeLeft
        : FadeRight}
    0.5s;
`;

const ScaledImage = styled.div`
  img {
    width: 300px;
    height: 100%;
  transition: transform 0.3s ease;

  animation: ${FadeIn} 3.5s;
  animation-fill-mode: forwards
  animation-delay: 2s;   
  }
 
`;

const Question = styled.div`
  color: black;
  font-size: 1.5rem;
  text-align: center;
`;

const CardTitle = styled.div`
  color: black;
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Button = styled.button`
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.1);
  }
`;

//add 49 more items to itemsForSale

// for (let i = 0; i < 29; i++) {
//   itemsForSale.push({
//     name: faker.commerce.productName(),
//     image: faker.image.avatar(),
//     value: Math.floor(Math.random() * 5) + 1,
//   });
// }
const SHIPPING_COSTS = 7;
const MAX_LIMIT = Math.min(20, itemsForSale.length - 1);

const BOX_VALUE = 20 - SHIPPING_COSTS;

itemsForSale.sort(() => Math.random() - 0.5);

function Main() {
  const [count, setCount] = useState(0);
  const [cart, setCart] = useState<Item[]>([]);
  const [currItemIndex, setCurrItemIndex] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [isReadyToPay, setIsReadyToPay] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [animateDirection, setAnimateDirection] = useState('none');
  const [boxIsFull, setBoxIsFull] = useState(false);
  const handleAddToCart = () => {
    setAnimateDirection('right');
    setCart((prevCart) => [...prevCart, itemsForSale[currItemIndex]]);
    setCurrItemIndex((currItemIndex) => currItemIndex + 1);
    setCount((count) => count + 1);
  };

  useEffect(() => {
    if (cart.reduce((acc, item) => acc + item.value, 0) > BOX_VALUE) {
      setIsReadyToPay(true);
      setBoxIsFull(true);
    }

    if (count >= MAX_LIMIT || count >= itemsForSale.length) {
      setLimitReached(true);
    }
  }, [cart, count]);

  const Main = () => (
    <MainWrapper>
      <div>20DollarPackage.com</div>
      <ProgressBar color="red" value={count} max={MAX_LIMIT} />
      <ProgressBar
        color="green"
        value={cart.reduce((acc, item) => acc + item.value, 0)}
        max={BOX_VALUE + 1}
      />
      <CardTitle>
        It's a <br />
        <b> {itemsForSale[currItemIndex].name}</b>
      </CardTitle>
      <CardWrapper>
        <Card animate={animate} animateDirection={animateDirection}>
          {/* <div>{itemsForSale[currItemIndex].value}</div> */}
          <ScaledImage>
            <img src={itemsForSale[currItemIndex].image} />
          </ScaledImage>
        </Card>
        <Question>
          Do you want this <b>{`${itemsForSale[currItemIndex].name}`}</b> in
          your box?
        </Question>
        <Flex>
          {' '}
          <Button
            onClick={() => {
              handleAddToCart();
            }}
          >
            {' '}
            Go on then.
          </Button>
          <Button
            onClick={() => {
              setAnimateDirection('left');
              setCurrItemIndex((currItemIndex) => currItemIndex + 1);
              setCount((count) => count + 1);
            }}
          >
            {' '}
            Nah.
          </Button>
        </Flex>
      </CardWrapper>
    </MainWrapper>
  );

  if (isReadyToPay) {
    return (
      <MainWrapper>
        {' '}
        <PaymentPage cart={cart} boxIsFull={boxIsFull} />
      </MainWrapper>
    );
  }

  if (limitReached) {
    return (
      <MainWrapper>
        <LimitReachedPage
          cartIsEmpty={cart.length === 0}
          setIsReadyToPay={setIsReadyToPay}
        />
      </MainWrapper>
    );
  }

  return <Main />;
}

export default Main;
