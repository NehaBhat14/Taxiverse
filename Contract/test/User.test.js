// Import the User contract artifact
const User = artifacts.require("User");

// Start a test suite using Mocha
contract("User", function(accounts) {

  // Define a helper function to create a new user
  async function createUser(name, username, phoneNumber, vehicle, vehicleNo, category, password, key) {
    const user = await User.new();
    await user.set(name, username, phoneNumber, vehicle, vehicleNo, category, password, key);
    return user;
  }

  // Define a test case for the set and get functions
  it("should set and get user details", async function() {
    const name = "John Doe";
    const username = "johndoe";
    const phoneNumber = "1234567890";
    const vehicle = "Car";
    const vehicleNo = "ABC123";
    const category = "Premium";
    const password = "password123";
    const key = "privatekey123";

    // Create a new user
    const user = await createUser(name, username, phoneNumber, vehicle, vehicleNo, category, password, key);

    // Retrieve the user details
    const userDetails = await user.get(username);

    // Assert that the details are correct
    assert.equal(userDetails[0], key);
    assert.equal(userDetails[1], phoneNumber);
    assert.equal(userDetails[2], vehicle);
    assert.equal(userDetails[3], vehicleNo);
    assert.equal(userDetails[4], category);
    assert.equal(userDetails[5], name);
    assert.equal(userDetails[6], password);
  });

  // Define a test case for the setFinalBid and getFinalBid functions
  it("should set and get final bids", async function() {
    const driver = "John Smith";
    const rider = "johndoe";

    // Create a new user
    const user = await createUser("John Doe", rider, "1234567890", "Car", "ABC123", "Premium", "password123", "privatekey123");

    // Add a final bid for the user
    await user.setFinalBid(driver, rider);

    // Retrieve the final bids for the user
    const numFinalBids = await user.getFinalBid(rider);

    // Assert that the final bid was added successfully
    assert.equal(numFinalBids, 1);
  });

});


/*
This test script defines two test cases: one for the set and get functions, and one for the setFinalBid and getFinalBid functions.

The first test case creates a new user, sets their details using the set function, and then retrieves their details using the get function. It then uses the assert function to check that the details retrieved are correct.

The second test case creates a new user, adds a final bid for them using the setFinalBid function, and then retrieves the number of final bids using the getFinalBid function. It then uses the assert function to check that the number of final bids retrieved is correct.

*/