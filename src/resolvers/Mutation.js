const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  APP_SECRET,
  getUserId,
  withPesoSign,
  insertErrorLog,
  getPHDateTimeNow,
  getWordsOfWisdom,
  authorize,
  authorizeMobile,
  getPushNotificationContent,
  deductDeliveryFeeFromMinSpend,
  calculateAppFee,
  calculateFreeDeliveryCost,
  calculateHeroEarnings,
  calculateHeroCollectibles,
  calculateHeroEarningsTotal,
  calculateFinalTotal,
  calculateOrigFinalTotal,
  computePointToPointDistance,
  calculateRiderShare,
  calculateRiderIncome,
  calculateMyHeroShareAmount,
  isGreaterThanOrEqualMinSpend,
  isCouponValidMessages,
  isCouponValid,
} = require("../utils");
const fs = require("fs");
const AWS = require("aws-sdk");
const moment = require("moment-timezone");
const Quote = require("inspirational-quotes");
const dotenv = require("dotenv");
dotenv.config({ path: "../../prisma/.env" });
const spacesEndpoint = new AWS.Endpoint("sgp1.digitaloceanspaces.com");
const s3 = new AWS.S3({
  accessKeyId: "KHOL6MWF56E5PZD3D67Q",
  secretAccessKey: "bSBI56rEl+O9lZ4y8QYU/DKkAiY8QGdBhQtvIAIwqDI",
  endpoint: spacesEndpoint,
});
const { merchantsWithDistance } = require("../directions-api");
const Query = require("./Query");
const EmailValidator = require("email-validator");
const axios = require('axios').default;
var admin = require("firebase-admin");
var serviceAccount = require("../hero-delivery-firebase-adminsdk-p2i7z-a86a02ac6c.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hero-delivery.firebaseio.com"
});

