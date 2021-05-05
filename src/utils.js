const jwt = require('jsonwebtoken');
const APP_SECRET = 'GraphQL-is-aw3some';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const moment = require('moment-timezone');
const Quote = require("inspirational-quotes");
const axios = require('axios').default;
const zeroPad = (num, places) => String(num).padStart(places, '0');
const dotenv = require("dotenv");
dotenv.config({ path: "../prisma/.env" });

function getUserId(context) {
  const Authorization = context.request.get('Authorization')
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '')
    const { userId } = jwt.verify(token, APP_SECRET)
    return userId
  }

  throw new Error('Not authenticated')
}

function withPesoSign(price) {
  var withPesoSymbol = new Intl.NumberFormat('en-ph', { style: 'currency', currency: 'PHP' }).format(price);
  var result = withPesoSymbol.replace("PHP", "₱");

  return result;
}
function withComma(num) {
  return num.toLocaleString();
}
/**
 * @type Array<string> 
 * Stores the logs to prevent duplicate error.
 * Nakaka-irita lang na lumalabas ang pare-parehong error sa slack.
 */
const memoize = [];
async function insertErrorLog(args) {
  const errorLog = await prisma.errorLog.create({
    data: {
      ...args,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow()
    }

  });
  if (args && (process.env.APP_ENV == 'live' || process.env.APP_ENV == 'uat')) {

    const data = typeof args === 'object' ? JSON.stringify(args) : args;
    /**
     * Clear in-memory error logs to free up RAM.
     */
    if (memoize.length >= 50) {
      memoize.splice(0, memoize.length);
    }
    /**
     * Find the matching value in the array.
     * using `.match` will match the regex value and not the whole value.
     */
    const foundItem = memoize.find(item => item === data);
    if (foundItem) {
      return;
    }
    memoize.push(data);
    const codeFormat = `\`\`\`${data}\`\`\``;
    const sendSlackErrorMessage = await axios.post("https://hooks.slack.com/services/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", {
      "text": `ENV: ${process.env.APP_ENV} \n ${codeFormat}`,
    });
    console.log(sendSlackErrorMessage);
  }
  if (!errorLog) {
    throw new Error("Unable to insert new error in database.");
  }

  return errorLog;
}

function getPHDateTimeNow() {
  var dateTimeToday = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
  var phDateTimeNow = new Date(dateTimeToday);

  return phDateTimeNow;
}

function getWordsOfWisdom() {
  var dateTimeToday = getPHDateTimeNow();
  var wordsOfWisdom = '"' + Quote.getRandomQuote() + '" ' + dateTimeToday;

  return wordsOfWisdom;
}

/**
Format of returned string: ABC-123 (First 3 capital letters, hyphen and 3-digit numbers)
Currently, we can manage 999 active heroes since we are using 3 digits in our hero code format
@uniqueNumber: can be the Integer Primary Key of hero table or any unique Id. If 0, generate random number
@letterNumlength: number of random letters and numbers you want to generate
**/
function generateHeroCode(uniqueNumber = 0, letterNumLength = 3) {
  var letterResult = '';
  var numResult = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const lettersLength = characters.length;
  const numbersLength = numbers.length;

  if (uniqueNumber) {
    numResult = zeroPad(uniqueNumber, letterNumLength);
  }

  for (var i = 0; i < letterNumLength; i++) {
    letterResult += characters.charAt(Math.floor(Math.random() * lettersLength));

    if (!uniqueNumber) {
      numResult += numbers.charAt(Math.floor(Math.random() * numbersLength));
    }
  }

  return `${letterResult}-${numResult}`;
}

