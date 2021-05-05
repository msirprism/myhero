//@ts-check
const apiKey = "AIzaSyCFJjmPuUaFII4A159qEKn_dNSK9yGONTI";
const axios = require("axios").default;
/**
 * ### Steps to fetch distance & delivery fee
 * 1. Query merchants from categoryId(if category == 0 or null return all merchants with no categories)
 * 2. Using `Promise.all` to fetch distance per merchant
 * 3. After all merchants have distance from step 2, use `Promise.all` again to fetch delivery fee per merchant
 */

// Example function
const merchantsWithDistance = async ({
  costing = {},
  merchants = [],
  customerCoordinates = {
    latitude: 0,
    longitude: 0,
  },
}) => {
  // if (process.env.NODE_ENV !== 'production') {
  //   const fakeDistance = merchants.map(merchant => {
  //     const rand = Math.floor(Math.random() * 15);
  //     return {
  //       id: merchant.id,
  //       name: merchant.name,
  //       distance: rand,
  //       latitude: merchant.latitude,
  //       longitude: merchant.longitude,
  //       deliveryFee: calculateDeliveryFee(costing, rand)
  //     };
  //   });
  //   return fakeDistance;
  // }
  /// Using Promise to wait all API request for google directions api
  const result = await Promise.all(
    merchants.map(async (merchant) => {
      try {
        const distance = await getDistanceFromCoordinates(customerCoordinates, {
          latitude: parseFloat(merchant.lat),
          longitude: parseFloat(merchant.lng),
        });
        return {
          id: merchant.id,
          name: merchant.name,
          latitude: merchant.lat,
          longitude: merchant.lng,
          distance,
          deliveryFee: calculateDeliveryFee(costing, distance, merchant),
          excessDeliveryFee: calculateExcessDeliveryFee(costing, distance, merchant),
        };
      } catch (error) {
        console.log("error >>> ", error);
      }
    })
  );

  return result;
};

/**
 *
 * @param {Costing} costing
 * @param {Number} distance
 * @param {Merchant} merchant
 */
const calculateDeliveryFee = (costing = {}, distance = 0, merchant = { trendingFlatRate: 0, trendingAppFee: 0 },) => {
  const deliveryFee = costing.firstKmCost + costing.appFee;
  if (distance <= 2 && !merchant.isTrending) {
    return deliveryFee;
  }
  let excessKM = 0;
  excessKM = distance - 2;
  if (excessKM < 0) {
    excessKM = 0;
  }

  let kmMultiples = excessKM / .5;
  if (kmMultiples % 1 > 0) {
    kmMultiples -= (kmMultiples % 1);
    kmMultiples += 1;
  }

  let excessMeterFee = costing.excessPerKmCost;

  // const integerPart = Math.trunc(excessKM);
  // const decimalPart = excessKM % 1;
  // const excessKmFee = (integerPart / 0.5) * costing.excessPerKmCost;


  // if (decimalPart > 0) {
  //   const decimalFixed = decimalPart / 0.5;

  //   if (decimalFixed >= 0.5) {
  //     excessMeterFee *= 2;
  //   }
  // }

  const excessFeeTotal = kmMultiples * excessMeterFee;

  if (merchant.isTrending) {

    /**
     * flat rate and app fee are non-nullable from db.
     * so the default values are always 0.
     * somehow, JS treat it as String instead of integer.
     * for Typescript users, ignore this error for now.
     */
    const flatRate = parseFloat(merchant.trendingFlatRate);
    const appFee = parseFloat(merchant.trendingAppFee);

    const merchantTrendingFee = flatRate + appFee
    if (distance < 2) {
      console.log("Free Delivery: Less than 2KM")
      return merchantTrendingFee;
    }

    console.log("Merchant Trending Delivery Fee: ", merchantTrendingFee);
    console.log("Excess Fee", excessFeeTotal);
    console.log("Distance: ", distance);
    console.log("Excess KM: ", excessKM)
    return excessFeeTotal + merchantTrendingFee;
  }
  const total = deliveryFee + excessFeeTotal;
  return total;
};
/**
THIS IS JUST COPY-PAST OF calculateDeliveryFee function above just to get things done. There must be a more elegant source-code to this:
**/
const calculateExcessDeliveryFee = (costing = {}, distance = 0, merchant = { trendingFlatRate: 0, trendingAppFee: 0 },) => {
  var excessDeliveryFee = 0;
  
  const deliveryFee = costing.firstKmCost + costing.appFee;
  if (distance <= 2 && !merchant.isTrending) {
    return excessDeliveryFee;
  }
  let excessKM = 0;
  excessKM = distance - 2;
  if (excessKM < 0) {
    excessKM = 0;
  }

  let kmMultiples = excessKM / .5;
  if (kmMultiples % 1 > 0) {
    kmMultiples -= (kmMultiples % 1);
    kmMultiples += 1;
  }

  let excessMeterFee = costing.excessPerKmCost;

  const excessFeeTotal = kmMultiples * excessMeterFee;
  excessDeliveryFee = excessFeeTotal;
  
  return excessDeliveryFee;
};
/**
 *
 * @param {PointLatLng=} customerLatLng
 * @param {PointLatLng=} merchantLatLng
 */
