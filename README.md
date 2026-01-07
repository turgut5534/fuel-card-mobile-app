Fuel Card Manager App
=====================

A **React Native +Expo** mobile application to manage personal fuel cards, track balances, and record transactions. This app interacts with custom APIs from my backend project to fetch and update data.

Features
--------

*   **Card Management**:
    
    *   Add, view, and manage multiple fuel cards.
        
    *   View card balances on the main screen.
        
*   **Transactions**:
    
    *   Top up or spend funds from a selected card.
        
    *   Auto-calculate fuel price per liter based on the last transaction.
        
    *   Save transactions with details like amount, fuel price, and liters.
        
*   **Transaction History**:
    
    *   View all past transactions.
        
    *   Filter transactions by type: “Top Ups” or “Spents”.
        
*   **Analytics**:
    
    *   View total amounts of transactions.
        
    *   Filter totals by specific date ranges.


 Installation
------------

### Prerequisites

*   Node.js (v14+)
    
*   React Native CLI
    
*   Android Studio / Xcode for device emulation

## Steps

1. Clone the repository:

```
git clone https://github.com/turgut5534/fuel-card-mobile-app.git
cd fuel-card-manager
```

2. Install dependencies:
```
npm install
```

3. Start the Metro bundler
```
npx expo start
```
```
```

Usage
-----

1.  **Add Fuel Cards**: Navigate to the main screen and add your fuel cards.
    
2.  **View Balances**: Check the balance of each card at a glance.
    
3.  **Top Up / Spend**:
    
    *   Select a card.
        
    *   Enter the amount to top up or spend.
        
    *   Fuel price will appear based on the last transaction.
        
    *   Hit **Top Up** or **Spend** to update the balance and save the transaction.
        
4.  **Transaction History & Filters**:
    
    *   Navigate to the transactions screen.
        
    *   Filter by “Top Ups” or “Spents”.
        
    *   View transaction totals and filter by date ranges.
        

Architecture / Technologies
---------------------------

*   **Frontend**: React Native
    
*   **State Management**: React Hooks / Context API (or Redux if applicable)
    
*   **API Integration**: Fetches data from custom backend APIs
    
*   **Data Storage**: Remote via API (or optionally AsyncStorage for offline cache)
    
*   **Navigation**: React Navigation
    

Future Improvements
-------------------

*   Offline mode with local caching.
    
*   Push notifications for low balances.
    
*   Multi-currency support.
    
*   Charts for fuel consumption trends.
    

Contributing
------------

This project is primarily for personal use, but contributions are welcome via pull requests.

License
-------

MIT License © Turgut Salgın

