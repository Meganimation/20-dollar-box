import { useState, useEffect } from 'react';
import { Item } from "../types/types";
import PaymentPage from "./PaymentPage";
import LimitReachedPage from "./LimitReachedPage";
import styled, { keyframes } from "styled-components";
import BackgroundImage from "../assets/paper-background.jpg";
import { apiUrl } from "../lib/api";

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

const Card = styled.div<{ animateDirection: string }>`
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
      props.animateDirection === "none"
        ? FadeDown
        : props.animateDirection === "left"
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
const BOX_VALUE = 20 - SHIPPING_COSTS;
const CART_SESSION_KEY = 'cartSessionId';

const getOrCreateCartSessionId = () => {
  const existingSessionId = window.localStorage.getItem(CART_SESSION_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(CART_SESSION_KEY, newSessionId);
  return newSessionId;
};

function Main() {
  const [sessionId] = useState(getOrCreateCartSessionId);
  const [count, setCount] = useState(0);
  const [cart, setCart] = useState<Item[]>([]);
  const [currItemIndex, setCurrItemIndex] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [isReadyToPay, setIsReadyToPay] = useState(false);
  const [animateDirection, setAnimateDirection] = useState("none");
  const [boxIsFull, setBoxIsFull] = useState(false);
  const [isCompletionPage, setIsCompletionPage] = useState(false);
  const [itemsForSale, setItemsForSale] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch items from the backend
    fetch(apiUrl("/store"))
      .then((response) => response.json())
      .then((data) => {
        // Randomize the array
        const randomizedData = [...data].sort(() => Math.random() - 0.5);
        setItemsForSale(randomizedData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setIsLoading(false);
      });
  }, []);

  const MAX_LIMIT = !itemsForSale.length
    ? 1
    : Math.min(20, itemsForSale.length - 1);

  const handleAddToCart = async () => {
    const currentItem = itemsForSale[currItemIndex];
    if (!currentItem) {
      return;
    }

    try {
      const response = await fetch(apiUrl('/reserve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: currentItem.id, sessionId }),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 409) {
          setItemsForSale((previousItems) =>
            previousItems.filter((item) => item.id !== currentItem.id)
          );
        }
        return;
      }

      setAnimateDirection("right");
      setCart((prevCart) => [...prevCart, currentItem]);
      setCurrItemIndex((currItemIndex) => currItemIndex + 1);
      setCount((count) => count + 1);
    } catch (error) {
      console.error('Error reserving item:', error);
    }
  };

  useEffect(() => {
    if (cart.reduce((acc, item) => acc + item.value, 0) > BOX_VALUE) {
      setIsReadyToPay(true);
      setBoxIsFull(true);
    }
    if (itemsForSale.length > 0) {
      if (count >= MAX_LIMIT || count >= itemsForSale.length) {
        setLimitReached(true);
      }
    }
  }, [MAX_LIMIT, cart, count, itemsForSale]);

  useEffect(() => {
    if (window.location.pathname === "/completion") {
      setIsCompletionPage(true);
    }
  }, []);

  if (isLoading) {
    return <MainWrapper>Loading items...</MainWrapper>;
  }

  if (isCompletionPage) {
    return <MainWrapper>Your payment is successful!</MainWrapper>;
  }

  if (itemsForSale.length === 0) {
    return <MainWrapper>No items available</MainWrapper>;
  }

  const currentItem = itemsForSale[currItemIndex];
  if (!currentItem) {
    return <MainWrapper>No items available</MainWrapper>;
  }

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
        <b> {currentItem.name}</b>
      </CardTitle>
      <CardWrapper>
        <Card animateDirection={animateDirection}>
          <ScaledImage>
            <img
              src={apiUrl(currentItem.image)}
            />
          </ScaledImage>
        </Card>
        <Question>
          Do you want this <b>{`${currentItem.name}`}</b> in
          your box?
        </Question>
        <Flex>
          <Button onClick={handleAddToCart}>Go on then.</Button>
          <Button
            onClick={() => {
              setAnimateDirection("left");
              setCurrItemIndex((currItemIndex) => currItemIndex + 1);
              setCount((count) => count + 1);
            }}
          >
            Nah.
          </Button>
        </Flex>
      </CardWrapper>
    </MainWrapper>
  );

  if (isReadyToPay) {
    return (
      <MainWrapper>
        <PaymentPage cart={cart} boxIsFull={boxIsFull} sessionId={sessionId} />
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