const getDistanceFromCoordinates = async (customerLatLng, merchantLatLng) => {
  try {
    const distance = await getRouteBetweenCoordinates(
      customerLatLng,
      merchantLatLng
    );
    return distance;
  } catch (error) {
    console.log("error >>> ", error);
  }
};

// for more info visit https://developers.google.com/maps/documentation/directions/overview
/**
 * @param {PointLatLng=} customerCoordinates
 * @param {PointLatLng=} merchantCoordinates
 * @returns {Promise<Number>}
 */
const getRouteBetweenCoordinates = async (
  customerCoordinates,
  merchantCoordinates
) => {
  const link = `https://maps.googleapis.com/maps/api/directions/json?`;
  const mode = "mode=driving";
  const origin = `origin=${customerCoordinates.latitude},${customerCoordinates.longitude}`;
  const destination = `destination=${merchantCoordinates.latitude},${merchantCoordinates.longitude}`;
  const avoidHighways = `avoidHighways=false`;
  const avoidFerries = `avoidFerries=true`;
  const avoidTolls = `avoidTolls=true`;
  const optimizeWaypoint = `optimizeWaypoint=false`;
  const key = `key=${apiKey}`;
  const options = `${avoidHighways}&${avoidFerries}&${avoidTolls}&${optimizeWaypoint}`;
  const url = `${link}&${origin}&${destination}&${mode}&${options}&${key}`;
  try {
    const { data } = await axios.get(url);
    let distance = 0;
    if (data.routes != null && data.routes.length != 0) {
      const routeLegs = data.routes[0].legs;
      const routeDistance = routeLegs[0].distance;
      const routeDistanceValue = (routeDistance || {}).value || 0; // These fields may be absent if the distance is unknown.
      distance = routeDistanceValue / 1000; // meters to kilometers conversion
      console.log("distance >>> ", distance);
    } else {
      throw Error(data.error_message);
    }

    return distance;
  } catch (error) {
    console.log("error >>> ", error);
  }
};

module.exports = {
  merchantsWithDistance,
  calculateDeliveryFee,
};

/**
 * @typedef {Object} PointLatLng
 * @property {Number} latitude
 * @property {Number} longitude
 */
/**
 * @typedef {Object} Costing
 * @property {number=} appFee
 * @property {number=} firstKmCost
 * @property {number=} excessPerKmCost
 */
/**
 * @typedef {Object} Merchant
 * @property {number=} trendingFlatRate
 * @property {number=} trendingAppFee
 * @property {Boolean=} isTrending
 */
// datasets
const merchant = {
  trendingFlatRate: 5,
  trendingAppFee: 5,
  isTrending: true,
}
const costing = {
  firstKmCost: 40,
  excessPerKmCost: 9,
  appFee: 10,
}

const delivery = calculateDeliveryFee(costing, 2.68, merchant);
console.log("Delivery Fee", delivery);
