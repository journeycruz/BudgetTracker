const DB = "budget";

let db;
const request = indexedDB.open(DB, 1);

// function for creating new storage
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore("pending", {
        autoIncrement: true
    });
};
request.onsuccess = function (event) {
    // update gloabal db
    db = event.target.result;
    // check if db is online
    if (navigator.onLine) {
        checkDatabase();
    }
};
// if there is an error log it into the console
request.onerror = (event) => {
    console.log("ERROR: " + event.target.errorCode);
};

// saving a new transaction to db
function saveRecord(record) {
    // create a new transaction in the db created earlier
    const transaction = db.transaction(["pending"], "readwrite");
    // get the data currently stored in the db
    const store = transaction.objectStore("pending");
    // use .add to add the new record to the store
    store.add(record);
}

// recieving transactions from db
function checkDatabase(cb) {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    // retrieve all records
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                .then(response => response.json())
                .then(() => {
                    // if successful, clear stored data.
                    const transaction = db.transaction(["pending"], "readwrite");
                    const store = transaction.objectStore("pending");
                    store.clear();
                });
        }
    };
}

// enable browser window to identify when application is back online
window.addEventListener("online", () => {
    checkDatabase()
});
