import { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import PaymentPage from './PaymentPage';
import LimitReachedPage from './LimitReachedPage';
import styled from 'styled-components';

//itemsForSale
//name
//image

//value
//weight?
//id

//limit = max items or up to 40ish

//randomize array before loading

const Card = styled.div`
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
padding: 20px;
border: 2px solid darkBrown;
background: brown;
border-radius: 4px;

img{
    &:hover{
    transform: scale(1.1);
    }
}
`;

type Item = {
    name: string;
    image: string;
    value: number;
};

const itemsForSale = [
    {
        name: faker.commerce.productName(),
        image: faker.image.avatar(),
        value: Math.floor(Math.random() * 5) + 1,
    },
];

//add 49 more items to itemsForSale

for (let i = 0; i < 49; i++) {
    itemsForSale.push({
        name: faker.commerce.productName(),
        image: faker.image.avatar(),
        value: Math.floor(Math.random() * 5) + 1,
    });
}

const MAX_LIMIT = 35;

const BOX_VALUE = 20;

function Main() {
    const [count, setCount] = useState(0);
    const [cart, setCart] = useState<Item[]>([]);
    const [currItemIndex, setCurrItemIndex] = useState(0);
    const [limitReached, setLimitReached] = useState(false);
    const [isReadyToPay, setIsReadyToPay] = useState(false);
    const handleAddToCart = () => {
        setCart((prevCart) => [...prevCart, itemsForSale[currItemIndex]]);
        setCurrItemIndex((currItemIndex) => currItemIndex + 1);
        setCount((count) => count + 1);
    };

    useEffect(() => {
        if (cart.reduce((acc, item) => acc + item.value, 0) > BOX_VALUE) {
            setIsReadyToPay(true);
        }

        if (count >= MAX_LIMIT || count >= itemsForSale.length) {
            setLimitReached(true);
        }
    }, [cart, count]);

    const Main = () => (
        <>
            <h2>20 Dollar Box</h2>
            <progress
                value={count}
                max={50}
                style={{
                    width: '100%',
                    color: 'red',
                    height: '20px',
                    border: '1px solid black',
                }}
            /><Card>
     
                <div>{itemsForSale[currItemIndex].name}</div>
                <img src={itemsForSale[currItemIndex].image} height={100} width={100} />
       
</Card>
            <div>Want this in your box?</div>
            <button
                onClick={() => {
                    handleAddToCart();
                }}
            >
                {' '}
                Go on then.
            </button>
            <button
                onClick={() => {
                    setCurrItemIndex((currItemIndex) => currItemIndex + 1);
                    setCount((count) => count + 1);
                }}
            >
                {' '}
                Nah.
            </button>
        </>
    );

    if (limitReached) {
        return <LimitReachedPage />;
    }

    if (isReadyToPay) {
        return <PaymentPage />;
    }

    return <Main />;
}

export default Main;
