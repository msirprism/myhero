const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const Subscription = require("./resolvers/Subscription");
const User = require("./resolvers/User");
const Branch = require("./resolvers/Branch");
const Expense = require("./resolvers/Expense");
const Analytic = require("./resolvers/Analytic");
const Category = require("./resolvers/Category");
const Locality = require("./resolvers/Locality");
const Merchant = require("./resolvers/Merchant");
const Tag = require("./resolvers/Tag");
const MerchantTag = require("./resolvers/MerchantTag");
const MerchantCategory = require("./resolvers/MerchantCategory");
const MerchantLocality = require("./resolvers/MerchantLocality");
const CouponLocality = require("./resolvers/CouponLocality");
const CouponType = require("./resolvers/CouponType");
const CouponStatus = require("./resolvers/CouponStatus");
const Coupon = require("./resolvers/Coupon");
const DeliveryCounter = require("./resolvers/DeliveryCounter");
const Errand = require("./resolvers/Errand");
const Product = require("./resolvers/Product");
const Hero = require("./resolvers/Hero");
const HeroGallery = require("./resolvers/HeroGallery");
const OrderStatus = require("./resolvers/OrderStatus");
const Order = require("./resolvers/Order");
const OrderProduct = require("./resolvers/OrderProduct");
const Transaksyon = require("./resolvers/Transaksyon");
const PaidPayable = require("./resolvers/PaidPayable");
const PaidCollectible = require("./resolvers/PaidCollectible");
const HeroesLocation = require("./resolvers/HeroesLocation");
const MerchantProductCategory = require("./resolvers/MerchantProductCategory");
const ProductCategory = require("./resolvers/ProductCategory");
const Addon = require("./resolvers/Addon");
const ProductAddon = require("./resolvers/ProductAddon");
const OrderAddon = require("./resolvers/OrderAddon");
const MerchantProductSize = require("./resolvers/MerchantProductSize");
const ProductSize = require("./resolvers/ProductSize");
const RiderReview = require("./resolvers/RiderReview");
//const Peso = require('./custom-scalars/Peso')
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
//const { prisma } = require('./generated/prisma-client')
const { GraphQLServer, PubSub, withFilter } = require("graphql-yoga");
const jwt = require("jsonwebtoken");
const { AuthenticationError } = require("apollo-server-core");
const pubsub = new PubSub();
const { request, GraphQLClient } = require("graphql-request");
const cron = require("node-cron");
const { generateHeroCode, insertErrorLog } = require("./utils");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: "../prisma/.env" });
const NoIntrospection = require('graphql-disable-introspection');
// 1
const resolvers = {
  Query,
  Mutation,
  Subscription: {
    updatedOrder: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("UPDATED_ORDER"),
        (payload, variables) => {
          return payload.updatedOrder.order.id === variables.id;
        }
      ),
    },
    orderStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("ORDER_STATUS_CHANGED"),
        (payload, variables) => {
          return (
            payload.orderStatusChanged.order.orderStatus === variables.orderStatus
          );
        }
      ),
    },
    orderToMe: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("ORDER_TO_ME"),
        (payload, variables) => {
          return payload.orderToMe.order.merchant === variables.merchant;
        }
      ),
    },
    assignToHero: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("ASSIGN_TO_HERO"),
        (payload, variables) => {
          return payload.assignToHero.order.hero === variables.hero;
        }
      ),
    },
    reloadMobile: {
      subscribe: () => pubsub.asyncIterator("RELOAD_MOBILE"),
      resolve: (payload) => {
        return payload;
      },
    },
    reloadUI: {
      subscribe: () => pubsub.asyncIterator("RELOAD_UI"),
      resolve: (payload) => {
        return payload;
      },
    },
    newUser: {
      subscribe: () => pubsub.asyncIterator("NEW_USER"),
      resolve: (payload) => {
        return payload;
      },
    },
    updatedUser: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("UPDATED_USER"),
        (payload, variables) => {
          return payload.updatedUser.id === variables.user;
        }
      ),
    }
  },
  User,
  Category,
  Locality,
  Merchant,
  Tag,
  MerchantTag,
  MerchantCategory,
  MerchantLocality,
  CouponLocality,
  CouponType,
  CouponStatus,
  Coupon,
  DeliveryCounter,
  Errand,
  Product,
  Hero,
  HeroGallery,
  OrderStatus,
  Order,
  OrderProduct,
  Transaksyon,
  PaidPayable,
  PaidCollectible,
  HeroesLocation,
  MerchantProductCategory,
  ProductCategory,
  Addon,
  ProductAddon,
  OrderAddon,
  MerchantProductSize,
  ProductSize,
  RiderReview,
  //Peso
};

// 3
const server = new GraphQLServer({
  typeDefs: "./src/schema.graphql",
  resolvers,
  context: (request) => {
    return {
      ...request,
      prisma,
      pubsub,
      withFilter,
    };
  },
  // middlewares: [autheticate],
});
/**@type {import('graphql-yoga/dist/types').SubscriptionServerOptions} */
const serverOptions = {
  port: process.env.PORT,
  subscriptions: {
    // optional interval in ms to send KEEPALIVE messages to all clients
    keepAlive: 100000 * 120,
  },
  validationRules: (process.env.NODE_ENV == 'production' ? [NoIntrospection] : []),//Vince wants introspection disable in live only
};

if (process.env.NODE_ENV == 'production') {
  serverOptions.cors = {
    credentials: true,
    origin: [process.env.FRONTEND_URL],
  }
}

if (process.env.APP_ENV == "live" || process.env.APP_ENV == "uat") {
  serverOptions.playground = false;
}

server.start(serverOptions, (options) =>
  console.log(`🚀 Server is running on port ${process.env.PORT}`)
);
//server.start(serverOptions, (options) => console.log(`🚀 Server is running on http://localhost:4000`))
/*server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});*/
//(orderStatuses: [1, 2, 3, 4, 5, 6])
const ordersForCron = `
  query {
    ordersForCron{
      id
    }
  }
`;
// //run cron job every minute
cron.schedule("* * * * *", async () => {
  if (process.env.APP_ENV == 'live' || process.env.APP_ENV == 'uat' || process.env.APP_ENV == 'local') {
    console.log('cron is running...');

    var endpoint = `http://localhost:${process.env.PORT}/`;

    switch (process.env.APP_ENV) {
      case 'live':    
        var gqlClient = new GraphQLClient(endpoint, {
            headers: {
              Authorization: process.env.JWT_LIVE
            }
          }
        );
        break;
      case 'uat':
        var gqlClient = new GraphQLClient(endpoint, {
            headers: {
              Authorization: process.env.JWT_UAT
            }
          }
        );
        break;
      case 'local':
        var gqlClient = new GraphQLClient(endpoint, {
            headers: {
              Authorization: process.env.JWT_LOCAL
            }
          }
        );
        break;
      default:
        var gqlClient = new GraphQLClient(endpoint, {
            headers: {
              Authorization: ''
            }
          }
        );
    }

    /*gqlClient.request(ordersForCron).then((data) => {
      console.log(data);
      console.log(data.ordersForCron[0].id);
      console.log("cron job finished");
    });*/

     return await request(`http://localhost:${process.env.PORT}/`, ordersForCron)
     .then((data) => {
    //     //console.log(data);
    //     //console.log(data.ordersForCron[0].id);
       console.log("cron job finished");
     });
  }
});
