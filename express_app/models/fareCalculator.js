function calculateFare(dist, locality) {
    const bf = 40; // Set the base fare to a constant value of 40
    let total_fare = 0;
    let cpk = 0; // Cost per kilometer
    let cost = 0;

     // Set the cost per kilometer based on the distance
    if (dist <= 5) {
      cpk = 10;
      cost = cpk*dist;
    } else if (dist>5 && dist <= 10) {
      cpk = 9;
      cost = 5*10 + cpk*(dist-5);
    } else if (dist>10 && dist <= 15) {
      cpk = 8;
      cost = 5*10 + 5*9 + cpk*(dist-10);
    } else {
      cpk = 7;
      cost = 5*10 + 5*9 + 5*8 + cpk*(dist-15);
    }
  
    // Calculate the total fare based on the distance and cost per kilometer
    total_fare = bf + cost;

    // Calculate the price range based on a percentage of the calculated fare
    const upper_limit = total_fare * 1.3; // Set the upper limit to 130% of the calculated fare
    const price_range = [total_fare, upper_limit];
  
    // Return the optimal cost range as an array
    return price_range;
  }
    

  
  module.exports = {
    calculateFare
  };