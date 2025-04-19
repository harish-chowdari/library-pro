import React, { useEffect, useState } from 'react';
import axios from '../../axios/axios';

const CartItem = ({ item, removeFromCart, reserveBook, willUseBy, handleDateChange, reservedBooks }) => {
  const [isOutOfStock, setIsOutOfStock] = useState(false); // State to track if the book is out of stock
  const [isBookReserved, setIsBookReserved] = useState(false); // State to track if the book is already reserved by the user
  const [availableDate, setAvailableDate] = useState(null); // New state for available date

  const userId = localStorage.getItem("userId");

  console.log(item,'item');

  useEffect(() => {
    const fetchReservationData = async () => {
      try {
        // Fetch reservation count for the current book ID
        const res = await axios.get(`reserved/book-copies-count/${item?.id}`);
        const resCount = res.data.reservedCount;

        // Fetch the total number of copies of the book from your backend API
        const bookResponse = await axios.get(`librarian/getbook/${item?.id}`);
        const numberOfCopies = bookResponse.data.numberOfCopies;

        // Check if the reserved count equals the number of copies to determine if the book is out of stock
        setIsOutOfStock(resCount >= numberOfCopies);

        // Check if the book is already reserved by the user
        const isReserved = await checkReservation(item?.id);
        setIsBookReserved(isReserved);


        // const nearestDateRes = await axios.get(
        //   `reserved/nearest-will-use-by/${item?.id}`
        // );
        const nearestDate = nearestDateRes.data.nearestWillUseBy;
        
        if (nearestDate) {
          setAvailableDate(nearestDate); // Set date if it's valid
        }

      } catch (error) {
        console.error('Error fetching reservation data:', error);
      }
    };

    // Fetch reservation data
    fetchReservationData();
  }, [item?.id]);

  // Function to check if the book is reserved by the user
  const checkReservation = async (bookId) => {
    try {
      const res = await axios.get(`reserved/books-reserved/${userId}`);
      if (res?.data?.booksReserved && res?.data?.booksReserved?.items) {
        const reservedItems = res?.data?.booksReserved?.items;
        // Check if the book ID exists in the reserved items array
        return reservedItems.some(item => item?.id === bookId);
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error fetching reserved books:', error);
      return false;
    }
  };

  return (
    <div>
      {item && (
        <div className="cartitems-format-main cart-items-format">
          {item?.bookImage && <img src={item.bookImage} alt={item?.bookName} />}
          {item?.bookName && <p>{item.bookName}</p>}
          {item?.authorName && <p>{item.authorName}</p>}
          <button className="remove-button" onClick={() => removeFromCart(item?.id)}>Remove</button>

          {/* Check if the book is already reserved */}
          {isBookReserved ? (
            <p style={{color:"green"}}>Reserved</p>
          ) : (
            // Check if the book is out of stock
            isOutOfStock ? (
              <p>Not Available</p>
            ) : (

                <button className="reserve-button" onClick={() => reserveBook(item?.id, item?.fine)}>Reserve</button>

              // Display input field for date if not reserved or out of stock
            )
          )}
 
          {isOutOfStock || isBookReserved ? 
            <p>Out of Stock</p>
            :              
            <input className='use-by-cart' type='date' value={willUseBy || ''} onChange={handleDateChange} required />
}

        </div> 
      )}
      <hr className='bottom-hr-cart' />
    </div>
  );
};

export default CartItem;