async function authorizeMobile(context) {
  var token = context.request.get("JWT_MOBILE") ? context.request.get("JWT_MOBILE") : "";

  try {
    switch (process.env.APP_ENV) {
      case 'live':
        verifiedToken = jwt.verify(token, process.env.JWT_SECRET_LIVE_MOBILE);
        console.log("verified token (live) >>> ", verifiedToken);
        break;
      case 'uat':
        verifiedToken = jwt.verify(token, process.env.JWT_SECRET_UAT_MOBILE);
        console.log("verified token (uat) >>> ", verifiedToken);
        break;
      case 'local':
        verifiedToken = jwt.verify(token, process.env.JWT_SECRET_LOCAL_MOBILE);
        console.log("verified token (dev) >>> ", verifiedToken);
        break;
      default:
        // return new AuthenticationError("Not authorised");
        var errorDetails = process.env.APP_ENV + " is not a valid environment variable.";
        console.log(errorDetails);
        var error = { details: errorDetails, type: "Q", functionName: "authorizeMobile" };
        await insertErrorLog(error);
        throw new Error(errorDetails);
    }
  } catch (e) {
    //This is good if somebody tries to use our queries/mutation with wrong token
    var queryMutationVars = [];
    if (context.request.body.variables !== undefined) {
      Object.entries(
        context.request.body.variables
      ).forEach(([key, value]) =>
        queryMutationVars.push(key.toString() + ":" + value.toString())
      );
    }

    var errorDetails = "ALERT!!! SOMEBODY IS TRYING TO USE A MUTATION EXCLUSIVELY FOR MOBILE APP! VAR: (" + JSON.stringify(queryMutationVars) + ")" +
      " -> AUTHORIZATION: " + context.request.get("Authorization") +
      " -> FUNCTION: " + context.request.body.query.toString();
    console.log(errorDetails);
    var error = { details: errorDetails, type: "Q", functionName: "hack" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
}

async function authorize(context) {
  var token = context.request.get("Authorization") ? context.request.get("Authorization") : "";

  try {
    switch (process.env.APP_ENV) {
      case 'live':
        verifiedToken = jwt.verify(token, process.env.JWT_SECRET_LIVE);
        console.log("verified token (live) >>> ", verifiedToken);
        break;
      case 'uat':
        verifiedToken = jwt.verify(token, process.env.JWT_SECRET_UAT);
        console.log("verified token (uat) >>> ", verifiedToken);
        break;
      case 'local':
        verifiedToken = jwt.verify(token, process.env.JWT_SECRET_LOCAL);
        console.log("verified token (dev) >>> ", verifiedToken);
        break;
      default:
        // return new AuthenticationError("Not authorised");
        var errorDetails = process.env.APP_ENV + " is not a valid environment variable.";
        console.log(errorDetails);
        var error = { details: errorDetails, type: "Q", functionName: "authorize" };
        await insertErrorLog(error);
        throw new Error(errorDetails);
    }
  } catch (e) {
    //This is good if somebody tries to use our queries/mutation with wrong token
    var queryMutationVars = [];
    if (context.request.body.variables !== undefined) {
      Object.entries(
        context.request.body.variables
      ).forEach(([key, value]) =>
        queryMutationVars.push(key.toString() + ":" + value.toString())
      );
    }

    var errorDetails = "ALERT!!! SOMEBODY IS TRYING TO USE OUR GraphQL Query/Mutation! VAR: (" + queryMutationVars.toString() + ")" +
      " -> AUTHORIZATION: " + context.request.get("Authorization") +
      " -> FUNCTION: " + context.request.body.query.toString();
    console.log(errorDetails);
    var error = { details: errorDetails, type: "Q", functionName: "hack" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
}

function getPushNotificationContent(args) {
  var content = '';

  if (args.userType == 'merchant') {
    switch (args.status) {
      case 1:
        content = 'Hey there ALLY! 🦸‍♂️ You have a new mission from Order #' + args.id;
        break;
      case 8:
        content = 'Hey there ALLY! 🦸‍♂️ Customer did not show in Order #' + args.id;
        break;
      case 9:
        content = 'Hey there ALLY! 🦸‍♂️ Order #' + args.id + ' has been cancelled by our customer.';
        break;
      default:
        content;
    }
  } else if (args.userType == 'rider') {
    switch (args.status) {
      case 1:
        content = 'Hey there HERO! 🦸‍♂️ Customer just confirms the Order #' + args.id + '. You have a new mission';
        break;
      case 2:
        content = 'Hey there HERO! 🦸‍♂️ Our merchant ally just confirms the Order #' + args.id + '. You have a new mission';
        break;
      case 9:
        content = 'Hey there HERO! 🦸‍♂️ Order #' + args.id + ' has been cancelled by our customer.';
        break;
      case 10:
        content = 'Hey there HERO! 🦸‍♂️ Order #' + args.id + ' has been cancelled by our merchant ally.';
        break;
      case 12:
        content = 'Hey there HERO! 🦸‍♂️ Order #' + args.id + ' has been transferred to you.';
        break;
      default:
        content;
    }
  } else if (args.userType == 'customer') {
    switch (args.status) {
      case 2:
        content = 'Hey there! Heroes are now preparing your Order #' + args.id + ' 🔥';
        break;
      case 3:
        content = 'Order #' + args.id + ' is now preparing by our merchant ally 🔥';
        break;
      case 4:
        content = 'Order #' + args.id + ' has been prepared 🔥';
        break;
      case 5:
        content = 'Brace yourself, a HERO is coming your way with your Order #' + args.id + ' 🔥';
        break;
      case 6:
        content = 'Our HERO has just arrived with your Order #' + args.id + '. Meet your hero outside 🔥';
        break;
      case 10:
        content = 'Hey there! Order #' + args.id + ' has been cancelled by our merchant ally.';
        break;
      default:
        content;
    }
  } else {
    content = 'user type ' + args.userType + ' does not exists';
  }

  return content;
}

function deductDeliveryFeeFromMinSpend(myHeroShare = 0, deliveryFee = 0, minSpend = 0, orderTotal = 0, costing, merchant) {
  if (merchant.isTrending) {
    return parseFloat(deliveryFee);    
  } else {
    if (!myHeroShare || !minSpend) {
      return parseFloat(deliveryFee);
    }

    return parseFloat(deliveryFee);
  }
}

function calculateAppFee(merchant, costing, orderTotal){
  if (!merchant.myHeroShare || !merchant.minimumSpend) {
    return parseFloat(costing.appFee);
  }

  if (orderTotal >= merchant.minimumSpend) {
    return 0;
  } else {
    return parseFloat(costing.appFee);
  }
}

function calculateFreeDeliveryCost(merchant, costing, orderTotal) {
  if (!merchant.myHeroShare || !merchant.minimumSpend) {
    return 0;
  }

  if (orderTotal >= merchant.minimumSpend) {
    var deductDeliveryFee = parseFloat(costing.firstKmCost) + parseFloat(costing.appFee);
    return deductDeliveryFee;
  } else {
    return 0;
  }
}

function calculateHeroEarnings(merchant, origDeliveryFee, orderTotal, appFee, deliverFee, excessDeliveryFee){
  var result = 0;

  if (merchant.isTrending) {
    result = parseFloat(merchant.trendingFlatRate) + parseFloat(excessDeliveryFee);
    
    return result;
  }

  result = parseFloat(origDeliveryFee) > parseFloat(appFee) ? 
    parseFloat(origDeliveryFee) - parseFloat(appFee) : 
    parseFloat(appFee) - parseFloat(origDeliveryFee);
  
  return result;
}

function calculateHeroCollectibles(merchant, order, collection, earnings){
  if (merchant.isElite) {
    var result = parseFloat(order.markUpTotal) + parseFloat(order.appFee);
  } else if (merchant.isTrending) {//not 100% sure yet sa formula
    var percent = 100 - parseFloat(merchant.riderShare);
    var percentToDecimal = convertPercentToDecimal(percent);
    var withoutTrendingAppFee = (parseFloat(order.total) * percentToDecimal) - parseFloat(order.couponsAmount);
    var result = withoutTrendingAppFee + parseFloat(merchant.trendingAppFee);
  } else {
    var withoutAppFee = collection - earnings - parseFloat(order.couponsAmount);
    var result = withoutAppFee + parseFloat(order.appFee);  
  }

  return result;
}

function calculateHeroEarningsTotal(merchant, earnings, trendingCommissionEarning){
  var result = parseFloat(earnings);

  if (merchant.isTrending) {
    var result = parseFloat(earnings) + parseFloat(trendingCommissionEarning);
    return result;
  }

  return result;
}

function calculateFinalTotal(total, deliveryFee, merchant, coupon, orderLocality, couponLocality){
  var finalTotal = parseFloat(total) + parseFloat(deliveryFee);
  var result = finalTotal;
  
  if (coupon) {
    if (isCouponValid(coupon, merchant, orderLocality, couponLocality)) {   
      if (finalTotal > coupon.fixedDeduction) {
        result = parseFloat(finalTotal) - parseFloat(coupon.fixedDeduction);
      } 
    }
  } 

  return result;
}

function calculateOrigFinalTotal(total, deliveryFee){
  var finalTotal = parseFloat(total) + parseFloat(deliveryFee);
  var result = finalTotal;

  return result;
}
  
function isCouponValid(coupon, merchant, orderLocality, couponLocality, total) {
  var dateToday = moment().tz('Asia/Manila').format('YYYY-MM-DD');
    
  if (!coupon) {
    return false;
  }
  
  if (coupon.active == 0) {
    return false;
  }

  if (coupon.hasExpiry) {
    if (moment(dateToday).isAfter(coupon.expiry) || moment(dateToday).isSame(coupon.expiry, 'date')) {
      return false;
    }
  } 

  if (coupon.numberOfUse >= coupon.usageLimit) {
    return false;
  } 

  if (total <= coupon.minimumSpend) { 
    return false;
  } 

  if (coupon.merchant != null) {
    if (merchant != null) {
      if (merchant.id != coupon.merchant) {
        return false;
      } 
    } 
  } 

  // if (merchant != null) {
  //   if (merchant.isElite) {
  //     return false;
  //   } 
  // } 

  if(couponLocality == 0 || couponLocality == null || couponLocality == undefined) 
  {
    return false;
  }
  
  var isLocalityValid = false;
  // If there is match, locality is valid
  couponLocality.forEach((couponLoc) => {
    if(couponLoc.locality == orderLocality)
      {
        isLocalityValid = true;
      }
  });

  return isLocalityValid;
}

function isCouponValidMessages(coupon, merchant, orderLocality, couponLocality, total) {
  var message = "";
  var dateToday = moment().tz('Asia/Manila').format('YYYY-MM-DD');
    
  if (!coupon) {
    message += "Coupon does not exists. \n";
  }

  if (coupon.active == 0) {
    message += "Coupon is not active. \n";
  }

  if (coupon.hasExpiry) {
    if (moment(dateToday).isAfter(coupon.expiry) || moment(dateToday).isSame(coupon.expiry, 'date')) {
      message += "Coupon expired on " + moment(coupon.expiry).format('LL') + ".\n";
    }
  } 

  if (coupon.numberOfUse >= coupon.usageLimit) {
    message += "Coupon reached the allowed maximum use. \n";
  } 

  if (total <= coupon.minimumSpend) {
    message += "Coupon only allows minimum spend of ₱"+coupon.minimumSpend+". \n";
  } 

  if (coupon.merchant != null) {
    if (merchant != null) {
      if (merchant.id != coupon.merchant) {
         message += "Coupon is not applicable with the Merchant. \n";
      } 
    } 
  } 
  // if (merchant != null) {
  //   if (merchant.isElite) {
  //     message += "Coupon is not applicable with the Merchant. \n";
  //   } 
  // }
  
  // For some unknown reason, couponLocality == null, undefined, and [] is not working. 
  // Maybe prisma.findMany returns 0 if no records found.
  if(couponLocality == 0 || couponLocality == null || couponLocality == undefined) 
  {
    message += "Coupon you entered has no locality. \n";
    return message;
  }
  
  var isLocalityValid = false;
  // Declare the error message
  var localityMessage = "Coupon is not available in " + orderLocality + ". Available place(s): ";
  // If there is match, locality is valid
  couponLocality.forEach((couponLoc) => {
    if(couponLoc.locality == orderLocality)
    {
      isLocalityValid = true;
    }
    else
    {
      localityMessage += couponLoc.locality + ", ";
    }
  });
  // Trim comma (,)
  localityMessage = localityMessage.substring(0, localityMessage.length - 2);
  
  return (isLocalityValid == false) ? localityMessage : message;
}

function computePointToPointDistance(merchantLat, merchantLng, heroLat, heroLng, unit = "km")
{
  var theta = merchantLng - heroLng;

  var distance = Math.sin(deg2rad(merchantLat)) * Math.sin(deg2rad(heroLat)) + Math.cos(deg2rad(merchantLat)) * Math.cos(deg2rad(heroLat)) * Math.cos(deg2rad(theta));

  distance = Math.acos(distance); 
  distance = rad2deg(distance); 
  distance = distance * 60 * 1.1515;
  distance = distance * 1.609344; 
  //I will add conversion per units
  distance;

  return distance;
}

function deg2rad(degree)
{
  return degree * (Math.PI/180);
}

function rad2deg(radian)
{
  return (radian * 180) / Math.PI;
}

function calculateRiderShare(merchant, orderTotal) {
  var result = 0;
  
  if (merchant.isTrending) {
    result = convertPercentToDecimal(merchant.riderShare) * orderTotal;
  }

  return result;
}

function calculateRiderIncome(riderShare, myHeroIncome){
  var result = 0;
  
  // We want negative values
  // if (riderShare > myHeroIncome) {
  //   result = parseFloat(riderShare) - parseFloat(myHeroIncome);
  // } else {
  //   result = parseFloat(myHeroIncome) - parseFloat(riderShare);
  // }
  
  result = parseFloat(riderShare) - parseFloat(myHeroIncome);

  return result;
}

function calculateMyHeroShareAmount(total, myHeroShare){
  return total * (myHeroShare/100);
}

function isGreaterThanOrEqualMinSpend(merchant, orderTotal){
  if (!merchant.myHeroShare || !merchant.minimumSpend) {
    return false;
  }

  if (orderTotal >= merchant.minimumSpend) {
    return true;
  } else {
    return false; 
  }
}

function convertPercentToDecimal(percent) {
  var percentToDecimal = percent / 100;

  return percentToDecimal;
}

module.exports = {
  APP_SECRET,
  getUserId,
  withPesoSign,
  withComma,
  insertErrorLog,
  getPHDateTimeNow,
  generateHeroCode,
  getWordsOfWisdom,
  authorize,
  authorizeMobile,
  getPushNotificationContent,
  deductDeliveryFeeFromMinSpend,
  calculateAppFee,
  calculateFreeDeliveryCost,
  calculateFinalTotal,
  calculateOrigFinalTotal,
  calculateHeroEarnings,
  calculateHeroCollectibles,
  calculateHeroEarningsTotal,
  deg2rad,
  rad2deg,
  computePointToPointDistance,
  calculateRiderShare,
  calculateRiderIncome,
  calculateMyHeroShareAmount,
  isGreaterThanOrEqualMinSpend,
  isCouponValid,
  isCouponValidMessages,
}