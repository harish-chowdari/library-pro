import React, { useState, useEffect } from 'react';
import axios from '../../axios/axios';
import Loader from '../../Components/Loader/Loader';
import PopUp from '../../Components/Popups/Popup';
import "./ReservedBooks.css";

const ReservedBooks = () => {
  const [booksReserved, setBooksReserved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [popUpText, setPopUpText] = useState("");
  const userId = localStorage.getItem("userId");

  // Function to calculate days exceeded or remaining
  const daysExceededOrRemaining = (willUseBy) => {
    const currentDate = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const currentTimestamp = new Date(currentDate).getTime();
    const willUseByTimestamp = new Date(willUseBy).getTime();
    const daysDifference = Math.floor((willUseByTimestamp - currentTimestamp) / millisecondsPerDay);
    return daysDifference;
  };

  const displayFineOrRemaining = (days, fine) => {
    // Extract numeric part of fine using regular expression if fine is defined
    const fineAmount = fine?.match(/\d+(\.\d+)?/);

    if (days < 0 && fineAmount) {
      const numberOfDaysExceeded = Math.abs(days);
      const totalFine = parseFloat(fineAmount[0]) * numberOfDaysExceeded;
      // Round totalFine to two decimal places
      const roundedFine = totalFine.toFixed(2);
      return <span style={{ color: "red" }}>  {numberOfDaysExceeded} days exceeded. <br/> Total fine: {roundedFine}$</span>;
    }

    else if (days < 0 && !fineAmount) {
      return <span>Fine Paid</span>;
    }

    else if (days === 0) {
      return <span>Today is the last day to use this book</span>;
    }

    else {
      return <span>{days} days remaining</span>;
    }
  };

  const fetchBooksReserved = async () => {
    try {
      const res = await axios.get(`reserved/books-reserved/${userId}`);
      console.log(res.data.booksReserved, 'res');
      if (res.data.booksReserved) {
        setBooksReserved(res.data.booksReserved);
        setLoading(false);
      } else {
        setPopUpText("No reserved books found.");
        setIsPopUpOpen(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching books reserved:', error);
    }
  };

  useEffect(() => {
    fetchBooksReserved();
  }, [userId]);

  const submitBook = async (bookId) => {
    try {
      setLoading(true);

      // Update the book in the backend
      const updateSubmitStatusResponse = await axios.put('reserved/update-reserved-book', { userId, bookId });

      // Handle response and display pop-up accordingly
      if (updateSubmitStatusResponse.data.updatedReservation) {
        setPopUpText(updateSubmitStatusResponse.data.updatedReservation);
        setIsPopUpOpen(true);
      } else {
        setPopUpText(updateSubmitStatusResponse.data.alreadySubmitted);
        setIsPopUpOpen(true);
      }
      fetchBooksReserved();

    } catch (error) {
      console.error('Error submitting book:', error);
      setPopUpText(error.message);
      setIsPopUpOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-container">
      <div className='history-img'></div>
      <h2>Reserved Books</h2>
      {loading ? (
        <Loader />
      ) : booksReserved ? (
        <div className='history-division'>
          {booksReserved?.length === 0 ? (
            <h2>No reserved books found.</h2>
          ) : (
            <div className='historyitems-format-main history-headings'>
              <h3>Book</h3>
              <h3>Name</h3>
              <h3>Author</h3>
              <h3>Reserved</h3>
              <h3>Use By</h3> 
              <h3>Submit</h3>
              <h3>Days</h3>
            </div>
          )}

          {booksReserved?.map((book, index) => (
            <div className='Main-div' key={index}>
              <div className="historyitems-format-main history-items-format">
                {book ? (
                  <>
                    <img src={book.bookImage} alt={book.bookName} />
                    <p>{book.bookName}</p>
                    <p>{book.authorName}</p>
                  </> 
                )
                :
                ( 
                  <> 
                    <p>Book Image</p>
                    <p>Book Name</p>          
                    <p>Author Name</p>
                  </>
                )}
                <p>{book.createdDate?.slice(0, 10)}</p>
                <p>{book.willUseBy?.slice(0, 10)}</p>
                {book.submitStatus === "Submitting" ? <button style={{cursor:"not-allowed"}}>Requested</button> : <button onClick={() => submitBook(book.bookId)}>Submit</button>}
               
                <div className='book-fine'>
                  <p className='usebyDays'>{displayFineOrRemaining(daysExceededOrRemaining(book.willUseBy), book.fine )}</p>
                </div>
              </div> 
            </div>
          ))} 

        </div>
      ) : (
        <h2>No reserved books found.</h2>
      )}

      <PopUp
        isOpen={isPopUpOpen}
        close={() => setIsPopUpOpen(false)}
        text={popUpText}
      /> 
    </div>
  );
};

export default ReservedBooks;
