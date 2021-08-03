let db;

// Create a new db request for a "Budget Tracker" database and creates store (on line 12).
const request = indexedDB.open('BudgetTrackerDB', 1);

request.onupgradeneeded = function (e) {
    console.log('Upgrade needed in IndexDB');

    db = e.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('BudgetTrackerStore', { autoIncrement: true });
    }
};

// Gets reference to DB itself, console logs if backend connection is successful and online
request.onsuccess = function (e) {
    console.log('success');

    db = e.target.result;

    if (navigator.online) {
        console.log('Backend Online!');
        checkDatabase();
    }
};

request.onerror = function (e) {
    console.log(e.target.errorCode);
};

const saveRecord = (record) => {
    console.log('Budget Transaction Record Invoked!');

    // Creates a transaction on the "Budget Tracker Store" w/ readwrite access
    const transaction = db.transaction(['BudgetTrackerStore'], 'readwrite');

    // Accesses the Budget Tracker Store itself
    const store = transaction.objectStore('BudgetTrackerStore');

    // Uses the .add method to add record to the Budget Tracker Store
    store.add(record);

};

function checkDatabase() {
    console.log('check db invoked');

    // Open a transaction on the Budget Tracker Store
    let transaction = db.transaction(['BudgetTrackerStore'], 'readwrite');

    // Accesses the Budget Tracker Store object entered (reference to store)
    const store = transaction.objectStore('BudgetTrackerStore');

    // Get all records from Budget Tracker Store and set to a variable
    const getAll = store.getAll();

    // If the request was successful
    getAll.onsuccess = function () {
        // If there are transactions in the Budget Tracker store, they are bulk-added when back online
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    // If our returned response is not empty
                    if (res.length !== 0) {
                        // Open another transaction to BudgetStore with the ability to read and write
                        transaction = db.transaction(['BudgetTrackerStore'], 'readwrite');

                        // Assign the current store to a variable
                        const currentStore = transaction.objectStore('BudgetTrackerStore');

                        // Clear existing entries because our bulk add was successful
                        currentStore.clear();
                        console.log('Clearing store 🧹');
                    }
                });
        }
    };
}

// Listen for app coming back online, referencing back to checkDatabase function, to insert all offline transactions into DB
window.addEventListener('online', checkDatabase);