async function sendPush(parent, args, context, info) {
  if (!args.registrationToken) {
    var errorDetails = "Cannot send push notification. No registration token specified.";
    var error = { details: errorDetails, type: "M", functionName: "sendPush" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
  // This registration token comes from the client FCM SDKs.
  var registrationToken = args.registrationToken;
  //var registrationToken = 'cgk_khZMTqaX8JNLJvjWL3:APA91bFUDVweR8C7h0HxrpNCQ8daXhIw-YJ3veJdqA3O3JJFIRhrYyXuLM48lfpnkV1exH8UC_wx4WVlyak8bTKI953jB1OKKxSeSHonvYPS5uSxGBDLm2rqG9UiFOobRR-VGBXk2SKR';
  //var registrationToken = 'eBkeTbCVSzC2Uhl57ZZ660:APA91bFsZGeA1sTevj75zJr5MV3yJPLSIZLJSSjLd3XLJLpJz0btj8wA3SZaEb2vdH9QKHwopWBKRttWz6k5biTo2BlPjq4D_v945zwVIFlcGYWRd0avmgI2XSSCdCado14RsJaBaAXB';

  /*var message = {
    data: {
      score: '850',
      time: '2:45'
    },
    token: registrationToken
  };*/
  
  const payload = {
    notification: {
      title: args.title,
      body: args.body,
    }
  };
 
  const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24, // 1 day
  };
  admin.messaging().sendToDevice(registrationToken, payload, options)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });


  // Send a message to the device corresponding to the provided
  // registration token.
  /*admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });*/

  return 'string';
}
async function campHere(parent, args, context, info)
{
  const param = {
    data: {
      lat: args.lat,
      lng: args.lng,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.heroId,
    },
  };

  const hero = await context.prisma.hero.update(param);

  if (!hero) {
    var errorDetails = "Unable to update hero's location";
    var error = { details: errorDetails, type: "M", functionName: "campHere" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
  
  return hero;
}
//sample usage.
async function computeMerchantToHeroKm(parent, args, context, info)
{
  distance = computePointToPointDistance(args.merchantLat, args.merchantLng, args.heroLat, args.heroLng, "km");
  
  return distance;
}

async function updateFirebaseToken(parent, args, context, info){
  const param = {
    data: {
      firebaseToken: args.firebaseToken,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const user = await context.prisma.user.update(param);

  if (!user) {
    var errorDetails = "Unable to update user's firebase token";
    var error = { details: errorDetails, type: "M", functionName: "updateFirebaseToken" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return user;
}

async function signup(parent, args, context, info) {
  if (args.email) { 
    const userFoundEmail = await context.prisma.user.findOne({
      where: { email: args.email },
    }); 

    if (userFoundEmail) {
      var errorDetails = "Cannot register. Email "+args.email+" already used.";
      var error = { details: errorDetails, type: "M", functionName: "signup" };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }
  }

  if (args.contactNumber) {
    const userFoundPhone = await context.prisma.user.findOne({
      where: {contactNumber: args.contactNumber},
    });

    if (userFoundPhone) {
      var errorDetails = "Cannot register. Mobile number "+args.contactNumber+" already used.";
      var error = { details: errorDetails, type: "M", functionName: "signup" };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }
  }

  /*if (!EmailValidator.validate(args.email)) {
    var errorDetails = "Cannot register. Invalid email address.";
    var error = { details: errorDetails, type: "M", functionName: "signup" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }*/

  // 1
  const password = await bcrypt.hash(args.password, 10);
  // 2
  //const user = await context.prisma.user.create({ ...args, password })
  const user = await context.prisma.user.create({
    data: {
      contactNumber: args.contactNumber,
      email: args.email ? args.email : null,
      name: args.name,
      type: args.type,
      status: "ACCEPT",
      password: password,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!user) {
    var errorDetails = "Unable to sign-up";
    var error = { details: errorDetails, type: "M", functionName: "signup" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.validIdImg) {
    const userArg = { id: user.id, photo: args.validIdImg };
    await uploadValidIdImg(parent, userArg, context, info);
  }

  // 3
  const token = jwt.sign({ userId: user.id }, APP_SECRET);
  context.pubsub.publish("NEW_USER", user);
  // 4
  return {
    token,
    user,
  };
}

async function createUserMerchant(parent, args, context, info) {
  if (args.isTrending && args.riderShare == 0) {
    var errorDetails = "Trending merchant should have rider share.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createUserMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  // 1
  const password = await bcrypt.hash(args.password, 10);
  // 2
  const user = await context.prisma.user.create({
    data: {
      name: args.name,
      email: args.email,
      password: password,
      contactNumber: args.contactNumber,
      type: "MERCHANT_ALLY",
      status: "ACCEPT",
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
      merchant: {
        create: {
          name: args.name,
          owner: args.owner,
          myHeroShare: args.isElite ? 0 : args.myHeroShare,
          myHeroFreeDeliveryShare: args.isElite ? 0 : args.myHeroFreeDeliveryShare,
          minimumSpend: args.isElite ? 0 : args.minimumSpend,
          isElite: args.isElite,
          isTrending: args.isTrending,
          trendingFlatRate: args.trendingFlatRate,
          trendingAppFee: args.trendingAppFee,
          riderShare: args.riderShare,
          havePermit: args.havePermit,
          adminCollections: args.adminCollections,
          adminEarnings: args.adminEarnings,
          adminRemittanceToMerchant: args.adminRemittanceToMerchant,
          adminPaidPayables: args.adminPaidPayables,
          adminRemainingPayables: args.adminRemainingPayables,
          address: args.address,
          lat: args.lat,
          lng: args.lng,
          city: args.city,
          businessPermitNo: args.businessPermitNo,
          active: args.active,
          status: 'CLOSE',
          createdAt: getPHDateTimeNow(),
          updatedAt: getPHDateTimeNow(),
        },
      },
    },
  });

  if (args.photo) {
    const arg = { id: user.id, photo: args.photo };
    const userPhotoUploaded = await uploadUserPhoto(parent, arg, context, info);

    if (userPhotoUploaded) {
      return userPhotoUploaded;
    }
  }

  if (args.trendingPhoto) {
    const trendingPhotoArg = { id: merchant.id, trendingPhoto: args.trendingPhoto };
    const merchantTrendingPhotoUploaded = await uploadMerchantTrendingPhoto(
      parent,
      trendingPhotoArg,
      context,
      info
    );

    if (merchantTrendingPhotoUploaded) {
      return merchantTrendingPhotoUploaded;
    }
  }

  if (!user) {
    var errorDetails = "Unable to create merchant";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createUserMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  // 3
  return user;
}

async function createMerchantUser(parent, args, context, info) {
  if (args.isTrending && args.riderShare == 0) {
    var errorDetails = "Trending merchant should have rider share.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createMerchantUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
  // 1
  const password = await bcrypt.hash(args.password, 10);
  // 2
  const user = await context.prisma.user.create({
    data: {
      name: args.name,
      email: args.email,
      password: password,
      contactNumber: args.contactNumber,
      type: "MERCHANT_ALLY",
      status: "ACCEPT",
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
      merchant: {
        create: {
          name: args.name,
          owner: args.owner,
          myHeroShare: args.isElite ? 0 : args.myHeroShare,
          myHeroFreeDeliveryShare: args.isElite ? 0 : args.myHeroFreeDeliveryShare,
          minimumSpend: args.isElite ? 0 : args.minimumSpend,
          isElite: args.isElite,
          isTrending: args.isTrending,
          trendingFlatRate: args.trendingFlatRate,
          trendingAppFee: args.trendingAppFee,
          riderShare: args.riderShare,
          havePermit: args.havePermit,
          adminCollections: args.adminCollections,
          adminEarnings: args.adminEarnings,
          adminRemittanceToMerchant: args.adminRemittanceToMerchant,
          adminPaidPayables: args.adminPaidPayables,
          adminRemainingPayables: args.adminRemainingPayables,
          address: args.address,
          lat: args.lat,
          lng: args.lng,
          city: args.city,
          businessPermitNo: args.businessPermitNo,
          active: args.active,
          status: 'CLOSE',
          createdAt: getPHDateTimeNow(),
          updatedAt: getPHDateTimeNow(),
        },
      },
    },
  });

  if (!user) {
    var errorDetails = "Unable to create user merchant";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createMerchantUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  // 3
  const merchant = await context.prisma.merchant.findOne({
    where: { user: user.id },
  });

  if (!merchant) {
    var errorDetails = "Cannot find merchant with user id " + user.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createMerchantUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const merchantCategory = await context.prisma.merchantCategory.create({
    data: {
      merchant_merchantTomerchantCategory: { connect: { id: merchant.id } },
      category_categoryTomerchantCategory: { connect: { id: args.category } },
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!merchantCategory) {
    var errorDetails = "Cannot create category for merchant " + merchant.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createMerchantUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (merchant) {
    const updatedUser = await context.prisma.user.update({
      where: { id: user.id },
      data: {
        child_id: merchant.id,
        updatedAt: getPHDateTimeNow(),
      },
    });

    if (!updatedUser) {
      var errorDetails = "Cannot update user " + user.id;
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "createMerchantUser",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }
  }

  if (args.ownerPhoto) {
    const userArg = { id: user.id, photo: args.ownerPhoto };
    await uploadUserPhoto(parent, userArg, context, info);
  }

  if (args.photo) {
    const arg = { id: merchant.id, photo: args.photo };
    const merchantPhotoUploaded = await uploadMerchantPhoto(
      parent,
      arg,
      context,
      info
    );

    if (merchantPhotoUploaded) {
      return merchantPhotoUploaded;
    }
  }

  if (args.trendingPhoto) {
    const trendingPhotoArg = { id: merchant.id, trendingPhoto: args.trendingPhoto };
    const merchantTrendingPhotoUploaded = await uploadMerchantTrendingPhoto(
      parent,
      trendingPhotoArg,
      context,
      info
    );

    if (merchantTrendingPhotoUploaded) {
      return merchantTrendingPhotoUploaded;
    }
  }

  return merchant;
}

async function updateMerchantUser(parent, args, context, info) {
  if (args.isTrending && args.riderShare == 0) {
    var errorDetails = "Trending merchant should have rider share.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const user = await context.prisma.user.findOne({
    where: { id: args.userID },
  });

  if (!user) {
    throw new Error("User " + args.userID + " not found");
  }

  const merchant = await context.prisma.merchant.findOne({
    where: { user: user.id },
  });

  if (!merchant) {
    var errorDetails = "Merchant with user id " + user.id + " not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.password) {
    var password = await bcrypt.hash(args.password, 10);
  } else {
    var password = user.password;
  }

  const updatedUser = await context.prisma.user.update({
    where: { id: args.userID },
    data: {
      name: args.name ? args.name : user.name,
      email: args.email ? args.email : user.email,
      contactNumber: args.contactNumber
        ? args.contactNumber
        : user.contactNumber,
      type: "MERCHANT_ALLY",
      password: password,
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!updatedUser) {
    var errorDetails = "Unable to update user " + args.userID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const myHeroShare = args.myHeroShare === undefined ? merchant.myHeroShare : args.myHeroShare;

  const updatedMerchant = await context.prisma.merchant.update({
    where: { user: updatedUser.id },
    data: {
      name: args.name ? args.name : merchant.name,
      owner: args.owner ? args.owner : merchant.owner,
      myHeroShare: args.isElite ? 0 : myHeroShare,
      myHeroFreeDeliveryShare: args.isElite ? 0 : args.myHeroFreeDeliveryShare,
      minimumSpend: args.isElite ? 0 : args.minimumSpend,
      isElite: args.isElite,
      isTrending: args.isTrending,
      trendingFlatRate: args.trendingFlatRate,
      trendingAppFee: args.trendingAppFee,
      riderShare: args.riderShare,
      havePermit: args.havePermit ? args.havePermit : merchant.havePermit,
      adminCollections: args.adminCollections
        ? args.adminCollections
        : merchant.adminCollections,
      adminEarnings: args.adminEarnings
        ? args.adminEarnings
        : merchant.adminEarnings,
      adminRemittanceToMerchant: args.adminRemittanceToMerchant
        ? args.adminRemittanceToMerchant
        : merchant.adminRemittanceToMerchant,
      adminPaidPayables: args.adminPaidPayables
        ? args.adminPaidPayables
        : merchant.adminPaidPayables,
      adminRemainingPayables: args.adminRemainingPayables
        ? args.adminRemainingPayables
        : merchant.adminRemainingPayables,
      address: args.address ? args.address : merchant.address,
      lat: args.lat ? args.lat : merchant.lat,
      lng: args.lng ? args.lng : merchant.lng,
      city: args.city ? args.city : merchant.city,
      businessPermitNo: args.businessPermitNo
        ? args.businessPermitNo
        : merchant.businessPermitNo,
      active: args.active,
      status: args.status ? args.status : merchant.status,
      updatedAt: getPHDateTimeNow(),
    },
  });


  if (updatedMerchant && myHeroShare !== 0) {
    var merchantMarkUpArgs = {merchantId : updatedMerchant.id};
    await changeMarkUpPriceToZero(parent, merchantMarkUpArgs, context, info);
  }//end myHeroShare !== 0

  if (!updatedMerchant) {
    var errorDetails =
      "Unable to update merchant with user id " + updatedUser.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.category) {
    const merchantCategory = await context.prisma.merchantCategory.update({
      where: { merchant: merchant.id },
      data: {
        //merchant_merchantTomerchantCategory: {connect: {id: merchant.id}},
        category_categoryTomerchantCategory: { connect: { id: args.category } },
        updatedAt: getPHDateTimeNow(),
      },
    });

    if (!merchantCategory) {
      var errorDetails =
        "Unable to update merchant category for merchant " + merchant.id;
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "updateMerchantUser",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }
  }

  if (args.ownerPhoto) {
    const userArg = { id: user.id, photo: args.ownerPhoto };
    await uploadUserPhoto(parent, userArg, context, info);
  }

  if (args.photo) {
    const arg = { id: merchant.id, photo: args.photo };
    const merchantPhotoUploaded = await uploadMerchantPhoto(
      parent,
      arg,
      context,
      info
    );

    if (merchantPhotoUploaded) {
      return merchantPhotoUploaded;
    }
  }

  if (args.trendingPhoto) {
    const trendingPhotoArg = { id: merchant.id, trendingPhoto: args.trendingPhoto };
    const merchantTrendingPhotoUploaded = await uploadMerchantTrendingPhoto(
      parent,
      trendingPhotoArg,
      context,
      info
    );

    if (merchantTrendingPhotoUploaded) {
      return merchantTrendingPhotoUploaded;
    }
  }

  return updatedMerchant;
}

async function changeMarkUpPriceToZero(parent, args, context, info) {
  const products = await context.prisma.product.findMany({
    where: {
      AND: [
        {merchant: args.merchantId},
        {markUpPrice: {gt: 0}}
      ]
    },
  });

  if (products) {
    products.forEach(async productData => {
      await context.prisma.product.update({
        where: {id: productData.id},
        data: {
          markUpPrice: 0,
          priceWithMarkUp: productData.price,
          updatedAt: getPHDateTimeNow(),
        }
      });
    });

    const productIds = products.map(p => p.id);
    const productSizes = await context.prisma.productSize.findMany({
      where: {
        product: { in: productIds}
      }
    });

    if (productSizes) {
      productSizes.forEach(async productSize => {
        await context.prisma.productSize.update({
          where: {id: productSize.id},
          data: {
            markUpPrice: 0,
            priceWithMarkUp: productSize.price,
            updatedAt: getPHDateTimeNow(),
          }
        });
      })
    }
  }
  
  const addons = await context.prisma.addon.findMany({
    where: {
      AND: [
        {merchant: args.merchantId},
        {markUpPrice: {gt: 0}}
      ]
    },
  });

  if (addons) {
    addons.forEach(async addonData => {
      await context.prisma.addon.update({
        where: {id: addonData.id},
        data: {
          markUpPrice: 0,
          priceWithMarkUp: addonData.price,
          updatedAt: getPHDateTimeNow(),
        }
      });
    });
  }
}

async function createUserHero(parent, args, context, info) {
  // 1
  const password = await bcrypt.hash(args.password, 10);
  // 2
  const user = await context.prisma.user.create({
    data: {
      name: args.name,
      email: args.email,
      password: password,
      contactNumber: args.contactNumber,
      type: "HERO",
      status: "ACCEPT",
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
      hero: {
        create: {
          sex: args.sex,
          birthday: new Date(args.birthday),
          nbiNo: args.nbiNo,
          policeClearanceNo: args.policeClearanceNo,
          plateNo: args.plateNo,
          licenseNo: args.licenseNo,
          collectedAmount: args.collectedAmount,
          earnings: args.earnings,
          city: args.city,
          isAvailable: args.isAvailable,
          createdAt: getPHDateTimeNow(),
          updatedAt: getPHDateTimeNow(),
        },
      },
    },
  });

  if (!user) {
    var errorDetails = "Unable to create hero";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createUserHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.photo) {
    const arg = { id: user.id, photo: args.photo };
    await uploadUserPhoto(parent, arg, context, info);
  }
  // 3
  return user;
}

async function createHeroUser(parent, args, context, info) {
  // 1
  const password = await bcrypt.hash(args.password, 10);
  // 2
  const user = await context.prisma.user.create({
    data: {
      name: args.name,
      email: args.email,
      password: password,
      contactNumber: args.contactNumber,
      type: "HERO",
      status: "ACCEPT",
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
      hero: {
        create: {
          heroRole: args.heroRole,
          sex: args.sex,
          birthday: new Date(args.birthday),
          nbiNo: args.nbiNo,
          policeClearanceNo: args.policeClearanceNo,
          plateNo: args.plateNo,
          licenseNo: args.licenseNo,
          collectedAmount: args.collectedAmount,
          earnings: args.earnings,
          city: args.city,
          locality: args.locality,
          isAvailable: args.isAvailable,
          createdAt: getPHDateTimeNow(),
          updatedAt: getPHDateTimeNow(),
        },
      },
    },
  });

  if (!user) {
    var errorDetails = "Unable to create hero";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createHeroUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  // 3
  const hero = await context.prisma.hero.findOne({ where: { user: user.id } });

  if (!hero) {
    var errorDetails = "Hero with user id " + user.id + " not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createHeroUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (hero) {
    const updatedUser = await context.prisma.user.update({
      where: { id: user.id },
      data: {
        child_id: hero.id,
        updatedAt: getPHDateTimeNow(),
      },
    });

    if (!updatedUser) {
      var errorDetails = "Unable to update user with id " + user.id;
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "createHeroUser",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }
  }

  if (args.photo) {
    const arg = { id: user.id, photo: args.photo };
    await uploadUserPhoto(parent, arg, context, info);
  }

  return hero;
}

async function updateHeroUser(parent, args, context, info) {
  const user = await context.prisma.user.findOne({
    where: { id: args.userID },
  });

  if (!user) {
    var errorDetails = "No such user found with id " + args.userID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createHeroUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const hero = await context.prisma.hero.findOne({ where: { user: user.id } });

  if (!hero) {
    var errorDetails = "No such hero found with user id " + user.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createHeroUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.password) {
    var password = await bcrypt.hash(args.password, 10);
  } else {
    var password = user.password;
  }

  const updatedUser = await context.prisma.user.update({
    where: { id: args.userID },
    data: {
      name: args.name ? args.name : user.name,
      email: args.email ? args.email : user.email,
      contactNumber: args.contactNumber
        ? args.contactNumber
        : user.contactNumber,
      type: "HERO",
      password: password,
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!updatedUser) {
    var errorDetails =
      "For some reason, user cannot be updated with id " + args.userID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createHeroUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const updatedHero = await context.prisma.hero.update({
    where: { user: updatedUser.id },
    data: {
      heroRole: args.heroRole ? args.heroRole : hero.heroRole,
      sex: args.sex ? args.sex : hero.sex,
      birthday: args.birthday
        ? new Date(args.birthday)
        : new Date(hero.birthday),
      nbiNo: args.nbiNo ? args.nbiNo : hero.nbiNo,
      policeClearanceNo: args.policeClearanceNo
        ? args.policeClearanceNo
        : hero.policeClearanceNo,
      plateNo: args.plateNo ? args.plateNo : hero.plateNo,
      licenseNo: args.licenseNo ? args.licenseNo : hero.licenseNo,
      collectedAmount: args.collectedAmount
        ? args.collectedAmount
        : hero.collectedAmount,
      earnings: args.earnings ? args.earnings : hero.earnings,
      city: args.city ? args.city : hero.city,
      locality: args.locality ? args.locality : hero.locality,
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!updatedHero) {
    var errorDetails =
      "For some reason, hero cannot be updated with user id " + updatedUser.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createHeroUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.photo) {
    const arg = { id: user.id, photo: args.photo };
    await uploadUserPhoto(parent, arg, context, info);
  }

  if (!updatedHero) {
    var errorDetails = "For some reason, hero cannot be updated";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createHeroUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return updatedHero;
}

async function login(parent, args, context, info) {
  // 1
  //const user = await context.prisma.user({ email: args.email })
  var user = {};
  var phoneOrMail = "";

  if (args.emailOrPhone) {
    const userByPhone = await context.prisma.user.findOne({
      where: {contactNumber: args.emailOrPhone}
    });

    user = userByPhone;
    phoneOrMail = args.emailOrPhone;
  }

  if (args.email) {
    const userByEmail = await context.prisma.user.findOne({
      where: {email: args.email}
    });

    user = userByEmail;
    phoneOrMail = args.email;
  }

  if (!user) {
    var errorDetails = "No such user found with contact record at " +phoneOrMail;
    var error = { details: errorDetails, type: "M", functionName: "login" };
    throw new Error(errorDetails);
  }

  if (user.status == "REJECT") {
    var errorDetails = "Your account "+phoneOrMail+" is rejected. If you need any clarifications please contact 0917-877-1751 or email us at support@myherodelivery.com";
    var error = { details: errorDetails, type: "M", functionName: "login" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (user.status == "PENDING") {
    var errorDetails = "Your account "+phoneOrMail+" is still pending. If you need any clarifications please contact 0917-877-1751 or email us at support@myherodelivery.com";
    var error = { details: errorDetails, type: "M", functionName: "login" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  // 2
  const valid = await bcrypt.compare(args.password, user.password);
  if (!valid) {
    var errorDetails = "Invalid password";
    var error = { details: errorDetails, type: "M", functionName: "login" };
    throw new Error(errorDetails);
  }

  const token = jwt.sign({ userId: user.id }, APP_SECRET);

  // 3
  return {
    token,
    user,
  };
}

async function changePassword(parent, args, context, info) {
  // 1
  //const user = await context.prisma.user({ email: args.email })
  const userFound = await context.prisma.user.findOne({
    where: { id: args.id },
  });
  if (!userFound) {
    var errorDetails = "No such user found with id " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "changePassword",
    };
    throw new Error(errorDetails);
  }

  // 2
  // const valid = await bcrypt.compare(args.oldPassword, userFound.password);
  // if (!valid) {
  //   var errorDetails = "Invalid password";
  //   var error = {
  //     details: errorDetails,
  //     type: "M",
  //     functionName: "changePassword",
  //   };
  //   throw new Error(errorDetails);
  // }

  const password = await bcrypt.hash(args.newPassword, 10);

  const param = {
    data: {
      password: password,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const user = await context.prisma.user.update(param);

  if (!user) {
    var errorDetails = "Unable to change password.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "changePassword",
    };
    throw new Error(errorDetails);
  }

  // 3
  return user;
}

async function changeForgottenPassword(parent, args, context, info) {
  // 1
  //const user = await context.prisma.user({ email: args.email })
  const userFound = await context.prisma.user.findOne({
    where: { otpCode: args.otpCode },
  });
  if (!userFound) {
    var errorDetails = "Your otp is invalid/expired";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "changeForgottenPassword",
    };
    throw new Error(errorDetails);
  }

  //check if confirm password matches new password
  if(args.confirmPassword != args.newPassword)
  {
    var errorDetails = "Password mismatch";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "changeForgottenPassword",
    };
    throw new Error(errorDetails);
  }

  // 2
  // const valid = await bcrypt.compare(args.oldPassword, userFound.password);
  // if (!valid) {
  //   var errorDetails = "Invalid password";
  //   var error = {
  //     details: errorDetails,
  //     type: "M",
  //     functionName: "changePassword",
  //   };
  //   throw new Error(errorDetails);
  // }

  const password = await bcrypt.hash(args.newPassword, 10);

  const param = {
    data: {
      password: password,
      otpCode: null,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      otpCode: args.otpCode,
    },
  };

  const user = await context.prisma.user.update(param);

  if (!user) {
    var errorDetails = "Unable to change password.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "changeForgottenPassword",
    };
    throw new Error(errorDetails);
  }

  // 3
  return user;
}

async function updateUser(parent, args, context, info) {
  const param = {
    data: {
      name: args.name,
      email: args.email,
      contactNumber: args.contactNumber,
      status: args.status,
      type: args.type,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const user = await context.prisma.user.update(param);

  if (!user) {
    var errorDetails = "Unable to update user " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  context.pubsub.publish("UPDATED_USER", { updatedUser: user });

  return user;
}

async function deleteUser(parent, args, context, info) {
  const user = await context.prisma.user.delete({ where: { id: args.id } });

  if (!user) {
    var errorDetails = "Unable to delete user " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteUser",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return user;
}

async function acceptUser(parent, args, context, info) {
  const user = await context.prisma.user.findOne({ where: { id: args.id } });

  if (!user) {
    throw new Error("No such user found");
  }

  if (user.status == "PENDING") {
    const param = {
      data: {
        status: "ACCEPT",
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const updatedUser = await context.prisma.user.update(param);

    if (!updatedUser) {
      var errorDetails = "Unable to accept user " + args.id;
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "acceptUser",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return updatedUser;
  }

  return user;
}

async function createCategory(parent, args, context, info) {
  const category = await context.prisma.category.create({
    data: {
      ...args,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!category) {
    var errorDetails = "Unable to create new category";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return category;
}

async function updateCategory(parent, args, context, info) {
  const param = {
    data: {
      ...args,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const category = await context.prisma.category.update(param);

  if (!category) {
    var errorDetails = "Unable to update category " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return category;
}

async function deleteCategory(parent, args, context, info) {
  const category = await context.prisma.category.delete({
    where: { id: args.id },
  });

  if (!category) {
    var errorDetails = "Unable to delete category " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return category;
}

async function createLocality(parent, args, context, info) {
  const locality = await context.prisma.locality.create({
    data: {
      ...args,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!locality) {
    var errorDetails = "Unable to create new locality";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createLocality",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return locality;
}

async function updateLocality(parent, args, context, info) {
  const param = {
    data: {
      name: args.name,
      riderSystem: args.riderSystem,
      radiusLimitKm: args.radiusLimitKm,
      active: args.active,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const locality = await context.prisma.locality.update(param);

  if (!locality) {
    var errorDetails = "Unable to update locality " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateLocality",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return locality;
}

async function deleteLocality(parent, args, context, info) {
  const param = {
    data: {
      active: false,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const locality = await context.prisma.locality.update(param);


  if (!locality) {
    var errorDetails = "Unable to delete locality " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteLocality",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return locality;
}

async function createMerchant(parent, args, context, info) {
  const merchant = await context.prisma.merchant.create({
    data: {
      ...args,
      user_merchantTouser: args.user_merchantTouser
        ? { connect: { id: args.user_merchantTouser } }
        : undefined,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!merchant) {
    var errorDetails = "Unable to create new merchant";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.trendingPhoto) {
    const trendingPhotoArg = { id: merchant.id, trendingPhoto: args.trendingPhoto };
    const merchantTrendingPhotoUploaded = await uploadMerchantTrendingPhoto(
      parent,
      trendingPhotoArg,
      context,
      info
    );

    if (merchantTrendingPhotoUploaded) {
      return merchantTrendingPhotoUploaded;
    }
  }

  return merchant;
}

async function updateMerchant(parent, args, context, info) {
  if (args.isTrending && args.riderShare == 0) {
    var errorDetails = "Trending merchant should have rider share.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const merchant = await context.prisma.merchant.findOne({
    where: {id: args.id },
  });

  if (!merchant) {
    var errorDetails = "Merchant with id " + args.id + " not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var myHeroShare = args.myHeroShare === undefined ? merchant.myHeroShare : args.myHeroShare;

  const param = {
    data: {
      //...args,
      //user_merchantTouser: args.user_merchantTouser ? {connect: {id: args.user_merchantTouser }} : undefined,
      isTrending: args.isTrending === undefined ? merchant.isTrending : args.isTrending,
      isPopular: args.isPopular === undefined ? merchant.isPopular : args.isPopular,
      status: args.status === undefined ? merchant.status : args.status,
      myHeroShare: args.isElite ? 0 : myHeroShare,
      myHeroFreeDeliveryShare: args.isElite ? 0 : args.myHeroFreeDeliveryShare,
      minimumSpend: args.isElite ? 0 : args.minimumSpend,
      trendingFlatRate: args.trendingFlatRate,
      trendingAppFee: args.trendingAppFee,
      riderShare: args.riderShare,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const updatedMerchant = await context.prisma.merchant.update(param);

  if (!updatedMerchant) {
    var errorDetails = "Unable to update merchant " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.trendingPhoto) {
    const trendingPhotoArg = { id: merchant.id, trendingPhoto: args.trendingPhoto };
    const merchantTrendingPhotoUploaded = await uploadMerchantTrendingPhoto(
      parent,
      trendingPhotoArg,
      context,
      info
    );

    if (merchantTrendingPhotoUploaded) {
      return merchantTrendingPhotoUploaded;
    }
  }

  return merchant;
}

async function deleteMerchant(parent, args, context, info) {
  const merchantCategory = await context.prisma.merchantCategory.delete({
    where: { merchant: args.id },
  });

  if (!merchantCategory) {
    var errorDetails =
      "Unable to delete record in merchant category table for merchant id " +
      args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const merchant = await context.prisma.merchant.delete({
    where: { id: args.id },
  });

  if (!merchant) {
    var errorDetails = "Unable to delete merchant " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return merchant;
}

async function updateMerchantSchedule(parent, args, context, info) {
  const merchant = await context.prisma.merchant.findOne({
    where: {id: args.id },
  });

  if (!merchant) {
    var errorDetails = "Merchant with id " + args.id + " not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantSchedule",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const param = {
    data: {
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  //args.schedules
  for (var i = 0; i < args.schedules.length; i++) {
    switch(args.schedules[i].day) {
      case 'monday':
        param.data.monday = args.schedules[i].isOpen;
        param.data.openTimeMonday = new Date(args.schedules[i].openTime);
        param.data.closeTimeMonday = new Date(args.schedules[i].closeTime);
        break;
      case 'tuesday':
        param.data.tuesday = args.schedules[i].isOpen;
        param.data.openTimeTuesday = new Date(args.schedules[i].openTime);
        param.data.closeTimeTuesday = new Date(args.schedules[i].closeTime);
        break;
      case 'wednesday':
        param.data.wednesday = args.schedules[i].isOpen;
        param.data.openTimeWednesday = new Date(args.schedules[i].openTime);
        param.data.closeTimeWednesday = new Date(args.schedules[i].closeTime);
        break;
      case 'thursday':
        param.data.thursday = args.schedules[i].isOpen;
        param.data.openTimeThursday = new Date(args.schedules[i].openTime);
        param.data.closeTimeThursday = new Date(args.schedules[i].closeTime);
        break;
      case 'friday':
        param.data.friday = args.schedules[i].isOpen;
        param.data.openTimeFriday = new Date(args.schedules[i].openTime);
        param.data.closeTimeFriday = new Date(args.schedules[i].closeTime);
        break;
      case 'saturday':
        param.data.saturday = args.schedules[i].isOpen;
        param.data.openTimeSaturday = new Date(args.schedules[i].openTime);
        param.data.closeTimeSaturday = new Date(args.schedules[i].closeTime);
        break;
      case 'sunday':
        param.data.sunday = args.schedules[i].isOpen;
        param.data.openTimeSunday = new Date(args.schedules[i].openTime);
        param.data.closeTimeSunday = new Date(args.schedules[i].closeTime);
        break;
      default:
        var errorDetails = "Unable to update merchant " + args.id+". "+args.schedules[i].day+" is an unknown day.";
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateMerchantSchedule",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
    }
  }

  const updatedMerchant = await context.prisma.merchant.update(param);

  if (!updatedMerchant) {
    var errorDetails = "Unable to update merchant " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantSchedule",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return updatedMerchant;
}
async function createMerchantTag(parent, args, context, info) {
  const merchantTag = await context.prisma.merchantTag.create({
    data: {
      merchant_merchantTomerchantTag: {
        connect: { id: args.merchant_merchantTomerchantTag },
      },
      tag_merchantTagTotag: { connect: { id: args.tag_merchantTagTotag } },
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  return merchantTag;
}

async function updateMerchantTag(parent, args, context, info) {
  const param = {
    data: {
      merchant_merchantTomerchantTag: {
        connect: { id: args.merchant_merchantTomerchantTag },
      },
      tag_merchantTagTotag: { connect: { id: args.tag_merchantTagTotag } },
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const merchantTag = await context.prisma.merchantTag.update(param);

  return merchantTag;
}

async function deleteMerchantTag(parent, args, context, info) {
  const merchantTag = await context.prisma.merchantTag.delete({
    where: { id: args.id },
  });

  return merchantTag;
}

async function createMerchantCategory(parent, args, context, info) {
  const merchantCategory = await context.prisma.merchantCategory.create({
    data: {
      merchant_merchantTomerchantCategory: {
        connect: { id: args.merchant_merchantTomerchantCategory },
      },
      category_categoryTomerchantCategory: {
        connect: { id: args.category_categoryTomerchantCategory },
      },
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  return merchantCategory;
}

async function updateMerchantCategory(parent, args, context, info) {
  const param = {
    data: {
      merchant_merchantTomerchantCategory: {
        connect: { id: args.merchant_merchantTomerchantCategory },
      },
      category_categoryTomerchantCategory: {
        connect: { id: args.category_categoryTomerchantCategory },
      },
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const merchantCategory = await context.prisma.merchantCategory.update(param);

  return merchantCategory;
}

async function deleteMerchantCategory(parent, args, context, info) {
  const merchantCategory = await context.prisma.merchantCategory.delete({
    where: { id: args.id },
  });

  return merchantCategory;
}

async function createTag(parent, args, context, info) {
  const tag = await context.prisma.tag.create({
    data: {
      ...args,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  context.pubsub.publish("NEW_TAG", tag);

  return tag;
}

async function updateTag(parent, args, context, info) {
  const param = {
    data: {
      ...args,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const tag = await context.prisma.tag.update(param);

  return tag;
}

async function deleteTag(parent, args, context, info) {
  const tag = await context.prisma.tag.delete({ where: { id: args.id } });

  return tag;
}

async function createCouponType(parent, args, context, info) {
  const couponType = await context.prisma.couponType.create({
    data: {
      ...args,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  return couponType;
}

async function updateCouponType(parent, args, context, info) {
  const param = {
    data: {
      ...args,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const couponType = await context.prisma.couponType.update(param);

  return couponType;
}

async function deleteCouponType(parent, args, context, info) {
  const couponType = await context.prisma.couponType.delete({
    where: { id: args.id },
  });

  return couponType;
}

async function createCouponStatus(parent, args, context, info) {
  const couponStatus = await context.prisma.couponStatus.create({
    data: {
      ...args,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  return couponStatus;
}

async function updateCouponStatus(parent, args, context, info) {
  const param = {
    data: {
      ...args,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const couponStatus = await context.prisma.couponStatus.update(param);

  return couponStatus;
}

async function deleteCouponStatus(parent, args, context, info) {
  const couponStatus = await context.prisma.couponStatus.delete({
    where: { id: args.id },
  });

  return couponStatus;
}

async function createCoupon(parent, args, context, info) {
  const coupon = await context.prisma.coupon.create({
    data: {
      couponType_couponTocouponType: (args.couponType) ? { connect: { id: args.couponType } } : undefined,
      couponStatus_couponTocouponStatus: (args.couponStatus) ? { connect: { id: args.couponStatus } } : undefined,
      merchant_couponTomerchant: (args.merchant) ? { connect: { id: args.merchant } } : undefined,
      code: args.code,
      name: args.name,
      active: args.active,
      discount: args.discount,
      fixedDeduction: args.fixedDeduction,
      usageLimit: args.usageLimit,
      minimumSpend: args.minimumSpend,
      numberOfUse: args.numberOfUse,
      hasExpiry	: args.hasExpiry,
      expiry: new Date(args.expiry),
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  return coupon;
}

async function updateCoupon(parent, args, context, info) {
  const param = {
    data: {
      couponType_couponTocouponType: (args.couponType) ? { connect: { id: args.couponType } } : undefined,
      couponStatus_couponTocouponStatus: (args.couponStatus) ? { connect: { id: args.couponStatus } } : undefined,
      merchant_couponTomerchant: (args.merchant) ? { connect: { id: args.merchant } } : undefined,
      code: args.code,
      name: args.name,
      active: args.active,
      discount: args.discount,
      fixedDeduction: args.fixedDeduction,
      usageLimit: args.usageLimit,
      minimumSpend: args.minimumSpend,
      numberOfUse: args.numberOfUse,
      hasExpiry	: args.hasExpiry,
      expiry: new Date(args.expiry),
      updatedAt: getPHDateTimeNow(),
    },
    where: (args.id) ? { id: args.id } : { code: args.code } ,
  };

  const coupon = await context.prisma.coupon.update(param);

  return coupon;
}

async function deleteCoupon(parent, args, context, info) {
  //hard delete
  // const coupon = await context.prisma.coupon.delete({ where: { id: args.id } });

  //soft delete
  const param = {
    data: {
      active: false,
      updatedAt: getPHDateTimeNow(),
    },
    where: { id: args.id },
  };

  const coupon = await context.prisma.coupon.update(param);

  return coupon;
}

async function createErrand(parent, args, context, info) {
  var costing = await context.prisma.costing.findOne({ where: { id: 1 } });
  
  if (!costing) {
    var errorDetails = "No such costing found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createErrand",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  costing = {
    firstKmCost: costing.errandsFlatRate, 
    appFee: costing.errandsAppFee, 
    excessPerKmCost: costing.errandsExcessPerKmCost
  };
  //Market Coordinates
  args.errandsLatLng = {
    lat: 6.631794, 
    lng: 124.597876 
  };

  var distanceAndErrandsFee = args.errandsFee > 0
        ? args.errandsFee
        : await getDistanceAndDeliveryFee(
            parent,
            args,
            context,
            info,
            costing,
            "errand"
          );

  var hero = await assignHeroFromCode(parent, args, context, info);

  const errand = await context.prisma.errand.create({
    data: {
      user: { connect: { id: args.user } },
      hero_errandTohero: { connect: { id: hero.id } },
      heroCode: hero.found ? hero.code : null,
      address: args.address,
      landmark: args.landmark,
      message: args.message,
      errandsFee: distanceAndErrandsFee.deliveryFee, //computation to add.
      distance: distanceAndErrandsFee.distance,
      customerLat: args.customerLat,
      customerLng: args.customerLng,
      receiverFullName: args.receiverFullName,
      receiverContactNumber: args.receiverContactNumber,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!errand) {
    var errorDetails =
      "Cannot create new errand";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createErrand",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return errand;
}

async function updateErrand(parent, args, context, info) {
  const param = {
    data: {
      user: { connect: { id: args.user } },
      hero_errandTohero: { connect: { id: args.hero } },
      heroCode: args.heroCode,
      address: args.address,
      landmark: args.landmark,
      message: args.message,
      errandsFee: args.errandsFee,
      distance: args.distance,
      customerLat: args.customerLat,
      customerLng: args.customerLng,
      receiverFullName: args.receiverFullName,
      receiverContactNumber: args.receiverContactNumber,
      updatedAt: getPHDateTimeNow(),
    },
    where: { id: args.id },
  };

  const errand = await context.prisma.errand.update(param);
  
  if (!errand) {
    var errorDetails =
      "Cannot update errand" + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateErrand",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return errand;
}

async function deleteErrand(parent, args, context, info) {
  const errand = await context.prisma.errand.delete({
    where: { id: args.id },
  });

  return errand;
}


async function createProduct(parent, args, context, info) {
  var markUp = args.markUpPrice ? args.markUpPrice : 0;

  const product = await context.prisma.product.create({
    data: {
      ...args,
      markUpPrice: markUp,
      priceWithMarkUp: args.price + markUp,
      merchant_merchantToproduct: {
        connect: { id: args.merchant_merchantToproduct },
      },
      addonType: args.addonType,
      hasSugarLevel: args.hasSugarLevel,
      estPrepTime: args.estPrepTime,
      active: true,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!product) {
    var errorDetails = "Unable to create new product.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createProduct",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return product;
}

async function updateProduct(parent, args, context, info) {
  const product = await context.prisma.product.findOne({
    where: { id: args.id },
  });

  if (!product) {
    var errorDetails = "No such product " + args.id + " found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProduct",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var price = args.price ? args.price : product.price;
  var markUp = args.markUpPrice ? args.markUpPrice : 0;

  const param = {
    data: {
      name: args.name ? args.name : product.name,
      price: price,
      description: args.description ? args.description : product.description,
      markUpPrice: markUp,
      priceWithMarkUp: price + markUp,
      merchant_merchantToproduct: args.merchant_merchantToproduct
        ? { connect: { id: args.merchant_merchantToproduct } }
        : { connect: { id: product.merchant } },
      isAvailable: args.isAvailable,
      addonType: args.addonType,
      hasSugarLevel: args.hasSugarLevel,
      estPrepTime: args.estPrepTime,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const updatedProduct = await context.prisma.product.update(param);

  if (!updatedProduct) {
    var errorDetails = "Unable to update product " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProduct",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  /**update mark-up price of sizes belong to this product **/
  var productSizes = await context.prisma.productSize.findMany({
    where: {product: args.id}
  });

  if (productSizes.length > 0) {
    for (let i = 0; i < productSizes.length; i++) {
      await context.prisma.productSize.update({
        data: {
          markUpPrice: markUp,
          priceWithMarkUp: (productSizes[i].price + markUp),
        },
        where: {
          id: productSizes[i].id
        }
      });
    }
  }

  return updatedProduct;
}

async function updateProductAvailability(parent, args, context, info) {
  const product = await context.prisma.product.findOne({
    where: { id: args.id },
  });

  if (!product) {
    var errorDetails = "No such product " + args.id + " found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProduct",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const param = {
    data: {
      isAvailable: args.isAvailable,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const updatedProduct = await context.prisma.product.update(param);

  if (!updatedProduct) {
    var errorDetails = "Unable to update product " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProduct",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  /**update availability of sizes belong to this product **/
  var productSizes = await context.prisma.productSize.updateMany({
    data: {
      isAvailable: args.isAvailable,
      updatedAt: getPHDateTimeNow(),
    },
    where: {product: args.id}
  });

  return updatedProduct;
}

async function updateProductActiveStatus(parent, args, context, info) {
  const product = await context.prisma.product.findOne({
    where: { id: args.id },
  });

  if (!product) {
    var errorDetails = "No such product " + args.id + " found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductActiveStatus",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const param = {
    data: {
      active: args.active,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const updatedProduct = await context.prisma.product.update(param);

  if (!updatedProduct) {
    var errorDetails = "Unable to update product " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductActiveStatus",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
}

async function deleteProduct(parent, args, context, info) {
  const product = await context.prisma.product.delete({
    where: { id: args.id },
  });

  if (!product) {
    var errorDetails = "Unable to delete product " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteProduct",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return product;
}

/**start product sizes**/
async function createProductSize(parent, args, context, info) {
  const merchantProductSize = await context.prisma.merchantProductSize.findOne({where: {id: args.merchantProductSize}});

  if (!merchantProductSize) {
    var errorDetails = "Unable to find Merchant's product size id: "+args.merchantProductSize;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const product = await context.prisma.product.findOne({
    where: {id: args.product}
  });

  var price = args.price ? args.price : 0;
  var markUp = product.markUpPrice ? product.markUpPrice : 0;//mark-up comes from product

  const productSize = await context.prisma.productSize.create({
    data: {
      merchantProductSize_merchantProductSizeToproductSize: {
        connect: { id: merchantProductSize.id }
      },
      product_productToproductSize: {
        connect: { id: args.product },
      },
      name: merchantProductSize.name,
      price: price,
      markUpPrice: markUp,
      priceWithMarkUp: parseFloat(price) + parseFloat(markUp),
      active: merchantProductSize.active,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!productSize) {
    var errorDetails = "Unable to create new product size.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return productSize;
}

async function updateProductSize(parent, args, context, info) {
  const productSize = await context.prisma.productSize.findOne({
    where: { id: args.id },
  });

  if (!productSize) {
    var errorDetails = "No such product size " + args.id + " found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const merchantProductSize = await context.prisma.merchantProductSize.findOne({where: {id: productSize.merchantProductSize}});

  if (!merchantProductSize) {
    var errorDetails = "Unable to find Merchant's product size id: "+productSize.merchantProductSize;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const product = await context.prisma.product.findOne({
    where: {id: productSize.product}
  });

  var price = args.price ? args.price : 0;
  var markUp = product.markUpPrice ? product.markUpPrice : 0;//mark-up comes from product

  const param = {
    data: {
      name: merchantProductSize.name,
      price: price,
      markUpPrice: markUp,
      priceWithMarkUp: parseFloat(price) + parseFloat(markUp),
      isAvailable: args.isAvailable,
      active: args.active,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const updatedProductSize = await context.prisma.productSize.update(param);

  if (!updatedProductSize) {
    var errorDetails = "Unable to update product size " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return updatedProductSize;
}

async function deleteProductSize(parent, args, context, info) {
  const productSize = await context.prisma.productSize.delete({
    where: { id: args.id },
  });

  if (!productSize) {
    var errorDetails = "Unable to delete product size " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return productSize;
}
/**end product sizes**/

/** start merchant product sizes **/
async function createMerchantProductSize(parent, args, context, info) {
  var markUp = args.markUpPrice ? args.markUpPrice : 0;

  const merchantProductSize = await context.prisma.merchantProductSize.create({
    data: {
      merchant_merchantTomerchantProductSize: {
        connect: { id: args.merchantID },
      },
      name: args.name,
      //price: args.price,
      //markUpPrice: markUp,
      //priceWithMarkUp: args.price + markUp,
      active: args.active,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!merchantProductSize) {
    var errorDetails = "Unable to create new product size.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createMerchantProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return merchantProductSize;
}

async function updateMerchantProductSize(parent, args, context, info) {
  const merchantProductSize = await context.prisma.merchantProductSize.findOne({
    where: { id: args.id },
  });

  if (!merchantProductSize) {
    var errorDetails = "No such merchant's product size " + args.id + " found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var markUp = args.markUpPrice ? args.markUpPrice : 0;

  const param = {
    data: {
      name: args.name,
      //price: args.price,
      //markUpPrice: markUp,
      //priceWithMarkUp: args.price + markUp,
      active: args.active,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const updatedMerchantProductSize = await context.prisma.merchantProductSize.update(param);

  if (!updatedMerchantProductSize) {
    var errorDetails = "Unable to update product size " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updatemerchantProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  await context.prisma.productSize.updateMany({
    data: {
      name: args.name,
      //price: args.price,
      //markUpPrice: markUp,
      //priceWithMarkUp: args.price + markUp,
      active: args.active,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      merchantProductSize: args.id,
    }
  });

  return updatedMerchantProductSize;
}

async function deleteMerchantProductSize(parent, args, context, info) {
  const merchantProductSize = await context.prisma.merchantProductSize.delete({
    where: { id: args.id },
  });

  if (!merchantProductSize) {
    var errorDetails = "Unable to delete product size " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteMerchantProductSize",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return merchantProductSize;
}
/** end merchant product sizes**/

async function createExpense(parent, args, context, info) {
  var amountStr = withPesoSign(args.amount);

  const expense = await context.prisma.expense.create({
    data: {
      name: args.name,
      amount: args.amount,
      amountStr: amountStr,
      expenseDate: new Date(args.expenseDate),
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!expense) {
    var errorDetails = "Unable to create new expense";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createExpense",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.photo) {
    const arg = { id: expense.id, photo: args.photo };
    await uploadExpensePhoto(parent, arg, context, info);
  }

  return expense;
}

async function updateExpense(parent, args, context, info) {
  const expense = await context.prisma.expense.findOne({
    where: { id: args.id },
  });

  if (!expense) {
    var errorDetails = "Expense " + args.id + " not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateExpense",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var amount = args.amount ? args.amount : expense.amount;
  var amountStr = withPesoSign(amount);

  const param = {
    data: {
      name: args.name ? args.name : expense.name,
      amount: amount,
      amountStr: amountStr,
      expenseDate: new Date(args.expenseDate),
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const updatedExpense = await context.prisma.expense.update(param);

  if (!updatedExpense) {
    var errorDetails = "Unable to update expense " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateExpense",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.photo) {
    const arg = { id: expense.id, photo: args.photo };
    await uploadExpensePhoto(parent, arg, context, info);
  }

  return updatedExpense;
}

async function deleteExpense(parent, args, context, info) {
  const expense = await context.prisma.expense.delete({
    where: { id: args.id },
  });

  if (!expense) {
    var errorDetails = "Unable to delete expense " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteExpense",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return expense;
}

function singleUpload(parent, args) {
  return args.file.then((file) => {
    const { createReadStream, filename, mimetype } = file;

    const fileStream = createReadStream();

    fileStream.pipe(fs.createWriteStream(`./uploadedFiles/sexy_${filename}`));

    return file;
  });
}

async function UploadToLocalStorage(parent, args, table) {
  return args.photo.then((file) => {
    const { createReadStream, filename, mimetype } = file;

    const fileStream = createReadStream();

    const name = `./uploadedFiles/${table}_${args.id}_${filename}`;

    fileStream.pipe(fs.createWriteStream(name));

    return name;
  });
}

async function uploadToAWS(parent, args, table) {
  const file = await args.photo;
  const { createReadStream, filename, mimetype } = file;
  const fileStream = createReadStream();
  const name = `${process.env.APP_ENV}_${table}_${args.id}_${filename}`;
  //Here stream it to S3
  // Enter your bucket name here next to "Bucket: "
  const uploadParams = {
    Bucket: "uat-herodelivery",
    Key: name,
    Body: fileStream,
    ACL: "public-read",
  };
  const result = await s3.upload(uploadParams).promise();

  if (!result) {
    var errorDetails = "Unable to upload to AWS S3";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "uploadToAWS",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  console.log(result);

  var url = "https://uat-herodelivery.sgp1.cdn.digitaloceanspaces.com/" + name;

  return url;
}

async function uploadPhoto(parent, args, table) {
  //const uploaded = await uploadToLocalStorage(parent, args, table);
  const uploaded = await uploadToAWS(parent, args, table);

  return uploaded;
}

async function uploadUserPhoto(parent, args, context, info) {
  //await deleteUserPhoto(parent, args, context, info);

  const photoPath = await uploadPhoto(parent, args, "users");

  if (photoPath) {
    const param = {
      data: {
        photo: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const user = await context.prisma.user.update(param);

    if (!user) {
      var errorDetails =
        "Unable to update user " + args.id + " with its new photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadUserPhoto",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return user;
  }
}

async function uploadUserValidIdImg(parent, args, context, info){
  const photoPath = await uploadPhoto(parent, args, "users");

  if (photoPath) {
    const param = {
      data: {
        validIdImg: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const user = await context.prisma.user.update(param);

    if (!user) {
      var errorDetails =
        "Unable to update user " + args.id + " with its new valid ID";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadUserValidIdImg",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return user;
  } 
}

async function uploadValidIdImg(parent, args, context, info) {
  //await deleteUserPhoto(parent, args, context, info);

  const photoPath = await uploadPhoto(parent, args, "users");

  if (photoPath) {
    const param = {
      data: {
        validIdImg: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const user = await context.prisma.user.update(param);

    if (!user) {
      var errorDetails =
        "Unable to update user " + args.id + " with its new valid ID image";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadValidIdImg",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return user;
  }
}

async function deleteUserPhoto(parent, args, context, info) {
  const user = await context.prisma.user.findOne({ where: { id: args.id } });

  if (!user) {
    var errorDetails = "User " + args.id + " not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteUserPhoto",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (user.photo) {
    const fileToDelete = user.photo;

    fs.unlinkSync(fileToDelete);

    return fileToDelete;
  }
}

async function uploadProductPhoto(parent, args, context, info) {
  //await deleteProductPhoto(parent, args, context, info);

  const photoPath = await uploadPhoto(parent, args, "products");

  if (photoPath) {
    const param = {
      data: {
        photo: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const product = await context.prisma.product.update(param);

    if (!product) {
      var errorDetails =
        "Unable to update product " + args.id + " with its new photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadProductPhoto",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return product;
  }
}

async function deleteProductPhoto(parent, args, context, info) {
  const product = await context.prisma.product.findOne({
    where: { id: args.id },
  });

  if (!product) {
    throw new Error("No such product found");
  }

  if (product.photo) {
    const fileToDelete = product.photo;

    fs.unlinkSync(fileToDelete);

    return fileToDelete;
  }
}

async function uploadExpensePhoto(parent, args, context, info) {
  //await deleteExpensePhoto(parent, args, context, info);

  const photoPath = await uploadPhoto(parent, args, "expenses");

  if (photoPath) {
    const param = {
      data: {
        photo: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const expense = await context.prisma.expense.update(param);

    if (!expense) {
      var errorDetails =
        "Unable to update expense " + args.id + " with its new photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadExpensePhoto",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return expense;
  }
}

async function deleteExpensePhoto(parent, args, context, info) {
  const expense = await context.prisma.expense.findOne({
    where: { id: args.id },
  });

  if (!expense) {
    throw new Error("No such expense found");
  }

  if (expense.photo) {
    const fileToDelete = expense.photo;

    fs.unlinkSync(fileToDelete);

    return fileToDelete;
  }
}

async function uploadMerchantPhoto(parent, args, context, info) {
  //await deleteMerchantPhoto(parent, args, context, info);

  const photoPath = await uploadPhoto(parent, args, "merchants");

  if (photoPath) {
    const param = {
      data: {
        photo: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const merchant = await context.prisma.merchant.update(param);

    if (!merchant) {
      var errorDetails =
        "Unable to update merchant " + args.id + " with its new photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadMerchantPhoto",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return merchant;
  }
}

async function uploadMerchantTrendingPhoto(parent, args, context, info) {
  //await deleteMerchantPhoto(parent, args, context, info);

  const photoPath = await uploadPhoto(parent, args, "merchants");

  if (photoPath) {
    const param = {
      data: {
        trendingPhoto: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const merchant = await context.prisma.merchant.update(param);

    if (!merchant) {
      var errorDetails =
        "Unable to update merchant " + args.id + " with its new trending photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadMerchantTrendingPhoto",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return merchant;
  }
}

async function deleteMerchantPhoto(parent, args, context, info) {
  const merchant = await context.prisma.merchant.findOne({
    where: { id: args.id },
  });

  if (!merchant) {
    throw new Error("No such merchant found");
  }

  if (merchant.photo) {
    const fileToDelete = merchant.photo;

    fs.unlinkSync(fileToDelete);

    return fileToDelete;
  }
}

async function uploadHeroNbi(parent, args, context, info) {
  const photoPath = await uploadPhoto(parent, args, "heroes");

  if (photoPath) {
    const param = {
      data: {
        photoNbiNo: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const hero = await context.prisma.hero.update(param);

    if (!hero) {
      var errorDetails =
        "Unable to update hero " + args.id + " with its new NBI photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadHeroNbi",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return hero;
  }
}

async function uploadHeroPoliceClearance(parent, args, context, info) {
  const photoPath = await uploadPhoto(parent, args, "heroes");

  if (photoPath) {
    const param = {
      data: {
        photoPoliceClearanceNo: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const hero = await context.prisma.hero.update(param);

    if (!hero) {
      var errorDetails =
        "Unable to update hero " + args.id + " with its new Police clearance photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadHeroPoliceClearance",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return hero;
  }
}

async function uploadHeroPlateNo(parent, args, context, info) {
  const photoPath = await uploadPhoto(parent, args, "heroes");

  if (photoPath) {
    const param = {
      data: {
        photoPlateNo: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const hero = await context.prisma.hero.update(param);

    if (!hero) {
      var errorDetails =
        "Unable to update hero " + args.id + " with its new Plate Number photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadHeroPlateNo",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return hero;
  }
}

async function uploadHeroDrivingLicense(parent, args, context, info) {
  const photoPath = await uploadPhoto(parent, args, "heroes");

  if (photoPath) {
    const param = {
      data: {
        photoLicenseNo: photoPath,
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    const hero = await context.prisma.hero.update(param);

    if (!hero) {
      var errorDetails =
        "Unable to update hero " + args.id + " with its new Driving License photo";
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "uploadHeroDrivingLicense",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return hero;
  }
}

async function createHero(parent, args, context, info) {
  const hero = await context.prisma.hero.create({
    data: {
      ...args,
      //companyId: 'HERO-'+companyIdSuffix,
      user_heroTouser: { connect: { id: args.user_heroTouser } },
      birthday: new Date(args.birthday),
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!hero) {
    var errorDetails = "Unable to create new hero";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return hero;
}

async function updateHero(parent, args, context, info) {
  const hero = await context.prisma.hero.findOne({ where: { id: args.id } });

  if (!hero) {
    var errorDetails = "Unable to find hero " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const updatedHero = await context.prisma.hero.update({
    where: { id: args.id },
    data: {
      sex: args.sex ? args.sex : hero.sex,
      birthday: args.birthday
        ? new Date(args.birthday)
        : new Date(hero.birthday),
      nbiNo: args.nbiNo ? args.nbiNo : hero.nbiNo,
      policeClearanceNo: args.policeClearanceNo
        ? args.policeClearanceNo
        : hero.policeClearanceNo,
      plateNo: args.plateNo ? args.plateNo : hero.plateNo,
      licenseNo: args.licenseNo ? args.licenseNo : hero.licenseNo,
      collectedAmount: args.collectedAmount
        ? args.collectedAmount
        : hero.collectedAmount,
      earnings: args.earnings ? args.earnings : hero.earnings,
      city: args.city ? args.city : hero.city,
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!updatedHero) {
    var errorDetails = "Unable to update hero " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return updatedHero;
}

async function uploadHeroGallery(parent, args, context, info) {
  const photoPath = await uploadPhoto(parent, args, "heroGalleries");

  if (photoPath) {
    const heroGallery = await context.prisma.createHeroGallery({
      photo: photoPath,
      hero: { connect: { id: args.hero } },
    });

    return heroGallery;
  }
}

async function deleteHeroGallery(parent, args, context, info) {
  const heroGallery = await context.prisma.heroGallery.delete({
    where: { id: args.id },
  });

  return heroGallery;
}

async function createOrderStatus(parent, args, context, info) {
  const orderStatus = await context.prisma.orderStatus.create({
    data: {
      ...args,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  return orderStatus;
}

async function updateOrderStatus(parent, args, context, info) {
  const param = {
    data: {
      name: args.name,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };
  console.log("param >>> ", param);

  const orderStatus = await context.prisma.orderStatus.update(param);

  return orderStatus;
}

async function deleteOrderStatus(parent, args, context, info) {
  const orderStatus = await context.prisma.orderStatus.delete({
    where: { id: args.id },
  });

  return orderStatus;
}

async function updateOrderProducts(parent, args, context, info) {
  orderArgs = {id: args.orderId};
  const order = await context.prisma.order.findOne({where: {id: args.orderId}});
  
  const selectedOrderProducts = args.selectedOrderProducts;
  const selectedOrderProductIds = selectedOrderProducts.map(orderProduct => orderProduct.id);
  const orderProductDifference = selectedOrderProducts.map(orderProduct => orderProduct.newQuantity);
  if (!order) {
    var errorDetails = "Order ID "+args.orderId+" not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrderProducts",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  } else if (!selectedOrderProducts.length) {
    var errorDetails = "No order products to delete in order id "+args.orderId;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrderProducts",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  } else {
    //var orderProductsArgs = {order: args.orderId, orderByDir: 'ASC'};
    //const orderProducts = await Query.orderProducts(parent, orderProductsArgs, context, info);
    const orderProducts = await context.prisma.orderProduct.findMany({
      where: {order: args.orderId},
      orderBy: {id: 'asc'}
    });

    var unavailableProductIds = [];
    var unavailableProductSizeIds = [];
    var orderProductsArray = [];
    var newTotal = 0;
    var newMarkUpTotal = 0;
    var indexQty = 0;
    if (orderProducts.length) {
      for (var i = 0; i < orderProducts.length; i++) {   
        /**
        If current loop is in array:
          1. store its product id in unavailableProductIds array
          2. add subtotal to deductSubtotal
          3. add markUpTotal to deductMarkUpTotal variable
        **/
        if (selectedOrderProductIds.includes(orderProducts[i].id)) {
          if (orderProducts[i].productSize > 0) {//product size is unavailable
            unavailableProductSizeIds.push(orderProducts[i].productSize);
          } else {//no size, set product to unavailalbe
            unavailableProductIds.push(orderProducts[i].product);
          }

          console.log("product id: "+orderProducts[i].product);
          console.log("product size id: "+orderProducts[i].productSize);
          var quantity = orderProductDifference[indexQty];//orderProducts[i].quantity - args.subtrahendQty[indexQty];
          console.log("result quantity: "+quantity);
          
          if (quantity < 0) {
            var errorDetails = "Order Product ID "+orderProducts[i].id+" should not have a negative quantity of "+quantity;
            var error = {
              details: errorDetails,
              type: "M",
              functionName: "updateOrderProducts",
            };
            await insertErrorLog(error);
            throw new Error(errorDetails);
          } else if (quantity > orderProducts[i].quantity) {
            var errorDetails = "Order Product ID "+orderProducts[i].id+" new quantity "+quantity+" is greater than "+orderProducts[i].quantity;
            var error = {
              details: errorDetails,
              type: "M",
              functionName: "updateOrderProducts",
            };
            await insertErrorLog(error);
            throw new Error(errorDetails);
          }

          var subtotal = quantity * (orderProducts[i].price + orderProducts[i].markUpPrice);
          var markUpTotal = quantity * orderProducts[i].markUpPrice;
          newTotal += subtotal;
          newMarkUpTotal += markUpTotal;
          orderProductsArray.push({
            data: {
              quantity: quantity,
              subtotal: subtotal,
              markUpTotal: markUpTotal,
              updatedAt: getPHDateTimeNow()
            },
            where: {id: orderProducts[i].id}
          });
          indexQty++;
        } else {
          newTotal += orderProducts[i].subtotal;
          newMarkUpTotal += orderProducts[i].markUpTotal;
        }
      }//end loop


      //start new function here
      var unavailableArgs = {
        orderId: orderId,
        unavailableProductIds: unavailableProductIds, 
        unavailableProductSizeIds: unavailableProductSizeIds
      };
      await setProductAndSizesUnavailable(parent, unavailableArgs, context, info);

      const merchant = await context.prisma.merchant.findOne({where: {id: order.merchant}});
      const costing = await context.prisma.costing.findOne({where: {id: 1}});
      const coupon = order.coupon ? await context.prisma.coupon.findOne({where: {id: order.coupon}}) : null;
      var deliverFee = deductDeliveryFeeFromMinSpend(merchant.myHeroShare, order.origDeliveryFee, merchant.minimumSpend, newTotal, costing, merchant);
      var appFee = calculateAppFee(merchant, costing, newTotal);
      var freeDeliveryCost = calculateFreeDeliveryCost(merchant, costing, newTotal);
      var heroEarnings = calculateHeroEarnings(merchant, order.origDeliveryFee, order.total, order.appFee, deliverFee, order.excessDeliveryFee);
      var finalTotal = calculateFinalTotal(newTotal, deliverFee, merchant, coupon);
      var riderShare = calculateRiderShare(merchant, newTotal);
      var myHeroShareAmount = calculateMyHeroShareAmount(newTotal, merchant.myHeroShare);
      var origFinalTotal = calculateOrigFinalTotal(newTotal, deliverFee);
      //update order's total, final total and mark-up total
      var orderParam = {
        data: {
          total: newTotal,
          finalTotal: parseFloat(finalTotal),
          origFinalTotal: parseFloat(origFinalTotal),
          riderShare: parseFloat(riderShare),
          deliveryFee: deliverFee,//we need to change delivery fee as well since total order got changed.
          freeDeliveryCost: parseFloat(freeDeliveryCost),
          heroEarnings: parseFloat(heroEarnings),
          markUpTotal: newMarkUpTotal,
          myHeroIncome: parseFloat(newMarkUpTotal) + parseFloat(appFee) + parseFloat(myHeroShareAmount),
          gteMinSpend: isGreaterThanOrEqualMinSpend(merchant, order.total),
          updatedAt: getPHDateTimeNow(),
          orderProduct: {
            update: orderProductsArray,
          }
        },
        where: {
          id: args.orderId
        }
      }; 

      const updatedOrder = await context.prisma.order.update(orderParam);

      if (!updatedOrder) {
        var errorDetails = "Unable to update order id "+args.orderId;
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateOrderProducts",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);        
      }

      var updateEstPrepTimeArgs = {orderId: args.orderId};
      await updateEstPrepTime(parent, updateEstPrepTimeArgs, context, info);

      return updatedOrder;
    } else {
      var errorDetails = "No such order products found with order id "+args.orderId;
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "updateOrderProducts",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }
  }
}

async function seenOrders(parent, args, context, info) {
  const orders = await context.prisma.order.updateMany({
    data: {
      seen: true,
      updatedAt: getPHDateTimeNow()
    },
    where: {
      id: {in: args.orderIds}
    }
  });

  const updatedOrders = await context.prisma.order.findMany({
    where: {
      id: {in: args.orderIds}
    }
  });

  return updatedOrders;
}

async function setProductAndSizesUnavailable(parent, args, context, info) {
  var productParam = {
    data: {
      isAvailable: false,
      updatedAt: getPHDateTimeNow()
    },
    where: {
      id: {in: args.unavailableProductIds}
    }
  }; 

  const unavailabledProduct = await context.prisma.product.updateMany(productParam);
  
  if (!unavailabledProduct) {
    var errorDetails = "Unable to set products to unavailabled with order id "+args.orderId;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "setProductAndSizesUnavailable",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var productSizeParam = {
    data: {
      isAvailable: false,
      updatedAt: getPHDateTimeNow()
    },
    where: {
      id: {in: args.unavailableProductSizeIds}
    }
  }; 
  
  const unavailabledProductSize = await context.prisma.productSize.updateMany(productSizeParam);
  
  if (!unavailabledProductSize) {
    var errorDetails = "Unable to set product sizes to unavailabled with order id "+args.orderId;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "setProductAndSizesUnavailable",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const unavailableProductSizes = await context.prisma.productSize.findMany({
    where: {
      id: {in: args.unavailableProductSizeIds}
    },
    orderBy: {id: 'asc'}
  });

  if (unavailableProductSizes.length) {
    var productsWithNoMoreAvailableSizes = [];
    //for each unavailableProductSizes[i].product, we will count how many are still available, if no more available, make the product itself unavailable.
    for (var i = 0; i < unavailableProductSizes.length; i++) {
      var totalAvailableProductSize = await context.prisma.productSize.count({
        where: {
          product: unavailableProductSizes[i].product,
          isAvailable: true,
          active: true
        }
      });

      if (totalAvailableProductSize == 0) {//no more available, collect thse product ids
        productsWithNoMoreAvailableSizes.push(unavailableProductSizes[i].product);
      }  
    }//end loop

    if (productsWithNoMoreAvailableSizes.length) {//set these products to isAvailable = false
      var productsWithNoMoreAvailableSizeParam = {
        data: {
          isAvailable: false,
          updatedAt: getPHDateTimeNow()
        },
        where: {
          id: {in: productsWithNoMoreAvailableSizes}
        }
      }; 

      await context.prisma.product.updateMany(productsWithNoMoreAvailableSizeParam);
    }
  }
}

async function updateOrderAddons(parent, args, context, info) {
  orderArgs = {id: args.orderId};
  const order = await context.prisma.order.findOne({where: {id: args.orderId}});
  
  const selectedOrderAddons = args.selectedOrderAddons;
  const selectedOrderAddonIds = selectedOrderAddons.map(orderAddon => orderAddon.id);
  const orderAddonDifference = selectedOrderAddons.map(orderAddon => orderAddon.newQuantity);
  if (!order) {
    var errorDetails = "Order ID "+args.orderId+" not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrderAddons",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  } else if (!selectedOrderAddons.length) {
    var errorDetails = "No order add-ons to delete in order id "+args.orderId;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrderAddons",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  } else {
    var orderAddonsArgs = {order: args.orderId, orderByDir: 'ASC'};
    //const orderAddons = await Query.orderAddons(parent, orderAddonsArgs, context, info);
    const orderAddons = await context.prisma.orderAddon.findMany({
      where: {order: args.orderId},
      orderBy: {id: 'asc'}
    });

    var unavailableAddonIds = [];
    var orderAddonsArray = [];
    var newTotal = 0;
    var newMarkUpTotal = 0;
    var indexQty = 0;
    if (orderAddons.length) {
      for (var i = 0; i < orderAddons.length; i++) {   
        /**
        If current loop is in array:
          1. store its addon id in unavailableAddonIds array
          2. add subtotal to deductSubtotal
          3. add markUpTotal to deductMarkUpTotal variable
        **/
        if (selectedOrderAddonIds.includes(orderAddons[i].id)) {
          unavailableAddonIds.push(orderAddons[i].addon);
          console.log("add-on id: "+orderAddons[i].addon);
          var quantity = orderAddonDifference[indexQty];//orderAddons[i].quantity - args.subtrahendQty[indexQty];
          console.log("result quantity: "+quantity);
          
          if (quantity < 0) {
            var errorDetails = "Order Add-on ID "+orderAddons[i].id+" should not have a negative quantity of "+quantity;
            var error = {
              details: errorDetails,
              type: "M",
              functionName: "updateOrderAddons",
            };
            await insertErrorLog(error);
            throw new Error(errorDetails);
          } else if (quantity > orderAddons[i].quantity) {
            var errorDetails = "Order Add-on ID "+orderAddons[i].id+" new quantity "+quantity+" is greater than "+orderAddons[i].quantity;
            var error = {
              details: errorDetails,
              type: "M",
              functionName: "updateOrderAddons",
            };
            await insertErrorLog(error);
            throw new Error(errorDetails);
          }

          var subtotal = quantity * (orderAddons[i].price + orderAddons[i].markUpPrice);
          var markUpTotal = quantity * orderAddons[i].markUpPrice;
          newTotal += subtotal;
          newMarkUpTotal += markUpTotal;
          orderAddonsArray.push({
            data: {
              quantity: quantity,
              subtotal: subtotal,
              markUpTotal: markUpTotal,
              updatedAt: getPHDateTimeNow()
            },
            where: {id: orderAddons[i].id}
          });
          indexQty++;
        } else {
          newTotal += orderAddons[i].subtotal;
          newMarkUpTotal += orderAddons[i].markUpTotal;
        }
      }

      var addonParam = {
        data: {
          isAvailable: false,
          updatedAt: getPHDateTimeNow()
        },
        where: {
          id: {in: unavailableAddonIds}
        }
      }; 

      const unavailabledAddon = await context.prisma.addon.updateMany(addonParam);
      
      if (!unavailabledAddon) {
        var errorDetails = "Unable to set addons to unavailabled with order id "+args.orderId;
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateOrderAddons",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      //update order's total, final total and mark-up total
      var orderParam = {
        data: {
          total: order.total - newTotal,
          finalTotal: ((order.total - newTotal) + order.deliveryFee),
          markUpTotal: order.markUpTotal - newMarkUpTotal,
          updatedAt: getPHDateTimeNow(),
          orderAddon: {
            update: orderAddonsArray,
          }
        },
        where: {
          id: args.orderId
        }
      }; 

      const updatedOrder = await context.prisma.order.update(orderParam);

      if (!updatedOrder) {
        var errorDetails = "Unable to update order id "+args.orderId;
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateOrderAddons",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);        
      }

      return updatedOrder;
    } else {
      var errorDetails = "No such order addons found with order id "+args.orderId;
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "updateOrderAddons",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }
  }
}

async function createOrder(parent, args, context, info) {
  //await authorize(context);
  //await authorizeMobile(context);
  const orderProductsArray = [];
  var orderAddonsArray = [];
  var total = 0;
  var markUpTotalSum = 0;

  var costing = await context.prisma.costing.findOne({ where: { id: 1 } });
  const merchant = await context.prisma.merchant.findOne({where: {id: args.merchant}});

  if (!costing) {
    var errorDetails = "No such costing found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (merchant.isTrending) {//Override costing's firstKmCost and appFe
    costing = {firstKmCost: merchant.trendingFlatRate, appFee: merchant.trendingAppFee};
  }

  // Get computed distance based on costing (case is not trending)
  var distanceAndDeliveryFee = args.deliveryFee > 0
      ? args.deliveryFee
      : await getDistanceAndDeliveryFee(
          parent,
          args,
          context,
          info,
          costing,
          "order"
        );
      
  args.merchantToCustomerKm = args.merchantToCustomerKm >= 0 && args.deliveryFee > 0 ? args.merchantToCustomerKm : distanceAndDeliveryFee.distance;
      
  args.deliveryFee = args.deliveryFee > 0 ? args.deliveryFee : distanceAndDeliveryFee.deliveryFee;

  const lastCheckHero = await getLastCheckHeroOfLastOrder(
    parent,
    args,
    context,
    info
  );

  for (var i = 0; i < args.orderProducts.length; i++) {
    /**start calculation for order product**/
    var markUp = args.orderProducts[i].markUpPrice
      ? args.orderProducts[i].markUpPrice
      : 0;

    /**for some reason, vince passed price + mark-up in args.orderProducts[i].price**/
    var priceOnly = parseFloat(args.orderProducts[i].price);// - parseFloat(markUp);

    var subtotal = (priceOnly + markUp) * args.orderProducts[i].quantity;
    var markUpTotalPrice = markUp * args.orderProducts[i].quantity;
    /**end calculation for order product**/

    var orderAddon = {};
    var currentOrderAddons = args.orderProducts[i].orderAddons;//array of order addons of this specific order product
    var orderAddonsArray = [];

    if (currentOrderAddons.length) {//orderAddons in orderProducts current index      
      for (var a = 0; a < currentOrderAddons.length; a++) {
        //start calculation for order-addons
        var addonMarkUp = currentOrderAddons[a].markUpPrice
        ? currentOrderAddons[a].markUpPrice
        : 0;

        //for some reason, vince passed price + mark-up in args.orderProducts[i].price
        var addonPriceOnly = parseFloat(currentOrderAddons[a].price);// - parseFloat(addonMarkUp);

        var addonSubtotal = ((addonPriceOnly + addonMarkUp) * currentOrderAddons[a].quantity) * args.orderProducts[i].quantity;
        var addonMarkUpTotalPrice = (addonMarkUp * currentOrderAddons[a].quantity) * args.orderProducts[i].quantity;
        //end calculation for order-addons

        orderAddonsArray.push({
          addon_addonToorderAddon: {connect: {id: currentOrderAddons[a].addon}},
          product_orderAddonToproduct: {connect: {id: currentOrderAddons[a].product}},
          price: addonPriceOnly,
          markUpPrice: addonMarkUp,
          quantity: currentOrderAddons[a].quantity,
          subtotal: addonSubtotal,
          markUpTotal: addonMarkUpTotalPrice,
          createdAt: getPHDateTimeNow(),
          updatedAt: getPHDateTimeNow()
        });

        markUpTotalSum += addonMarkUpTotalPrice;
        total += addonSubtotal;
      }
    }

    orderProductsArray.push({
      product_orderProductToproduct: {
        connect: { id: args.orderProducts[i].product },
      },
      productSize_orderProductToproductSize: args.orderProducts[i].productSize 
        ? { connect: { id: args.orderProducts[i].productSize}} 
        : undefined,
      coupon_couponToorderProduct: args.orderProducts[i].coupon
        ? { connect: { id: args.orderProducts[i].coupon } }
        : undefined,
      price: priceOnly,
      markUpPrice: markUp,
      quantity: args.orderProducts[i].quantity,
      subtotal: subtotal,
      markUpTotal: markUpTotalPrice,
      sugarLevel: args.orderProducts[i].sugarLevel ? args.orderProducts[i].sugarLevel : 0,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
      orderAddon: {
        create: orderAddonsArray,
      }
    });

    markUpTotalSum += markUpTotalPrice;
    total += subtotal;
  }
  // args.locality = "Isulan";
  var hero = await assignHeroFromCode(parent, args, context, info);
  var deliverFee = deductDeliveryFeeFromMinSpend(merchant.myHeroShare, args.deliveryFee, merchant.minimumSpend, args.total, costing, merchant);
  var appFee = calculateAppFee(merchant, costing, args.total);
  var freeDeliveryCost = calculateFreeDeliveryCost(merchant, costing, args.total);
  var excessDeliveryFee = args.excessDeliveryFee ? args.excessDeliveryFee : 0;
  var heroEarnings = calculateHeroEarnings(merchant, args.deliveryFee, args.total, costing.appFee, deliverFee, excessDeliveryFee);
  const coupon = args.couponCode ? await context.prisma.coupon.findOne({where: {code: args.couponCode}}) : null;
  const couponLocality = (coupon) ? await context.prisma.couponLocality.findMany({where: {coupon: coupon.id}}) : null;
  var finalTotal = calculateFinalTotal(args.total, deliverFee, merchant, coupon, args.locality, couponLocality);
  var origFinalTotal = calculateOrigFinalTotal(args.total, deliverFee);
  var riderShare = calculateRiderShare(merchant, args.total);
  var myHeroShareAmount = calculateMyHeroShareAmount(args.total, merchant.myHeroShare);
  
  if (coupon)
  {
    const couponMessages = isCouponValidMessages(coupon, merchant, args.locality, couponLocality, args.total);
    if (couponMessages != "")
    {
      var errorDetails = couponMessages;
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "createOrder",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }
  }
  // args.isForSomeone = true;
  // var isForSomeone = 1;
  // var receiverFullName = "Daniel";
  // var receiverContactNumber = "09612470136";
  (args.isForSomeone) ? args.isForSomeone : false;
  var param = {
    data: {
      user: { connect: { id: args.user } },
      hero_heroToorder: { connect: { id: hero.id } },
      merchant_merchantToorder: { connect: { id: args.merchant } },
      orderStatus_orderToorderStatus: { connect: { id: 1 } },
      //branch_branchToorder: { connect: { id: merchant.branch } },
      branch_branchToorder: { connect: { id: 1 } },
      heroCode: hero.found ? hero.code : null,
      coupon_couponToorder: (coupon) ? { connect: { id: coupon.id } } : undefined,
      isForSomeone: args.isForSomeone,
      receiverFullName: (args.isForSomeone) ? args.receiverFullName : null,
      receiverContactNumber: (args.isForSomeone) ? args.receiverContactNumber : null,
      locality: args.locality,
      address: args.address,
      landmark: args.landmark,
      customerLat: args.customerLat,
      customerLng: args.customerLng,
      isTrending: merchant.isTrending,
      total: args.total,
      finalTotal: parseFloat(finalTotal),
      origFinalTotal: parseFloat(origFinalTotal),
      deliveryFee: deliverFee,
      trendingDeliveryFee: merchant.isTrending ? deliverFee : 0.00,
      riderShare: calculateRiderShare(merchant, args.total),
      origDeliveryFee: args.deliveryFee,
      excessDeliveryFee: args.excessDeliveryFee ? parseFloat(args.excessDeliveryFee) : 0,
      freeDeliveryCost: parseFloat(freeDeliveryCost),
      appFee: costing.appFee,
      heroEarnings: parseFloat(heroEarnings),
      markUpTotal: markUpTotalSum,
      couponsAmount: (coupon) && isCouponValid(coupon, merchant, args.locality, couponLocality, args.total) ? parseFloat(coupon.fixedDeduction) : 0,
      myHeroIncome: parseFloat(markUpTotalSum) + parseFloat(appFee) + parseFloat(myHeroShareAmount),
      lastCheckHero: lastCheckHero,
      merchantToCustomerKm: args.merchantToCustomerKm,
      merchantToRiderKm: args.merchantToRiderKm,
      customerRequest: args.customerRequest,
      gteMinSpend: isGreaterThanOrEqualMinSpend(merchant, args.total),
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
      orderProduct: {
        create: orderProductsArray,
      },
      transaksyon: {
        create: [
          {
            orderStatus_orderStatusTotransaksyon: { connect: { id: 1 } },
            createdAt: getPHDateTimeNow(),
            updatedAt: getPHDateTimeNow()
          },
        ],
      },
    },
  };

  const order = await context.prisma.order.create(param);
  if (coupon) 
  {
    var validCoupon = isCouponValid(coupon, merchant, args.locality, couponLocality, args.total);
    if(validCoupon && order)
    {
      console.log(coupon);
      var couponParam = {
        data: {
          numberOfUse: coupon.numberOfUse + 1,
          updatedAt: moment().toISOString(),
        },
        where: { id: coupon.id },
      };
      const updateCouponNumberOfUse = await context.prisma.coupon.update(couponParam);
      if (!updateCouponNumberOfUse) {
        var errorDetails =
          "Unable to update coupon (id:" +
          coupon.id +
          ")";
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "createOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }
    }
  }
  if (!order) {
    var errorDetails =
      "Unable to create new order (user id:" +
      args.user +
      "; merchant: " +
      args.merchant +
      "; lastCheckHero: " +
      lastCheckHero +
      ")";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var orderAddonParam = {id: order.id};
  await updateOrderIdInOrderAddOn(parent, orderAddonParam, context, info);

  //context.pubsub.publish("UPDATED_ORDER", order);
  var wordsOfWisdom = getWordsOfWisdom();
  var messageOrder = {order, wordsOfWisdom};

  context.pubsub.publish("UPDATED_ORDER", { updatedOrder: messageOrder });
  context.pubsub.publish("ORDER_TO_ME", { orderToMe: messageOrder }); //for merchant
  await refreshUI(parent, args, context, info);
  await autoMerchantConfirmed(parent, args, context, info);

  /***
  Push notification
  **/
  var notifyUsersArgs = {order: order, id: order.id, status: 1};
  await notifyUsers(parent, notifyUsersArgs, context, info);
 
  return order;
}

async function updateOrderIdInOrderAddOn(parent, args, context, info) {
  var orderId = args.id;

  const orderProducts = await context.prisma.orderProduct.findMany({
    where: {order: orderId},
    orderBy: {id: 'asc'}
  });

  var orderProductIds = orderProducts.map(orderProduct => orderProduct.id);

  const orderAddons = await context.prisma.orderAddon.findMany({
    where: {orderProduct: {in: orderProductIds}},
    orderBy: {id: 'asc'}
  });

  if (orderAddons.length) {
    for (var i = 0; i < orderAddons.length; i++) {
      var setOrderIdInOrderAddon = await context.prisma.orderAddon.update({
        data: {
          order_orderToorderAddon: {
            connect: {id: orderId}
          }
        },
        where: {id: orderAddons[i].id}
      });

      if (!setOrderIdInOrderAddon) {
        var errorDetails = "Unable to set order id in order add-ons module. It might be no add-ons for order " + args.id;
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateOrderIdInOrderAddOn",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }
    }

    return orderAddons;
  }

  return 0;
}

async function mutationHeroByCode(parent, args, context, info) {
  const hero = await context.prisma.hero.findOne({where: {code: args.code}});

  if (!hero) {
    throw new Error("No such hero found");
  }

  return hero;
}

async function assignHeroFromCode(parent, args, context, info) {
  var heroId = 1;
  var code = null;
  var found = false;

  if (args.heroCode) {
    var position = args.heroCode.indexOf('-');
    
    if (position == 3) {//search hero of that code
      var param = {code: args.heroCode};
      var hero = await mutationHeroByCode(parent, param, context, info);
    } else if (args.heroCode.length == 6) {
      var letters = args.heroCode.substring(0, 3);
      var numbers = args.heroCode.substring(3);
      var code = `${letters}-${numbers}`;
      var param = {code: code};

      var hero = await mutationHeroByCode(parent, param, context, info);
    }

    if (hero) {
      heroId = hero.id;
      code = param.code;
      found = true;
    }
  }

  var result = {
    id: heroId,
    code: code,
    found: found
  };

  return result;
}

/*ANGELO start temporary function*/
async function getDistanceAndDeliveryFee(
  parent,
  args,
  context,
  info,
  costing,
  type
) 
{
  if(type == "order") 
  {
    var merchantId = args.merchant;
    var merchant = await context.prisma.merchant.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error("No such merchant found");
    }
  }
  if(type == "errand") 
  {
    var merchant = args.errandsLatLng;
  }
  const customerCoordinates = {
    latitude: args.customerLat,
    longitude: args.customerLng,
  };
  const merchantCoordinates = [
    {
      lat: merchant.lat,
      lng: merchant.lng,
    },
  ];
  //do the calculation here
  const distanceAndDeliveryFee = await merchantsWithDistance({
    costing,
    merchants: merchantCoordinates,
    customerCoordinates,
  });
  const distance = (distanceAndDeliveryFee[0] || {}).distance
    ? (distanceAndDeliveryFee[0] || {}).distance
    : 0;

  const deliveryFee = (distanceAndDeliveryFee[0] || {}).deliveryFee
    ? (distanceAndDeliveryFee[0] || {}).deliveryFee
    : 0;

  return {
    distance,
    deliveryFee,
  };
}
/*ANGEL0 end temporary function*/

/**
 * Get Heroes who cancelled this order
 */
async function getHeroesWhoCancelledOrder(parent, args, context, info) {
  var excludedHeroes = [];

  var sql =
    "SELECT hero AS id FROM heroCancelledOrder WHERE `order` = " + args.id;
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get heroes who cancelled order " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getHeroesWhoCancelledOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      excludedHeroes.push(rider.id);
    });
  }

  return excludedHeroes;
}

/**
 * Get Heroes who are busy
 */
async function getBusyHeroes(parent, args, context, info) {
  var excludedHeroes = [];

  var sql =
    "SELECT hero AS id FROM `order` WHERE orderStatus IN (2, 3, 4, 5, 6) GROUP BY hero";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get busy heroes";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getBusyHeroes",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      excludedHeroes.push(rider.id);
    });
  }

  return excludedHeroes;
}

async function getLastCheckHeroOfPreviousOrder(parent, args, context, info) {
  var heroId = 0;
  var prevOrderId = parseInt(args.id) - parseInt(1);

  if (args.locality) {
    var sql = "SELECT lastCheckHero AS id FROM `order` WHERE id <= " + prevOrderId + " AND locality = '"+args.locality+"' ORDER BY order.id DESC LIMIT 1";
  } else {
    var sql = "SELECT lastCheckHero AS id FROM `order` WHERE id = " + prevOrderId; 
  }

  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get last check hero of previous order";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getLastCheckHeroOfPreviousOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroId = rider.id;
    });
  }

  return heroId;
}

async function getLastCheckHeroOfLastOrder(parent, args, context, info) {
  var heroId = 0;
  var prevOrderId = parseInt(args.id) - parseInt(1);

  var sql = "SELECT lastCheckHero FROM `order` ORDER BY id DESC LIMIT 1";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get last check hero of last order";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getLastCheckHeroOfLastOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroId = rider.lastCheckHero;
    });
  }

  if (!heroId) {
    return 1;
  }

  return heroId;
}

async function getFirstAvailableHero(parent, args, context, info) {
  var heroId = 0;

  if (args.locality) {
    var sql = "SELECT id FROM hero WHERE isRescuer = 0 AND isAvailable = 1 AND active = 1 AND locality = '"+args.locality+"' ORDER BY id ASC LIMIT 1";
  } else {
    var sql = "SELECT id FROM hero WHERE isRescuer = 0 AND isAvailable = 1 AND active = 1 ORDER BY id ASC LIMIT 1";    
  }

  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get first available hero";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getFirstAvailableHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroId = rider.id;
    });
  }

  return heroId;
}

async function getLastAvailableHero(parent, args, context, info) {
  var heroId = 0;

  var sql =
    "SELECT id FROM hero WHERE isAvailable = 1 AND active = 1 ORDER BY id DESC LIMIT 1";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get last available hero";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getLastAvailableHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroId = rider.id;
    });
  }

  return heroId;
}

/**
 * Exclude riders who has orderStatus of 2,3,4,5, and 6 in orders table
 * Exclude riders who are in heroCancelledOrder table
 */
async function getExcludedRidersFromOrder(parent, args, context, info) {
  var excludedHeroes = [];

  const heroesWhoCancelled = await getHeroesWhoCancelledOrder(
    parent,
    args,
    context,
    info
  );
  if (heroesWhoCancelled.length) {
    excludedHeroes = heroesWhoCancelled;
  }

  var sql =
    "SELECT hero AS id from `order` WHERE orderStatus IN (2, 3, 4, 5, 6) GROUP BY hero;";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get excluded riders from order";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getExcludedRidersFromOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      excludedHeroes.push(rider.id);
    });
  }

  return excludedHeroes;
}

/**
 * Get rider who is HERO_ARRIVED status
 */
async function getHeroArrived(parent, args, context, info) {
  var arrivedHeroId = 0;

  var sql =
    "SELECT COUNT(o.id) AS order_num, o.hero AS id FROM `order` o INNER JOIN hero h ON h.id = o.hero WHERE h.isAvailable = 1 AND h.active = 1 AND o.orderStatus = 6 GROUP BY h.id ORDER BY order_num ASC, h.id ASC LIMIT 1;";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get hero arrived";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getHeroArrived",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      arrivedHeroId = rider.id;
    });
  }

  return arrivedHeroId;
}

/**
 * Get rider with the lowest number of delivered order.
 * Also, ensure that rider is online and still working at myHero
 * Also, ensure hero is not on the list of excluded riders
 */
async function getRiderWithLowestOrders(parent, args, context, info) {
  const excludedHeroesArray = await getExcludedRidersFromOrder(
    parent,
    args,
    context,
    info
  );

  var excludedHeroes = "";
  if (excludedHeroesArray.length) {
    excludedHeroes = excludedHeroesArray.toString();
  }

  const excludedHeroesAndDummy = excludedHeroes
    ? "1,2," + excludedHeroes
    : "1,2";

  var sql =
    "SELECT COUNT(o.id) AS order_num, o.hero AS id FROM `order` o INNER JOIN hero h ON h.id = o.hero WHERE h.isAvailable = 1 AND h.active = 1 AND o.orderStatus IN (7, 8, 9) AND h.id NOT IN (" +
    excludedHeroesAndDummy +
    ") GROUP BY h.id ORDER BY order_num ASC, h.id ASC LIMIT 1;";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get rider with lowest orders";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getRiderWithLowestOrders",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var heroId = 0;

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroId = rider.id;
    });
  }

  return heroId;
}

/*
* This function will summon hero based on rider system of a specific colony
* Currently, there are 2 types of rider system: QUEUEING SYSTEM and NEAREST TO MERCHANT SYSTEM
*/

async function summonHeroBasedOnRiderSystem(parent, args, context, info){
  var heroId = 0;
  var orderId = args.id;
  var branchId = args.branch;
  var merchantId = args.merchant;
  console.log('order id: '+orderId);

  const branch = await context.prisma.branch.findOne({where: {id: branchId}});
  console.log(branch.riderSystem);

  switch (branch.riderSystem) {
    case 'QUEUEING_SYSTEM':
      heroId = await assignHero(parent, args, context, info);
      break;
    default: //NEAREST_TO_MERCHANT
      const merchant = await context.prisma.merchant.findOne({where: {id: merchantId}});
      var nearToMerchantArgs = {merchantLat: merchant.lat, merchantLng: merchant.lng, radiusLimitKm: branch.radiusLimitKm, branch: branchId};
      
      var heroId = await getHeroesNearMerchant(parent, nearToMerchantArgs, context, info);       

      if (!heroId) {
        heroId = await assignHero(parent, args, context, info);
      }
  }

  return heroId;
}
/*
* This function will assign hero to an order
* 1. get lastCheckHero of previous order
* 2. next hero = +1 last check hero
* 3. get hero who cancelled order and are busy
* 4. SELECT id FROM hero WHERE id >= nextHero AND isAvailable = 1 AND active = 1 AND id NOT IN ("+excludedHeroes+") ORDER BY id ASC LIMIT 1
  5. If has hero id, assign. Else, back to the top rider
*/
async function assignHero(parent, args, context, info) {
  var heroId = 0;

  const lastCheckHero = await getLastCheckHeroOfPreviousOrder(
    parent,
    args,
    context,
    info
  );
  const nextHero = parseInt(lastCheckHero) + parseInt(1);
  
  var excludedHeroes = "1"; //await excludeHeroes(parent, args, context, info);

  /*
  This query will do the following:
  Include heroes who are available (isAvailable = 1)
  Include heroes who are still part of company (isActive = 1)
  Query heroes starting from next hero (last check hero id + 1)
  */
  heroId = await summonHero(
    parent,
    args,
    context,
    info,
    nextHero,
    excludedHeroes
  );

  if (heroId) {
    return heroId;
  }

  //go back to start
  const firstAvailableHero = await getFirstAvailableHero(
    parent,
    args,
    context,
    info
  );
  if (firstAvailableHero) {
    //heroId = firstAvailableHero;
    heroId = await summonHero(
      parent,
      args,
      context,
      info,
      firstAvailableHero,
      excludedHeroes
    );

    return heroId;
  }
}

async function processAssignToBusyHero(parent, args, context, info) {
  var heroId = 0;
  /**
  If all heroes are busy, unavailable or offline => assign to busy hero
  Assign to the first busy hero
  This will not include hero with stacked order in orders table
  **/
  var excludedHeroes = "1";
  var heroesWithStacked = await getHeroesWithStacked(
    parent,
    args,
    context,
    info
  );
  if (heroesWithStacked.length) {
    excludedHeroes += "," + heroesWithStacked.toString();
  }

  var busyHero = await assignToBusyHero(
    parent,
    args,
    context,
    info,
    excludedHeroes
  );
  if (busyHero) {
    heroId = busyHero;
    return heroId;
  }

  /**
  If all heroes have stacked, assign to first busy hero
  **/
  var excludedHeroes = "1";
  var busyHero = await assignToBusyHero(
    parent,
    args,
    context,
    info,
    excludedHeroes
  );
  if (busyHero) {
    heroId = busyHero;
    return heroId;
  }
}

async function getHeroesWithStacked(parent, args, context, info) {
  var heroesWithStacked = [];

  var sql =
    "SELECT hero AS id FROM `order` WHERE orderStatus = 12 GROUP BY hero";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get heroes with stacked";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getHeroesWithStacked",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroesWithStacked.push(rider.id);
    });
  }

  return heroesWithStacked;
}

async function excludeHeroes(parent, args, context, info) {
  var excludedHeroes = "1";

  const heroesWhoCancelled = await getHeroesWhoCancelledOrder(
    parent,
    args,
    context,
    info
  );
  if (heroesWhoCancelled.length) {
    excludedHeroes += "," + heroesWhoCancelled.toString();
  }

  const busyHeroes = await getBusyHeroes(parent, args, context, info);
  if (busyHeroes.length) {
    excludedHeroes += "," + busyHeroes.toString();
  }

  return excludedHeroes;
}

async function summonHero(
  parent,
  args,
  context,
  info,
  nextHero,
  excludedHeroes
) {
  var heroId = 0;
  //var secondsAgo = moment().subtract(10, 'seconds').tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

  //var sql = "SELECT id FROM hero WHERE id >= "+nextHero+" AND isAvailable = 1 AND active = 1 AND updatedAt >= '"+secondsAgo+"' AND id NOT IN ("+excludedHeroes+") ORDER BY id ASC LIMIT 1";
  
  if (args.locality) {
    var sql =
      "SELECT id FROM hero WHERE id >= " +
      nextHero +
      " AND isRescuer = 0 AND isAvailable = 1 AND active = 1 AND id NOT IN (" +
      excludedHeroes +
      ") AND locality = '"+args.locality+"' ORDER BY id ASC LIMIT 1";
  } else { 
    var sql =
      "SELECT id FROM hero WHERE id >= " +
      nextHero +
      " AND isRescuer = 0 AND isAvailable = 1 AND active = 1 AND id NOT IN (" +
      excludedHeroes +
      ") ORDER BY id ASC LIMIT 1"; 
  }

  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to summon hero";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "summonHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroId = rider.id;
    });
  }

  return heroId;
}

async function summonRescuer(parent, args, context, info) {
  var heroId = 0;
  var sql =
    "SELECT id FROM hero WHERE isRescuer = 1 AND active = 1 ORDER BY id ASC LIMIT 1";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to summon rescuer";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "summonRescuer",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroId = rider.id;
    });
  }

  return heroId;
}

async function assignToBusyHero(parent, args, context, info, excludedHeroes) {
  var heroId = 0;

  var sql =
    "SELECT hero FROM `order` WHERE orderStatus IN (2, 3, 4, 5, 6) AND hero NOT IN (" +
    excludedHeroes +
    ") GROUP BY hero ORDER BY hero ASC LIMIT 1";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to assign to busy hero";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "assignToBusyHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((rider) => {
      heroId = rider.hero;
    });
  }

  return heroId;
}

async function setHeroAvailability(parent, args, context, info) {
  var heroParam = {
    data: {
      isAvailable: args.isAvailable,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const updatedHero = await context.prisma.hero.update(heroParam);

  if (!updatedHero) {
    var errorDetails = "Unable to update availability of hero " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "setHeroAvailability",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
 
  const heroBranch = await context.prisma.branch.findOne({where: {id: updatedHero.branch}});
  console.log(heroBranch.riderSystem);
  if (heroBranch.riderSystem == 'NEAREST_TO_MERCHANT') {//set heroes current location
    var heroesLocationArgs = {heroId: updatedHero.id, orderStatusId: 7, heroLat: args.lat, heroLng: args.lng, branchId: heroBranch.id};
    console.log(heroesLocationArgs);
    await updateHeroesLocation(parent, heroesLocationArgs, context, info); 
  }

  return updatedHero;
}

async function setHeroOnline(parent, args, context, info) {
  var lastUpdated = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");

  var heroParam = {
    data: {
      updatedAt: new Date(lastUpdated),
    },
    where: {
      id: args.id,
    },
  };

  const updatedHero = await context.prisma.hero.update(heroParam);

  const heroBranch = await context.prisma.branch.findOne({where: {id: updatedHero.branch}});
  console.log(heroBranch.riderSystem);
  if (heroBranch.riderSystem == 'NEAREST_TO_MERCHANT') {//set heroes current location
    var heroesLocationArgs = {heroId: updatedHero.id, orderStatusId: 7, heroLat: args.lat, heroLng: args.lng, branchId: heroBranch.id};
    console.log(heroesLocationArgs);
    await updateHeroesLocation(parent, heroesLocationArgs, context, info); 
  }

  if (!updatedHero) {
    var errorDetails = "Unable to update if hero " + args.id + " is online";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "setHeroOnline",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return updatedHero;
}

async function deleteRidersWhoCancelledOrder(parent, args, context, info) {
  const heroCancelledOrderFound = await context.prisma.heroCancelledOrder.findOne(
    { where: { order: args.id } }
  );

  if (heroCancelledOrderFound) {
    const heroCancelledOrder = await context.prisma.heroCancelledOrder.delete({
      where: { order: args.id },
    });

    if (!heroCancelledOrder) {
      var errorDetails =
        "Unable to delete heroes who cancelled order " + args.id;
      var error = {
        details: errorDetails,
        type: "M",
        functionName: "deleteRidersWhoCancelledOrder",
      };
      await insertErrorLog(error);
      throw new Error(errorDetails);
    }

    return heroCancelledOrder;
  }
}

async function deleteOrder(parent, args, context, info) {
  const order = await context.prisma.order.delete({ where: { id: args.id } });

  return order;
}

async function updateOrder(parent, args, context, info) {
  const currentOrder = await context.prisma.order.findOne({
    where: { id: args.id },
  });

  if (!currentOrder) {
    var errorDetails = "Unable to find order " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (currentOrder.orderStatus > 4) {
    var errorDetails = "Update not allowed for Order# "+args.id+" with status "+currentOrder.orderStatus;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (!args.orderProducts.length) {
    var errorDetails = "Cannot update Order# "+args.id+". No ordered products.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const orderProductsArray = [];
  var orderAddonsArray = [];
  var total = 0;
  var markUpTotalSum = 0;
  var orderedProductIds = [];
  var orderedProductSizeIds = [];
  var orderedAddonIds = [];
  var productsUnavailableNextOrder = [];
  var sizesUnavailableNextOrder = [];
  var addonsUnavailableNextOrder = [];

  for (var i = 0; i < args.orderProducts.length; i++) {
    if (args.orderProducts[i].productUnavailableNextOrder == true) {
      productsUnavailableNextOrder.push(args.orderProducts[i].product);
    }

    if (args.orderProducts[i].sizeUnavailableNextOrder == true) {
      sizesUnavailableNextOrder.push(args.orderProducts[i].productSize);
    }

    if (args.orderProducts[i].quantity > 0) {
      /**start calculation for order product**/
      var markUp = args.orderProducts[i].markUpPrice
      ? args.orderProducts[i].markUpPrice
      : 0;
      var priceOnly = parseFloat(args.orderProducts[i].price);
      var subtotal = (priceOnly + markUp) * args.orderProducts[i].quantity;
      var markUpTotalPrice = markUp * args.orderProducts[i].quantity;
      /**end calculation for order product**/

      /**start order add-ons**/
      var orderAddon = {};
      var currentOrderAddons = args.orderProducts[i].orderAddons;//array of order addons of this specific order product
      var orderAddonsArray = [];
      if (currentOrderAddons.length) {//orderAddons in orderProducts current index
        for (var a = 0; a < currentOrderAddons.length; a++) {
          if (currentOrderAddons[a].unavailableNextOrder == true) {
            addonsUnavailableNextOrder.push(currentOrderAddons[a].addon);
          }

          if (currentOrderAddons[a].quantity > 0) {
            //start calculation for order-addons
            var addonMarkUp = currentOrderAddons[a].markUpPrice
            ? currentOrderAddons[a].markUpPrice
            : 0;
            var addonPriceOnly = parseFloat(currentOrderAddons[a].price);
            var addonSubtotal = ((addonPriceOnly + addonMarkUp) * currentOrderAddons[a].quantity) * args.orderProducts[i].quantity;
            var addonMarkUpTotalPrice = (addonMarkUp * currentOrderAddons[a].quantity) * args.orderProducts[i].quantity;
            //end calculation for order-addons

            orderAddonsArray.push({
              order_orderToorderAddon: {connect: {id: args.id}},
              addon_addonToorderAddon: {connect: {id: currentOrderAddons[a].addon}},
              product_orderAddonToproduct: {connect: {id: currentOrderAddons[a].product}},
              price: addonPriceOnly,
              markUpPrice: addonMarkUp,
              quantity: currentOrderAddons[a].quantity,
              subtotal: addonSubtotal,
              markUpTotal: addonMarkUpTotalPrice,
              createdAt: getPHDateTimeNow(),
              updatedAt: getPHDateTimeNow()
            });

            orderedAddonIds.push(currentOrderAddons[a].addon);

            markUpTotalSum += addonMarkUpTotalPrice;
            total += addonSubtotal;
          }
        }
      }
      /**end order add-ons**/
    
      orderProductsArray.push({
        product_orderProductToproduct: {
          connect: { id: args.orderProducts[i].product },
        },
        productSize_orderProductToproductSize: args.orderProducts[i].productSize 
          ? { connect: { id: args.orderProducts[i].productSize}} 
          : undefined,
        coupon_couponToorderProduct: args.orderProducts[i].coupon
          ? { connect: { id: args.orderProducts[i].coupon } }
          : undefined,
        price: priceOnly,
        markUpPrice: markUp,
        quantity: args.orderProducts[i].quantity,
        subtotal: subtotal,
        markUpTotal: markUpTotalPrice,
        sugarLevel: args.orderProducts[i].sugarLevel ? args.orderProducts[i].sugarLevel : 0,
        createdAt: getPHDateTimeNow(),
        updatedAt: getPHDateTimeNow(),
        orderAddon: {
          create: orderAddonsArray,
        }
      });

      orderedProductIds.push(args.orderProducts[i].product);

      if (args.orderProducts[i].productSize) {
        orderedProductSizeIds.push(args.orderProducts[i].productSize); 
      }

      markUpTotalSum += markUpTotalPrice;
      total += subtotal;
    } 
  }

  const unavailableProducts = await context.prisma.product.findMany({
    where: {
      id: {in: orderedProductIds},
      isAvailable: false
    }
  });

  if (unavailableProducts.length) {
    var unavailableProductNames = unavailableProducts.map(p => p.name);

    var errorDetails = "Cannot update Order #" +args.id+". These products are now unavailable: "+unavailableProductNames.toString();
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  /**start check unavailable product size**/
  const unavailableProductSizes = await context.prisma.productSize.findMany({
    where: {
      id: {in: orderedProductSizeIds},
      isAvailable: false
    }
  });

  if (unavailableProductSizes.length) {
    var unavailableSizes = [];
    for (let s = 0; s < unavailableProductSizes.length; s++) {
      var productWithUnavailableSize = await context.prisma.product.findOne({where: {id: unavailableProductSizes[s].product}});
      unavailableSizes.push(productWithUnavailableSize.name+' ('+unavailableProductSizes[s].name+')');      
    }

    var errorDetails = "Cannot update Order #" +args.id+". These sizes are now unavailable: "+unavailableSizes.toString();
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
  /**end   check unavailable product size**/

  /**start check unavailable add-ons**/
  const unavailableAddons = await context.prisma.addon.findMany({
    where: {
      id: {in: orderedAddonIds},
      isAvailable: false
    }
  });

  if (unavailableAddons.length) {
    var unavailableAddonNames = unavailableAddons.map(a => a.name);

    var errorDetails = "Cannot update Order #" +args.id+". These add-ons are now unavailable: "+unavailableAddonNames.toString();
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }
  /**end check unavailable add-ons**/

  await context.prisma.orderAddon.deleteMany({
    where: {order: args.id}
  });

  await context.prisma.orderProduct.deleteMany({
    where: {order: args.id}
  });

  const merchant = await context.prisma.merchant.findOne({where: {id: currentOrder.merchant}});
  const costing = await context.prisma.costing.findOne({where: {id: 1}});
  const coupon = currentOrder.coupon ? await context.prisma.coupon.findOne({where: {id: currentOrder.coupon}}) : null;
  var deliverFee = deductDeliveryFeeFromMinSpend(merchant.myHeroShare, currentOrder.origDeliveryFee, merchant.minimumSpend, total, costing, merchant);
  var appFee = calculateAppFee(merchant, costing, total);
  var freeDeliveryCost = calculateFreeDeliveryCost(merchant, costing, total);
  var heroEarnings = calculateHeroEarnings(merchant, currentOrder.origDeliveryFee, currentOrder.total, currentOrder.appFee, deliverFee, currentOrder.excessDeliveryFee);
  const couponLocality = (coupon) ? await context.prisma.couponLocality.findMany({where: {coupon: coupon.id}}) : null;
  var finalTotal = calculateFinalTotal(total, deliverFee, merchant, coupon, currentOrder.locality, couponLocality);
  var riderShare = calculateRiderShare(merchant, total);
  var myHeroShareAmount = calculateMyHeroShareAmount(total, merchant.myHeroShare);
  var origFinalTotal = calculateOrigFinalTotal(total, deliverFee);

  const order = await context.prisma.order.update({
    data: {
      total: total,
      markUpTotal: markUpTotalSum,      
      finalTotal: parseFloat(finalTotal),
      origFinalTotal: parseFloat(origFinalTotal),
      riderShare: parseFloat(riderShare),
      deliveryFee: deliverFee,//we need to change delivery fee as well since total order got changed.
      freeDeliveryCost: parseFloat(freeDeliveryCost),
      heroEarnings: parseFloat(heroEarnings),
      myHeroIncome: parseFloat(markUpTotalSum) + parseFloat(appFee) + parseFloat(myHeroShareAmount),
      gteMinSpend: isGreaterThanOrEqualMinSpend(merchant, currentOrder.total),
      updatedAt: getPHDateTimeNow(),
      orderProduct: {
        create: orderProductsArray,
      },
    },
    where: {id: args.id}
  });

  if (!order) {
    var errorDetails = "Error! Cannot update Order #" +args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (addonsUnavailableNextOrder.length) { 
    await context.prisma.addon.updateMany({
      data: {isAvailable: false},
      where: {
        id: {in: addonsUnavailableNextOrder} 
      }
    }); 
  }

  if (sizesUnavailableNextOrder.length) { 
    await context.prisma.productSize.updateMany({
      data: {isAvailable: false},
      where: {
        id: {in: sizesUnavailableNextOrder} 
      }
    }); 

    var productSizeIdsArgs = {productSizeIds: sizesUnavailableNextOrder};
    await setProductOfSizesUnavailable(parent, productSizeIdsArgs, context, info);
  }

  if (productsUnavailableNextOrder.length) { 
    await context.prisma.product.updateMany({
      data: {isAvailable: false},
      where: {
        id: {in: productsUnavailableNextOrder} 
      }
    }); 
  }

  /**
  Send push notification to customer, merchant and rider
  **/
  //console.log(order);
  var pushNotificationTitle = 'MyHero Delivery: Edited Order# '+args.id;
  var pushNotificationBody = 'Order# '+args.id+' has been edited successfully.';

  const customer = await context.prisma.user.findOne({where: {id: currentOrder.customer}});
  if (customer.firebaseToken) {//customer has firebase token, send push
    var sendPushArg = {registrationToken: customer.firebaseToken, title: pushNotificationTitle, body: pushNotificationBody};
    await sendPush(parent, sendPushArg, context, info);
  }

  //send push notif to rider only if status is Merchant Confirm, Customer Cancel or Merchant Cancel with real rider
  if (currentOrder.hero > 1) {
    const hero = await context.prisma.hero.findOne({where: {id: currentOrder.hero}});
    const heroUser = await context.prisma.user.findOne({where: {id: hero.user}});
    if (heroUser.firebaseToken) {//hero has firebase token, send push   
      var sendPushArg = {registrationToken: heroUser.firebaseToken, title: pushNotificationTitle, body: pushNotificationBody};
      await sendPush(parent, sendPushArg, context, info); 
    }
  }
  
  const merchantUser = await context.prisma.user.findOne({where: {id: merchant.user}});
  if (merchantUser.firebaseToken) { 
    var sendPushArg = {registrationToken: merchantUser.firebaseToken, title: pushNotificationTitle, body: pushNotificationBody};
    await sendPush(parent, sendPushArg, context, info); 
  }

  //send real-time update
  var wordsOfWisdom = getWordsOfWisdom();
  var messageOrder = {order, wordsOfWisdom};    
  context.pubsub.publish("UPDATED_ORDER", {updatedOrder: messageOrder});

  return order;
}//end update order

/**If all sizes of that product is unavaiolable, set that product to unavailable**/
async function setProductOfSizesUnavailable(parent, args, context, info){
  if (args.productSizeIds.length){
    var unavailableProducts = [];

    for (let i = 0; i < args.productSizeIds.length; i++) {
      var productSize = await context.prisma.productSize.findOne({where: {id: args.productSizeIds[i]}});
      var totalAvailableProductSize = await context.prisma.productSize.count({
        where: {
          product: productSize.product,
          isAvailable: true,
          active: true,
        }
      });

      if (totalAvailableProductSize == 0) {
        unavailableProducts.push(productSize.product);
      }
    }

    if (unavailableProducts.length > 0) {
      await context.prisma.product.updateMany({
        data: {isAvailable: false},
        where: {id: {in: unavailableProducts}}
      });
    }
  }
}

async function stackedOrder(parent, args, context, info, heroId) {
  var dateTimeToday = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");

  const currentOrder = await context.prisma.order.findOne({
    where: { id: args.id },
  });

  if (!currentOrder) {
    var errorDetails = "Unable to find order " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "stackedOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var param = {
    data: {
      orderStatus_orderToorderStatus: { connect: { id: 12 } },
      hero_heroToorder: heroId ? { connect: { id: heroId } } : undefined,
      lastCheckHero: heroId ? heroId : undefined,
      updatedAt: new Date(dateTimeToday),
      transaksyon: {
        create: [
          {
            orderStatus_orderStatusTotransaksyon: { connect: { id: 12 } },
          },
        ],
      },
    },
    where: {
      id: args.id,
    },
  };

  var order = await context.prisma.order.update(param);

  if (!order) {
    var errorDetails = "Unable to update status of order " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "stackedOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var wordsOfWisdom = getWordsOfWisdom();
  var messageOrder = {order, wordsOfWisdom};

  context.pubsub.publish("UPDATED_ORDER", { updatedOrder: messageOrder });
  context.pubsub.publish("ORDER_TO_ME", { orderToMe: messageOrder }); //for merchant
  context.pubsub.publish("ASSIGN_TO_HERO", { assignToHero: messageOrder }); //for rider
}

async function updateEstPrepTime(parent, args, context, info) {
  const orderProducts = await context.prisma.orderProduct.findMany({
    where: {order: args.orderId},
    orderBy: {id: 'asc'}
  });

  if (!orderProducts) {
    var errorDetails = "No such order products found with order id "+args.orderId;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateEstPrepTime",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (orderProducts.length) {
    const productIds = orderProducts.map(orderProduct => orderProduct.product);
    const products = await context.prisma.product.findMany({
      where: {id: {in: productIds}},
      orderBy: {estPrepTime: 'desc'}
    });

    if (products.length) {
      await context.prisma.order.update({
        data: {
          estPrepTime: parseFloat(products[0].estPrepTime),
          updatedAt: getPHDateTimeNow(),
        },
        where: {id: args.orderId}
      });
    }
  }
}

async function updateStatusOfOrder(parent, args, context, info) {
  var heroId = 0;
  var dateTimeToday = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");
  var wordsOfWisdom = getWordsOfWisdom();

  const currentOrder = await context.prisma.order.findOne({
    where: { id: args.id },
  });

  if (!currentOrder) {
    var errorDetails = "Unable to find order " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateStatusOfOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (args.loggedInHero && currentOrder.hero != args.loggedInHero) {
    var errorDetails =
      "Error! Cannot update. Order #" +
      args.id +
      " is not assigned to you anymore";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateStatusOfOrder",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  switch (args.status) {
    case 2: //MERCHANT_CONFIRMED
      if (currentOrder.orderStatus != 1) {
        var errorDetails =
          "Error! Cannot change to merchant confirmed. Order #" +
          args.id +
          " is status " +
          currentOrder.orderStatus;
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }
      args.locality = currentOrder.locality;
      heroId = await assignHero(parent, args, context, info);
      //var summonArgs = {id: currentOrder.id, branch: currentOrder.branch, merchant: currentOrder.merchant};
      //heroId = await summonHeroBasedOnRiderSystem(parent, summonArgs, context, info);

      if (!heroId) {
        var errorDetails =
          "Error! Cannot change to merchant confirmed. Order #" +
          args.id +
          " is unable to summon hero.";
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      } else {
        if (currentOrder.hero > 1) {//don't update hero column since we use hero code
          var param = {
            data: {
              orderStatus_orderToorderStatus: { connect: { id: args.status } },
              updatedAt: new Date(dateTimeToday),
              transaksyon: {
                create: [
                  {
                    orderStatus_orderStatusTotransaksyon: {connect: { id: args.status }},
                    createdAt: getPHDateTimeNow(),
                    updatedAt: getPHDateTimeNow()
                  },
                ],
              },
            },
            where: {
              id: args.id,
            },
          };
        } else {//assign hero
          var param = {
            data: {
              orderStatus_orderToorderStatus: { connect: { id: args.status } },
              hero_heroToorder: heroId ? { connect: { id: heroId } } : undefined,
              lastCheckHero: heroId ? heroId : undefined,
              updatedAt: new Date(dateTimeToday),
              transaksyon: {
                create: [
                  {
                    orderStatus_orderStatusTotransaksyon: {connect: { id: args.status }},
                    createdAt: getPHDateTimeNow(),
                    updatedAt: getPHDateTimeNow()
                  },
                ],
              },
            },
            where: {
              id: args.id,
            },
          };
        }
      }

      var order = await context.prisma.order.update(param);

      if (!order) {
        var errorDetails =
          "Cannot update status order to MERCHANT CONFIRMED for some reason";
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      var messageOrder = {order, wordsOfWisdom};
      context.pubsub.publish("ASSIGN_TO_HERO", { assignToHero: messageOrder }); //for rider
      
      var notifyUsersArgs = {order: order, id: args.id, status: args.status};
      await notifyUsers(parent, notifyUsersArgs, context, info);

      var updateEstPrepTimeArgs = {orderId: args.id};
      await updateEstPrepTime(parent, updateEstPrepTimeArgs, context, info);
      break;
    case 11: //HERO_EMERGENCY
      var needsHelp = { hero: args.loggedInHero };
      var rescuer = await callEmergency(parent, needsHelp, context, info);
      var messageOrder = {order, wordsOfWisdom};
      context.pubsub.publish("ASSIGN_TO_HERO", { assignToHero: messageOrder }); //for rider
      break;
    case 7: //DELIVERED
      if (currentOrder.orderStatus == 7 || currentOrder.orderStatus == 8) {
        var errorDetails =
          "Error! Cannot change to delivered. Order #" +
          args.id +
          " might be already delivered or no show";
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      var param = {
        data: {
          orderStatus_orderToorderStatus: { connect: { id: args.status } },
          updatedAt: getPHDateTimeNow(),
          transaksyon: {
            create: [
              {
                orderStatus_orderStatusTotransaksyon: {
                  connect: { id: args.status },
                },
                createdAt: getPHDateTimeNow(),
                updatedAt: getPHDateTimeNow(),
              },
            ],
          },
        },
        where: {
          id: args.id,
        },
      };

      var order = await context.prisma.order.update(param);

      if (!order) {
        var errorDetails =
          "Cannot update status order to DELIVERED for some reason";
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      //insert new analytics record

      var merchantId = order.merchant;
      var riderId = order.hero;

      const saveToMerchant = await saveCollectionsAndPayablesToMerchant(
        parent,
        args,
        context,
        info,
        merchantId
      );
      const saveToHero = await saveCollectionsAndPayablesToRider(
        parent,
        args,
        context,
        info,
        riderId,
        merchantId
      );
      var notifyUsersArgs = {order: order, id: args.id, status: args.status};
      await notifyUsers(parent, notifyUsersArgs, context, info);

      var userArgs = {id: currentOrder.customer};
      await acceptUser(parent, userArgs, context, info);
      break;
    case 8: //NO_SHOW
      if (currentOrder.orderStatus == 7 || currentOrder.orderStatus == 8) {
        var errorDetails =
          "Error! Cannot change to no show. Order #" +
          args.id +
          " might be already delivered or no show";
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      var param = {
        data: {
          orderStatus_orderToorderStatus: { connect: { id: args.status } },
          heroEarnings: 0,//no earnings for hero 
          updatedAt: getPHDateTimeNow(),
          transaksyon: {
            create: [
              {
                orderStatus_orderStatusTotransaksyon: {
                  connect: { id: args.status },
                },
                createdAt: getPHDateTimeNow(),
                updatedAt: getPHDateTimeNow(),
              },
            ],
          },
        },
        where: {
          id: args.id,
        },
      };

      var order = await context.prisma.order.update(param);

      if (!order) {
        var errorDetails =
          "Cannot update status order to NO SHOW for some reason";
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      var notifyUsersArgs = {order: order, id: args.id, status: args.status};
      await notifyUsers(parent, notifyUsersArgs, context, info);
      break;
    case 9://CUSTOMER CANCEL
      var param = {
        data: {
          orderStatus_orderToorderStatus: { connect: { id: args.status } },
          heroEarnings: 0, //no earnings for hero
          updatedAt: getPHDateTimeNow(),
          transaksyon: {
            create: [
              {
                orderStatus_orderStatusTotransaksyon: {
                  connect: { id: args.status },
                },
                createdAt: getPHDateTimeNow(),
                updatedAt: getPHDateTimeNow(),
              },
            ],
          },
        },
        where: {
          id: args.id,
        },
      };

      var order = await context.prisma.order.update(param);

      if (!order) {
        var errorDetails =
          "Error! Cannot update status of order #" +
          args.id +
          " into status " +
          args.status;
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      var notifyUsersArgs = {order: order, id: args.id, status: args.status};
      await notifyUsers(parent, notifyUsersArgs, context, info);
      break;
    case 10://MERCHANT CANCEL
      var param = {
        data: {
          orderStatus_orderToorderStatus: { connect: { id: args.status } },
          heroEarnings: 0, //no earnings for hero
          updatedAt: getPHDateTimeNow(),
          transaksyon: {
            create: [
              {
                orderStatus_orderStatusTotransaksyon: {
                  connect: { id: args.status },
                },
                createdAt: getPHDateTimeNow(),
                updatedAt: getPHDateTimeNow(),
              },
            ],
          },
        },
        where: {
          id: args.id,
        },
      };

      var order = await context.prisma.order.update(param);

      if (!order) {
        var errorDetails =
          "Error! Cannot update status of order #" +
          args.id +
          " into status " +
          args.status;
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      var notifyUsersArgs = {order: order, id: args.id, status: args.status};
      await notifyUsers(parent, notifyUsersArgs, context, info);
      break;
    default:
      var param = {
        data: {
          orderStatus_orderToorderStatus: { connect: { id: args.status } },
          updatedAt: getPHDateTimeNow(),
          transaksyon: {
            create: [
              {
                orderStatus_orderStatusTotransaksyon: {
                  connect: { id: args.status },
                },
                createdAt: getPHDateTimeNow(),
                updatedAt: getPHDateTimeNow(),
              },
            ],
          },
        },
        where: {
          id: args.id,
        },
      };

      var order = await context.prisma.order.update(param);

      if (!order) {
        var errorDetails =
          "Error! Cannot update status of order #" +
          args.id +
          " into status " +
          args.status;
        var error = {
          details: errorDetails,
          type: "M",
          functionName: "updateStatusOfOrder",
        };
        await insertErrorLog(error);
        throw new Error(errorDetails);
      }

      var notifyUsersArgs = {order: order, id: args.id, status: args.status};
      await notifyUsers(parent, notifyUsersArgs, context, info);
  }

  var messageOrder = {order, wordsOfWisdom};
  context.pubsub.publish("ORDER_TO_ME", { orderToMe: messageOrder }); //for merchant
  context.pubsub.publish("UPDATED_ORDER", { updatedOrder: messageOrder });
  await refreshUI(parent, args, context, info);
  await autoMerchantConfirmed(parent, args, context, info);
  
  return order;
}

async function transferOrderToNewHero(parent, args, context, info) {
  var dateTimeToday = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");
  var wordsOfWisdom = getWordsOfWisdom();

  const currentOrder = await context.prisma.order.findOne({
    where: { id: args.id },
  });

  if (!currentOrder) {
    var errorDetails = "Unable to find order " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "transferOrderToNewHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (currentOrder.hero == args.hero) {
    var errorDetails =
      "Error! Order #"+args.id+" has already been transferred to this hero.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "transferOrderToNewHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (currentOrder.orderStatus == 7) {//if delivered, we need to revert before passing to new rider
    await revertCollectionsAndPayablesToRider(parent, args, context, info, currentOrder.hero, currentOrder.merchant);

    var param = {
      data: {
        hero_heroToorder: { connect: { id: args.hero } },
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    var order = await context.prisma.order.update(param);

    await saveCollectionsAndPayablesToRider(
      parent,
      args,
      context,
      info,
      args.hero,
      currentOrder.merchant
    );
  } else {// just transfer the order
    var param = {
      data: {
        hero_heroToorder: { connect: { id: args.hero } },
        updatedAt: getPHDateTimeNow(),
      },
      where: {
        id: args.id,
      },
    };

    var order = await context.prisma.order.update(param);
  }

  if (!order) {
    var errorDetails =
      "Cannot transer order to new hero for some reason.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "transferOrderToNewHero",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var messageOrder = {order, wordsOfWisdom};
  context.pubsub.publish("ASSIGN_TO_HERO", { assignToHero: messageOrder }); //for rider
  
  var notifyUsersArgs = {order: order, id: order.id, status: 12};
  await notifyUsers(parent, notifyUsersArgs, context, info);

  return order;
}

async function notifyUsers(parent, args, context, info) {
  /**
  Send push notification to customer, merchant and rider
  **/
  //console.log(order);
  var order = args.order;
  var status = args.status;
  var id = args.id;
  var pushNotificationTitle = 'My Hero Delivery Order #'+args.id;
  var statusesForCustomer = [2, 3, 4, 5, 6, 10];
  var statusesForRider = [1, 2, 9, 10, 12];
  var statusesForMerchant = [1, 8, 9];

  const customer = await context.prisma.user.findOne({where: {id: order.customer}});
  if (customer.firebaseToken && statusesForCustomer.includes(args.status)) {
    
    var customerPushNotificationArgs = {userType: 'customer', id: args.id, status: args.status};
    var customerPushNotificationBody = getPushNotificationContent(customerPushNotificationArgs);

    if (customerPushNotificationBody) {   
      var sendPushArg = {
        registrationToken: customer.firebaseToken, 
        title: pushNotificationTitle, 
        body: customerPushNotificationBody
      }; 

      await sendPush(parent, sendPushArg, context, info);
    }
  }

  //send push notif to rider only if status is Merchant Confirm, Customer Cancel, Merchant Cancel or Rider Swap with real rider
  if (args.status == 2 || args.status == 9 || (args.status == 10 && order.hero > 1) || args.status == 12) {
    const hero = await context.prisma.hero.findOne({where: {id: order.hero}});
    const heroUser = await context.prisma.user.findOne({where: {id: hero.user}});
    if (heroUser.firebaseToken && statusesForRider.includes(args.status)) {
      
      var riderPushNotificationArgs = {userType: 'rider', id: args.id, status: args.status};
      var riderPushNotificationBody = getPushNotificationContent(riderPushNotificationArgs);

      if (riderPushNotificationBody) {
        var sendPushArg = {
          registrationToken: heroUser.firebaseToken, 
          title: pushNotificationTitle, 
          body: riderPushNotificationBody
        };
        await sendPush(parent, sendPushArg, context, info); 
      }
    }
  }

  const merchant = await context.prisma.merchant.findOne({where: {id: order.merchant}});
  const merchantUser = await context.prisma.user.findOne({where: {id: merchant.user}});
  if (merchantUser.firebaseToken && statusesForMerchant.includes(args.status)) {
    var merchantPushNotificationArgs = {userType: 'merchant', id: args.id, status: args.status};
    var merchantPushNotificationBody = getPushNotificationContent(merchantPushNotificationArgs);

    if (merchantPushNotificationBody) {
      var sendPushArg = {
        registrationToken: merchantUser.firebaseToken, 
        title: pushNotificationTitle, 
        body: merchantPushNotificationBody
      };
      await sendPush(parent, sendPushArg, context, info);   
    }
  }
}

/**
This function can be use to send SMS to national admin that a hero needs an emergency
**/
async function callEmergency(parent, args, context, info) {
  const heroUnavailableUpdated = await context.prisma.hero.update({
    where: { id: args.hero },
    data: {
      isAvailable: false,
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!heroUnavailableUpdated) {
    var errorDetails =
      "Error! Cannot call emergency. Unable to set hero " +
      args.hero +
      " to unavailable.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "callEmergency",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  var heroId = await summonRescuer(parent, args, context, info);

  if (!heroId) {
    var errorDetails =
      "Error! Cannot call emergency. Unable to summon rescuer.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "callEmergency",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const assignedToRescuer = await context.prisma.$queryRaw(
    "UPDATE `order` SET hero = " +
      heroId +
      " WHERE orderStatus IN (2, 3, 4, 5, 6) AND hero = " +
      args.hero
  );

  if (!assignedToRescuer) {
    var errorDetails =
      "Error! Cannot call emergency. Unable to assign all orders from hero " +
      args.hero +
      " to emergency hero " +
      heroId;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "callEmergency",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const rescuer = await context.prisma.hero.findOne({ where: { id: heroId } });

  if (!rescuer) {
    var errorDetails = "Error! Emergency hero " + heroId + " not found.";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "callEmergency",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return rescuer;
}
/**
All functions here are for computation for merchant
**/
async function getMerchantCollectionFromOrder(parent, args, context, info) {
  const rawCount = await context.prisma.$queryRaw(
    "SELECT total FROM `order` WHERE id = " + args.id
  );

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.total;
  });

  return count;
}


async function getMerchantEarningsFromOrder(
  parent,
  args,
  context,
  info,
  merchantId
) {
  const order = await context.prisma.order.findOne({ where: { id: args.id } });
  const transaction = order.total;

  const merchant = await context.prisma.merchant.findOne({
    where: { id: merchantId },
  });

  var decimalMyHeroShare = 0;

  var earn = 0;

  if (merchant) {
    if (merchant.myHeroShare > 0) {//has share
      var myHeroDecimalShare = convertPercentToDecimal(merchant.myHeroShare);
      earn = parseFloat(transaction) * parseFloat(myHeroDecimalShare);
    } else {//no share
      earn = await getMarkUpTotal(parent, args, context, info);
    }
  }

  return earn;
}

async function getMarkUpTotal(parent, args, context, info) {
  const rawCount = await context.prisma.$queryRaw(
    "SELECT markUpTotal AS total FROM `order` WHERE id = " + args.id
  );

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.total;
  });

  return count;
}

/**Payables**/
async function saveCollectionsAndPayablesToMerchant(
  parent,
  args,
  context,
  info,
  merchantId
) {
  const merchant = await context.prisma.merchant.findOne({ where: { id: merchantId } });
  if (!merchant) {
    throw new Error("No such merchant found");
  }

  const currentOrder = await context.prisma.order.findOne({ where: { id: args.id } });
  if (!currentOrder) {
    throw new Error("No such order "+args.id+" found");
  }

  const collection = currentOrder.total;
  const earnings = await getMerchantEarningsFromOrder(
    parent,
    args,
    context,
    info,
    merchantId
  );

  var remittance = 0;
  var merchantTrendingCommissionEarning = 0;
  var merchantEarningsTotal = parseFloat(earnings);
  
  if (merchant.isElite) {
    remittance = 0;
  } else {
    if (merchant.isTrending) {
      merchantTrendingCommissionEarning = parseFloat(collection) * (parseFloat(convertPercentToDecimal(merchant.riderShare)));
      merchantEarningsTotal = parseFloat(earnings) + parseFloat(merchantTrendingCommissionEarning);
      remittance = parseFloat(collection) - parseFloat(merchantEarningsTotal);
    } else {
      remittance = collection - earnings;
    }
  }

  //this is the actual saving
  var orderParam = {
    data: {
      merchantAmount: parseFloat(collection),
      merchantEarnings: parseFloat(earnings),
      merchantTrendingCommissionEarning: parseFloat(merchantTrendingCommissionEarning),
      merchantEarningsTotal: parseFloat(merchantEarningsTotal),
      merchantRemittance: parseFloat(remittance),
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const order = await context.prisma.order.update(orderParam);

  if (!order) {
    throw new Error(
      "Unable to save collection and remittance of merchant to orders table"
    );
  }

  var newRemittance = parseFloat(remittance) + parseFloat(merchant.remittance);
  var remaining = newRemittance - parseFloat(merchant.paidPayables);

  //save for merchant
  var merchantParam = {
    data: {
      collection: parseFloat(collection) + parseFloat(merchant.collection),
      earnings: parseFloat(earnings) + parseFloat(merchant.earnings),
      remittance: newRemittance,
      remainingPayables: remaining,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: merchantId,
    },
  };

  if (remaining < 0) {
    var errorDetails = "Bug occured. This is where negative remaining value starts";
    var error = { details: errorDetails, type: "M", functionName: "saveCollectionsAndPayablesToMerchant" };
    await insertErrorLog(error);
  }

  const updatedMerchant = await context.prisma.merchant.update(merchantParam);

  if (!updatedMerchant) {
    throw new Error(
      "Unable to save collection and remittance to merchants table"
    );
  }

  /*query percent*/
  const percent = await context.prisma.percent.findOne({ where: { id: 1 } });

  if (!percent) {
    throw new Error("No such percent records for shares/earnings found");
  }

  var myHeroEarning = parseFloat(earnings);
  var semicolonShare = parseFloat(order.appFee);
  var felixShare =
    parseFloat(percent.felixSemicolonShare) * parseFloat(semicolonShare) +
    parseFloat(percent.felixMyHeroEarning) * parseFloat(myHeroEarning);
  var vinceShare =
    parseFloat(percent.vinceSemicolonShare) * parseFloat(semicolonShare) +
    parseFloat(percent.vinceMyHeroEarning) * parseFloat(myHeroEarning);
  var ramonShare =
    parseFloat(percent.ramonSemicolonShare) * parseFloat(semicolonShare) +
    parseFloat(percent.ramonMyHeroEarning) * parseFloat(myHeroEarning);
  var myHeroAsset =
    parseFloat(percent.myHeroAssetSemicolonShare) * parseFloat(semicolonShare) +
    parseFloat(percent.myHeroAssetMyHeroEarning) * parseFloat(myHeroEarning);

  /*insert new analytic*/
  const analytic = await context.prisma.analytic.create({
    data: {
      myHeroEarning: (parseFloat(myHeroEarning) + parseFloat(semicolonShare)),//eto ung gross natin
      semicolonShare: 0,
      felixShare: felixShare,
      vinceShare: vinceShare,
      ramonShare: ramonShare,
      myHeroAsset: myHeroAsset,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!analytic) {
    throw new Error("Unable to insert new analytic for some reason");
  }
}
/**
End logic for merchant
**/

/**
Start logic for hero
**/
async function getHeroCollectionFromOrder(parent, args, context, info) {
  const rawCount = await context.prisma.$queryRaw(
    "SELECT finalTotal AS total FROM `order` WHERE id = " + args.id
  );

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.total;
  });

  return count;
}

async function getHeroEarningsFromOrder(parent, args, context, info) {
  const order = await context.prisma.order.findOne({
    where: { id: args.id },
  });

  var earn = order.heroEarnings;

  return earn;
}

async function getHeroTrendingCommissionEarningsFromOrder(parent, args, context, info){
  const order = await context.prisma.order.findOne({
    where: { id: args.id },
  });

  const merchant = await context.prisma.merchant.findOne({
    where: { id: order.merchant },
  });

  var transaction = order.total;
  var earn = 0;

  if (merchant.isTrending) {
    if (parseFloat(merchant.riderShare) > 0) {
      var riderDecimalShare = convertPercentToDecimal(merchant.riderShare);
      earn = parseFloat(transaction) * parseFloat(riderDecimalShare);
    }
  }

  return earn;
}

/**Collectibles**/
async function saveCollectionsAndPayablesToRider(
  parent,
  args,
  context,
  info,
  riderId,
  merchantId
) {
  const merchant = await context.prisma.merchant.findOne({ where: { id: merchantId } });

  if (!merchant) {
    throw new Error("No such merchant "+merchantId+" found");
  }

  const currentOrder = await context.prisma.order.findOne({ where: { id: args.id } });

  if (!currentOrder) {
    throw new Error("No such order "+args.id+" found");
  }

  const collection = currentOrder.finalTotal;
  const earnings = parseFloat(currentOrder.heroEarnings);
  const adminCollectibles = calculateHeroCollectibles(merchant, currentOrder, collection, earnings);
  const heroTrendingCommissionEarning = await getHeroTrendingCommissionEarningsFromOrder(parent, args, context, info);
  const heroEarningsTotal = calculateHeroEarningsTotal(merchant, earnings, heroTrendingCommissionEarning);
  const myHeroShareAmount = calculateMyHeroShareAmount(currentOrder.total, merchant.myHeroShare);
  const riderIncome = calculateRiderIncome(currentOrder.riderShare, currentOrder.myHeroIncome) + myHeroShareAmount;
  
  //this is the actual saving
  var orderParam = {
    data: {
      heroAmount: parseFloat(collection),
      heroCollectibles: parseFloat(adminCollectibles),
      heroEarnings: parseFloat(earnings),
      heroTrendingCommissionEarning: parseFloat(heroTrendingCommissionEarning),
      heroEarningsTotal: heroEarningsTotal,
      riderIncome: riderIncome,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const order = await context.prisma.order.update(orderParam);

  if (!order) {
    throw new Error(
      "Unable to save collection and remittance of hero to orders table"
    );
  }

  const hero = await context.prisma.hero.findOne({ where: { id: riderId } });

  if (!hero) {
    throw new Error("No such hero found");
  }

  var collectibles = parseFloat(adminCollectibles) + parseFloat(hero.collectibles);
  var remaining = collectibles - parseFloat(hero.paidCollectibles);

  var heroParam = {
    data: {
      amount: parseFloat(collection) + parseFloat(hero.amount),
      earnings: parseFloat(earnings) + parseFloat(hero.earnings),
      collectibles: collectibles,
      remainingCollectibles: remaining,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: riderId,
    },
  };

  if (remaining < 0) {
    var errorDetails = "Bug occured. This is where negative remaining value starts";
    var error = { details: errorDetails, type: "M", functionName: "saveCollectionsAndPayablesToRider" };
    await insertErrorLog(error);
  }

  const updatedHero = await context.prisma.hero.update(heroParam);

  if (!updatedHero) {
    throw new Error("Unable to save collection and remittance to hero table");
  }
}
/**
End logic for hero
**/

async function revertCollectionsAndPayablesToRider(
  parent,
  args,
  context,
  info,
  riderId,
  merchantId
) {
  const collection = await getHeroCollectionFromOrder(
    parent,
    args,
    context,
    info
  );
  const earnings = await getHeroEarningsFromOrder(parent, args, context, info);

  const merchant = await context.prisma.merchant.findOne({ where: { id: merchantId } });
  if (!merchant) {
    var errorDetails = "No such merchant "+merchantId+" found";
    var error = { details: errorDetails, type: "M", functionName: "revertCollectionsAndPayablesToRider" };
    await insertErrorLog(error);
  }

  const order = await context.prisma.order.findOne({ where: { id: args.id } });
  if (!order) {
    var errorDetails = "No such order "+args.id+" found";
    var error = { details: errorDetails, type: "M", functionName: "revertCollectionsAndPayablesToRider" };
    await insertErrorLog(error);
  }

  const adminCollectibles = calculateHeroCollectibles(merchant, order, collection, earnings);

  const hero = await context.prisma.hero.findOne({ where: { id: riderId } });
  if (!hero) {
    var errorDetails = "No such hero "+riderId+" found";
    var error = { details: errorDetails, type: "M", functionName: "revertCollectionsAndPayablesToRider" };
    await insertErrorLog(error);
  }

  var collectibles = parseFloat(hero.collectibles) - parseFloat(adminCollectibles);
  var remaining = parseFloat(collectibles) + parseFloat(hero.paidCollectibles);

  var heroParam = {
    data: {
      amount: parseFloat(hero.amount) - parseFloat(collection),
      earnings: parseFloat(hero.earnings) - parseFloat(earnings),
      collectibles: collectibles,
      remainingCollectibles: remaining,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: riderId,
    },
  };

  if (remaining < 0) {
    var errorDetails = "Bug occured. This is where negative remaining value starts";
    var error = { details: errorDetails, type: "M", functionName: "revertCollectionsAndPayablesToRider" };
    await insertErrorLog(error);
  }

  const updatedHero = await context.prisma.hero.update(heroParam);

  if (!updatedHero) {
    var errorDetails = "Unable to revert collection and remittance to hero table";
    var error = { details: errorDetails, type: "M", functionName: "revertCollectionsAndPayablesToRider" };
    await insertErrorLog(error);
  }
}

async function createOrderProduct(parent, args, context, info) {
  /*const orderProduct = await context.prisma.createOrderProduct({ 
      ...args, 
      order:   {connect: {id: args.order }},
      product: {connect: {id: args.product}}
  })*/

  const orderProduct = await context.prisma.orderProduct.create({
    data: {
      ...args,
      order: { connect: { id: args.order } },
      product: { connect: { id: args.product } },
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  return orderProduct;
}

async function updateOrderProduct(parent, args, context, info) {
  const param = {
    data: {
      price: args.price,
      quantity: args.quantity,
      subtotal: args.subtotal,
      order: args.order ? { connect: { id: args.order } } : undefined,
      product: args.product ? { connect: { id: args.product } } : undefined,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const orderProduct = await context.prisma.updateOrderProduct(param);

  return orderProduct;
}

async function deleteOrderProduct(parent, args, context, info) {
  const orderProduct = await context.prisma.orderProduct.delete({
    where: { id: args.id },
  });

  return orderProduct;
}

async function payPayable(parent, args, context, info) {
  const merchant = await context.prisma.merchant.findOne({
    where: { id: args.merchant },
  });

  if (!merchant) {
    throw new Error("No such merchant found");
  }

  var totalPaidPayable = args.amount + merchant.paidPayables;
  var remaining = merchant.remittance - totalPaidPayable;

  if (parseFloat(remaining) < 0) {
    var errorDetails = "Cannot pay. Total Pay Amount (₱" +
        totalPaidPayable +
        ") is greater than Remittance (P" +
        merchant.remittance +
    ")";
    var error = { details: errorDetails, type: "M", functionName: "payPayable" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const paidPayable = await context.prisma.paidPayable.create({
    data: {
      amount: args.amount,
      merchant_merchantTopaidPayable: { connect: { id: args.merchant } },
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  const param = {
    data: {
      paidPayables: totalPaidPayable,
      remainingPayables: remaining,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.merchant,
    },
  };

  const updatedMerchant = await context.prisma.merchant.update(param);

  return paidPayable;
}

async function deletePaidPayable(parent, args, context, info) {
  const paidPayable = await context.prisma.paidPayable.findOne({
    where: { id: args.id },
  });

  if (!paidPayable) {
    throw new Error("No such paid payable found");
  }

  const merchant = await context.prisma.merchant.findOne({
    where: { id: paidPayable.merchant },
  });

  if (!merchant) {
    throw new Error("No such merchant found");
  }

  var totalPaidPayable = merchant.paidPayables - paidPayable.amount;

  if (totalPaidPayable < 0) {
    var errorDetails =   "Cannot delete. Paid Payable (₱" +
        paidPayable.amount +
        ") is greater than Total Paid Payable (P" +
        merchant.paidPayables +
    ")";
    var error = { details: errorDetails, type: "M", functionName: "deletePaidPayable" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const param = {
    data: {
      paidPayables: totalPaidPayable,
      remainingPayables: merchant.remainingPayables + paidPayable.amount,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: paidPayable.merchant,
    },
  };

  const updatedMerchant = await context.prisma.merchant.update(param);

  if (updatedMerchant) {
    const deletedPaidPayable = await context.prisma.paidPayable.delete({
      where: { id: args.id },
    });

    return deletedPaidPayable;
  }
}

async function deletePaidCollectible(parent, args, context, info) {
  const paidCollectible = await context.prisma.paidCollectible.findOne({
    where: { id: args.id },
  });

  if (!paidCollectible) {
    throw new Error("No such paid collectible found");
  }

  const hero = await context.prisma.hero.findOne({
    where: { id: paidCollectible.hero },
  });

  if (!hero) {
    throw new Error("No such hero found");
  }

  var totalPaidCollectible = hero.paidCollectibles - paidCollectible.amount;

  if (totalPaidCollectible < 0) {
    var errorDetails = "Cannot delete. Paid Collectible (₱" +
        paidCollectible.amount +
        ") is greater than Total Paid Collectible (P" +
        hero.paidCollectibles +
    ")";
    var error = { details: errorDetails, type: "M", functionName: "deletePaidCollectible" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const param = {
    data: {
      paidCollectibles: totalPaidCollectible,
      remainingCollectibles:
        hero.remainingCollectibles + paidCollectible.amount,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: paidCollectible.hero,
    },
  };

  const updatedHero = await context.prisma.hero.update(param);

  if (updatedHero) {
    const deletedPaidCollectible = await context.prisma.paidCollectible.delete({
      where: { id: args.id },
    });

    return deletedPaidCollectible;
  }
}

async function payCollectible(parent, args, context, info) {
  const hero = await context.prisma.hero.findOne({ where: { id: args.hero } });

  if (!hero) {
    throw new Error("No such hero found");
  }

  var totalPaidCollectible = args.amount + hero.paidCollectibles;
  var remaining = hero.collectibles - totalPaidCollectible;

  if (parseFloat(remaining) < 0) {
    var errorDetails = "Cannot pay. Total Pay amount (₱" +
        totalPaidCollectible +
        ") is greater than Remaining Collectibles (P" +
        hero.remainingCollectibles +
    ")";
    var error = { details: errorDetails, type: "M", functionName: "payCollectible" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const paidCollectible = await context.prisma.paidCollectible.create({
    data: {
      amount: args.amount,
      hero_heroTopaidCollectible: { connect: { id: args.hero } },
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  const param = {
    data: {
      paidCollectibles: totalPaidCollectible,
      remainingCollectibles: remaining,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.hero,
    },
  };

  const updatedHero = await context.prisma.hero.update(param);

  return paidCollectible;
}

async function createCosting(parent, args, context, info) {
  const costing = await context.prisma.costing.create({
    data: {
      ...args,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  return costing;
}

async function updateCosting(parent, args, context, info) {
  const param = {
    data: {
      firstKmCost: args.firstKmCost,
      excessPerKmCost: args.excessPerKmCost,
      appFee: args.appFee,
      errandsFlatRate: args.errandsFlatRate,
      errandsExcessPerKmCost: args.errandsExcessPerKmCost,
      errandsAppFee: args.errandsAppFee,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id,
    },
  };

  const costing = await context.prisma.costing.update(param);

  return costing;
}

function convertPercentToDecimal(percent) {
  //var percentToDecimal = percent <= 9 ? "0.0" + percent : "0." + percent;
  var percentToDecimal = percent / 100;

  return percentToDecimal;
}
/*async function deleteHero(parent, args, context, info) {
  const hero = await context.prisma.deleteHero({id: args.id})
 
  return hero
}*/

/*function post(parent, args, context, info) {
  const userId = getUserId(context)
  return context.prisma.createLink({
    url: args.url,
    description: args.description,
    postedBy: { connect: { id: userId } },
  })
}*/
async function reloadMobileUI(parent, args, context, info) {
  var dateTimeToday = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");
  var cronMessage = { cronGreeting: "Mabuhay! " + dateTimeToday };
  context.pubsub.publish("RELOAD_MOBILE", cronMessage);

  return cronMessage;
}

async function refreshUI(parent, args, context, info) {
  var dateTimeToday = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");
  var quote = {
    randomMessage: '"' + Quote.getRandomQuote() + '" ' + dateTimeToday,
  };
  context.pubsub.publish("RELOAD_UI", quote);

  return quote;
}

async function passOrderToNextHero(parent, args, context, info) {
  console.log("check if rider still doesn't accept/decline the order");
  var secondsAgo = moment()
    .subtract(30, "seconds")
    .tz("Asia/Manila")
    .format("YYYY-MM-DD HH:mm:ss");

  var sql =
    "SELECT id FROM `order` WHERE orderStatus IN (2,12) AND updatedAt <= '" +
    secondsAgo +
    "' ORDER BY id ASC";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (sqlResult.length) {
    sqlResult.forEach(async (order) => {
      var args = { id: order.id, status: 11 }; //hero cancel
      //console.log("it works. hahaha! order #"+args.id);
      await updateStatusOfOrder(parent, args, context, info);
    });
  }

  const cronMessage = await reloadMobileUI(parent, args, context, info);

  if (cronMessage) {
    return cronMessage;
  }
}

async function createMerchantLocality(parent, args, context, info) {
  const merchantLocality = await context.prisma.merchantLocality.create({
    data: {
      merchant_merchantTomerchantLocality: { connect: { id: args.merchantID } },
      locality: args.locality,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!merchantLocality) {
    var errorDetails =
      "Cannot create new locality for merchant " + args.merchantID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createMerchantLocality",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return merchantLocality;
}

async function deleteMerchantLocality(parent, args, context, info) {
  const merchantLocality = await context.prisma.merchantLocality.delete({
    where: { id: args.id },
  });

  if (!merchantLocality) {
    var errorDetails =
      "Cannot delete locality for merchant locality code ID:" + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteMerchantLocality",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return merchantLocality;
}

async function createCouponLocality(parent, args, context, info) {
  const couponLocality = await context.prisma.couponLocality.create({
    data: {
      coupon_couponTocouponLocality: { connect: { id: args.couponID } },
      locality: args.locality,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!couponLocality) {
    var errorDetails =
      "Cannot create new locality for coupon " + args.couponID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createCouponLocality",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return couponLocality;
}

async function deleteCouponLocality(parent, args, context, info) {
  const couponLocality = await context.prisma.couponLocality.delete({
    where: { id: args.id },
  });

  if (!couponLocality) {
    var errorDetails =
      "Cannot delete locality for coupon locality code ID:" + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteMerchantLocality",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return couponLocality;
}

async function createMerchantProductCategory(parent, args, context, info) {
  const merchantProductCategory = await context.prisma.merchantProductCategory.create({
    data: {
      merchant_merchantTomerchantProductCategory: {connect: {id: args.merchantID}},
      name: args.name,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!merchantProductCategory) {
    var errorDetails =
      "Cannot create new product category for merchant " + args.merchantID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createMerchantProductCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return merchantProductCategory;
}

async function updateMerchantProductCategory(parent, args, context, info) {
  const currentMerchantProductCategory = await context.prisma.merchantProductCategory.findOne({where: {id: args.id}});
  
  if (!currentMerchantProductCategory) {
    var errorDetails = "Merchant's product category " + args.id+" not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantProductCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const merchantProductCategory = await context.prisma.merchantProductCategory.update({
    data: {
      //merchant_merchantTomerchantProductCategory: {connect: {id: args.merchantID ? args.merchantID : currentMerchantProductCategory.merchant}},
      name: args.name,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id
    }
  });

  if (!merchantProductCategory) {
    var errorDetails =
      "Cannot update existing product category for merchant using ID " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateMerchantProductCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return merchantProductCategory;
}

async function deleteMerchantProductCategory(parent, args, context, info) {
  const merchantProductCategory = await context.prisma.merchantProductCategory.delete({
    where: {
      id: args.id
    }
  });

  if (!merchantProductCategory) {
    var errorDetails =
      "Cannot delete existing product category for merchant using ID " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteMerchantProductCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return merchantProductCategory;
}

/**start add-on**/
async function createAddon(parent, args, context, info) {
  const addon = await context.prisma.addon.create({
    data: {
      merchant_addonTomerchant: {connect: {id: args.merchantID}},
      name: args.name,
      price: args.price,
      markUpPrice: args.markUpPrice,
      priceWithMarkUp: parseFloat(args.price) + parseFloat(args.markUpPrice),
      onlyOnePerProduct: args.onlyOnePerProduct,
      maxPieces: args.maxPieces,
      active: true,
      isAvailable: true,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!addon) {
    var errorDetails =
      "Cannot create new add-on for merchant " + args.merchantID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createAddon",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return addon;
}

async function updateAddon(parent, args, context, info) {
  const currentAddon = await context.prisma.addon.findOne({where: {id: args.id}});
  
  if (!currentAddon) {
    var errorDetails = "Merchant's add-on " + args.id+" not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateAddon",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const addon = await context.prisma.addon.update({
    data: {
      //merchant_addonTomerchant: {connect: {id: args.merchantID}},
      name: args.name,
      price: args.price,
      markUpPrice: args.markUpPrice,
      priceWithMarkUp: parseFloat(args.price) + parseFloat(args.markUpPrice),
      onlyOnePerProduct: args.onlyOnePerProduct,
      maxPieces: args.maxPieces,
      active: args.active,
      isAvailable: args.isAvailable,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id
    }
  });

  if (!addon) {
    var errorDetails =
      "Cannot update existing product category for merchant using ID " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateAddon",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return addon;
}

async function deleteAddon(parent, args, context, info) {
  const addon = await context.prisma.addon.delete({
    where: {
      id: args.id
    }
  });

  if (!addon) {
    var errorDetails =
      "Cannot delete add-on " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteAddon",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return addon;
}
/**end add-on**/

async function createProductCategory(parent, args, context, info) {
  const productCategory = await context.prisma.productCategory.create({
    data: {
      merchant_merchantToproductCategory: {connect: {id: args.merchantID}},
      merchantProductCategory_merchantProductCategoryToproductCategory: {connect: {id: args.merchantProductCategoryID}},
      product_productToproductCategory: {connect: {id: args.productID}},
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!productCategory) {
    var errorDetails =
      "Cannot create new product category for merchant " + args.merchantID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createProductCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return productCategory;
}

async function updateProductCategory(parent, args, context, info) {
  const currentProductCategory = await context.prisma.productCategory.findOne({where: {id: args.id}});
  
  if (!currentProductCategory) {
    var errorDetails = "Product category " + args.id+" not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const productCategory = await context.prisma.productCategory.update({
    data: {
      merchantProductCategory_merchantProductCategoryToproductCategory: {connect: {id: args.merchantProductCategoryID ? args.merchantProductCategoryID : currentProductCategory.merchant}},
      product_productToproductCategory: {connect: {id: args.productID ? args.productID : currentProductCategory.product}},
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id
    }
  });

  if (!productCategory) {
    var errorDetails =
      "Cannot update product category ID " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return productCategory;
}

async function deleteProductCategory(parent, args, context, info) {
  const productCategory = await context.prisma.productCategory.delete({
    where: {
      id: args.id
    }
  });

  if (!productCategory) {
    var errorDetails =
      "Cannot delete product category ID " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteProductCategory",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return productCategory;
}

/** start product add-on**/
async function createProductAddon(parent, args, context, info) {
  const productAddon = await context.prisma.productAddon.create({
    data: {
      merchant_merchantToproductAddon: {connect: {id: args.merchantID}},
      product_productToproductAddon: {connect: {id: args.productID}},
      addon_addonToproductAddon: {connect: {id: args.addonID}},
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!productAddon) {
    var errorDetails =
      "Cannot create new add-on for product " + args.productID;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createProductAddon",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return productAddon;
}

async function updateProductAddon(parent, args, context, info) {
  const currentProductAddon = await context.prisma.productAddon.findOne({where: {id: args.id}});
  
  if (!currentProductAddon) {
    var errorDetails = "Add-on "+currentProductAddon.addon+" for product "+currentProductAddon.product+" not found";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductAddon",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  const productAddon = await context.prisma.productAddon.update({
    data: {
      product_productToproductAddon: {connect: {id: args.productID ? args.productID : currentProductAddon.product}},
      addon_addonToproductAddon: {connect: {id: args.addonID ? args.addonID : currentProductAddon.addon}},
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      id: args.id
    }
  });

  if (!productAddon) {
    var errorDetails =
      "Cannot update product add-on ID " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateProductAddon",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return productAddon;
}

async function deleteProductAddon(parent, args, context, info) {
  const productAddon = await context.prisma.productAddon.delete({
    where: {
      id: args.id
    }
  });

  if (!productAddon) {
    var errorDetails =
      "Cannot delete product add-on ID " + args.id;
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "deleteProductAddon",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return productAddon;
}
/** end product add-on**/

async function updateApp(parent, args, context, info) {
  const param = {
    data: {
      ...args,
      updatedAt: getPHDateTimeNow()
    },
    where: {
      id: 1
    }
  };

  const app = await context.prisma.app.update(param);
  const data = `Updated App Version Android: ${args.androidVersion} | iOS: ${args.appleVersion} on ${args.appEnv}`;
  const sendSlackErrorMessage = await axios.post("https://hooks.slack.com/services/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", {
    "text": data,
  });
  console.log(sendSlackErrorMessage);
  
  if (!app) {
    var errorDetails = "Unable to update MyHero App details";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "updateApp",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return app;
}

/**
We might put a limit here next time
**/
async function autoMerchantConfirmed(parent, args, context, info) {
  var tenSecondsAgo = moment().subtract(10, 'seconds').tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');

  const customerConfirmedOrders = await context.prisma.order.findMany({
    where: {
      AND: [
        {orderStatus: 1},
        {createdAt: {lte: new Date(tenSecondsAgo)}}
      ]
    }
  });

  customerConfirmedOrders.forEach(async (order) => {
    var args = {id: order.id, status: 2};
    await updateStatusOfOrder(parent, args, context, info);
    //console.log('order id: '+args.id);
  });
}

/**
 * Method to get heroes near merchant
 * 
 * @param latitude merchant latitude
 * @param longitude merchant longitude
 * @param km search radius by KM
 * 
 * @return Array id of heroes near merchant.
 */
async function getHeroesNearMerchant(parent, args, context, info) {
  var lat = args.merchantLat;
  var lng = args.merchantLng;
  var km = args.radiusLimitKm;
  var branch = args.branch;
  var heroId = 0;
  //var heroesNearMerchant = [];

  var sql = "SELECT * FROM ( SELECT *, ( ( ( acos( sin(("+lat+" * pi() / 180)) * sin(( `lat` * pi() / 180)) + cos(("+lat+" * pi() /180 )) * cos(( `lat` * pi() / 180)) * cos((("+lng+" - `lng`) * pi()/180))) ) * 180/pi() ) * 60 * 1.1515 * 1.609344 ) AS distance FROM `heroesLocation` ) `heroesLocation` WHERE distance <= "+km+" AND `orderStatus` IN (6, 7, 8) AND `branch` = "+branch+" ORDER BY `distance` ASC LIMIT 1";
  var sqlResult = await context.prisma.$queryRaw(sql);

  if (!sqlResult) {
    var errorDetails = "Unable to get heroes near merchant";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "getHeroesNearMerchant",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  if (sqlResult.length) {
    sqlResult.forEach((nearestRider) => {
      //heroesNearMerchant.push(rider.hero);
      heroId = nearestRider.hero;
    });
  }

  return heroId;
  //return heroesNearMerchant;
}

/**
I suggest this function can only be used on hero registration
**/
async function updateHeroesLocation(parent, args, context, info){
  const findHeroLocation = await context.prisma.heroesLocation.findOne({
    where: {hero: args.heroId},
  });

  if (!findHeroLocation) {
    var heroesLocation = await createHeroesLocation(parent, args, context, info);

    return heroesLocation;
  }

  var heroesLocation = await context.prisma.heroesLocation.update({
    data: {
      lat: args.heroLat ? args.heroLat : 0,
      lng: args.heroLng ? args.heroLng : 0,
      merchant_heroesLocationTomerchant: args.merchantId ? { connect: { id: args.merchantId } } : undefined,
      orderStatus_heroesLocationToorderStatus: { connect: { id: args.orderStatusId ? args.orderStatusId : 1 } },
      branch_branchToheroesLocation: args.branchId ? { connect: { id: args.branchId } } : findHeroLocation.branch,
      updatedAt: getPHDateTimeNow(),
    },
    where: {
      hero: args.heroId
    }
  });

  if (!heroesLocation) {
    var errorDetails = "Unable to update heroesLocation";
    var error = { details: errorDetails, type: "M", functionName: "updateHeroesLocation" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return heroesLocation;
}

async function createHeroesLocation(parent, args, context, info){
  const findHeroLocation = await context.prisma.heroesLocation.findOne({
    where: {hero: args.heroId},
  });

  if (findHeroLocation) {
    var heroesLocation = await updateHeroesLocation(parent, args, context, info);

    return heroesLocation;
  }

  var heroesLocation = await context.prisma.heroesLocation.create({
    data: {
      hero_heroToheroesLocation: { connect: { id: args.heroId } },
      merchant_heroesLocationTomerchant: args.merchantId ? { connect: { id: args.merchantId } } : undefined,
      orderStatus_heroesLocationToorderStatus: args.orderStatusId ? { connect: { id: args.orderStatusId } } : 1,
      branch_branchToheroesLocation: { connect: { id: args.branchId } },
      lat: args.heroLat ? args.heroLat : 0,
      lng: args.heroLng ? args.heroLng : 0,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  });

  if (!heroesLocation) {
    var errorDetails = "Unable to create heroesLocation";
    var error = { details: errorDetails, type: "M", functionName: "createHeroesLocation" };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return heroesLocation;
}

async function createRiderReview(parent, args, context, info) {
  const param = {
    data: {
      user: { connect: { id: args.user } },
      hero_heroToriderReview: { connect: { id: args.hero } },
      merchant_merchantToriderReview: { connect: { id: args.merchant } },
      order_orderToriderReview: { connect: { id: args.order } },
      rating: args.rating,
      review: args.review,
      createdAt: getPHDateTimeNow(),
      updatedAt: getPHDateTimeNow(),
    },
  };
  const riderReview = await context.prisma.riderReview.create(param);

  if (!riderReview) {
    var errorDetails =
      "Unable to create new rider review";
    var error = {
      details: errorDetails,
      type: "M",
      functionName: "createRiderReview",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return riderReview;
}

module.exports = {
  campHere,
  computeMerchantToHeroKm,
  signup,
  createUserMerchant,
  createMerchantUser,
  updateMerchantUser,
  createUserHero,
  createHeroUser,
  updateHeroUser,
  login,
  changePassword,
  changeForgottenPassword,
  singleUpload,
  updateUser,
  deleteUser,
  createCategory,
  updateCategory,
  deleteCategory,
  createLocality,
  updateLocality,
  deleteLocality,
  createMerchant,
  updateMerchant,
  updateMerchantSchedule,
  deleteMerchant,
  createMerchantTag,
  updateMerchantTag,
  deleteMerchantTag,
  createMerchantCategory,
  updateMerchantCategory,
  deleteMerchantCategory,
  createTag,
  updateTag,
  deleteTag,
  createCouponType,
  updateCouponType,
  deleteCouponType,
  createCouponStatus,
  updateCouponStatus,
  deleteCouponStatus,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  createErrand,
  updateErrand,
  deleteErrand,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductAvailability,
  updateProductActiveStatus,
  createProductSize,
  updateProductSize,
  deleteProductSize,
  createMerchantProductSize,
  updateMerchantProductSize,
  deleteMerchantProductSize,
  createExpense,
  updateExpense,
  deleteExpense,
  createMerchantLocality,
  deleteMerchantLocality,
  createCouponLocality,
  deleteCouponLocality,
  createMerchantProductCategory,
  updateMerchantProductCategory,
  deleteMerchantProductCategory,
  createAddon,
  updateAddon,
  deleteAddon,
  createProductAddon,
  updateProductAddon,
  deleteProductAddon,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  createHero,
  updateHero,
  uploadHeroGallery,
  deleteHeroGallery,
  createOrderStatus,
  updateOrderStatus,
  deleteOrderStatus,
  createOrder,
  updateOrder,
  deleteOrder,
  updateStatusOfOrder,
  transferOrderToNewHero,
  passOrderToNextHero,
  createOrderProduct,
  updateOrderProduct,
  updateOrderProducts,
  updateOrderAddons,
  deleteOrderProduct,
  seenOrders,
  uploadUserPhoto,
  uploadUserValidIdImg,
  uploadMerchantPhoto,
  uploadMerchantTrendingPhoto,
  uploadProductPhoto,
  uploadExpensePhoto,
  uploadHeroNbi,
  uploadHeroPoliceClearance,
  uploadHeroPlateNo,
  uploadHeroDrivingLicense,
  payPayable,
  payCollectible,
  deletePaidPayable,
  deletePaidCollectible,
  createCosting,
  updateCosting,
  createRiderReview,
  setHeroAvailability,
  setHeroOnline,
  callEmergency,
  reloadMobileUI,
  refreshUI,
  updateApp,
  autoMerchantConfirmed,
  sendPush,
  updateFirebaseToken,
};
