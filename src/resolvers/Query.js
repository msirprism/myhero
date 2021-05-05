const { 
  withPesoSign, 
  withComma, 
  getWordsOfWisdom, 
  insertErrorLog, 
  getPHDateTimeNow, 
  isCouponValidMessages,
  isCouponValid,
} = require("../utils");
const {
  merchantsWithDistance,
  calculateDeliveryFee,
} = require("../directions-api");
const { join } = require("@prisma/client");
const dotenv = require("dotenv");
dotenv.config({ path: "../../prisma/.env" });
const Mutation = require("./Mutation");
const moment = require('moment-timezone');

function greeting() {
  return "Welcome to MyHero GraphQL server";
}

async function aboutApp(parent, args, context, info) {
  const app = await context.prisma.app.findOne({ where: { id: 1 } });

  app.phTimeNow = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");

  if (!app) {
    throw new Error("No app details found");
  }

  return app;
}

async function users(parent, args, context, info) {
  const where = {};

  if (args.filter) {
    where.OR = [
      { name: { contains: args.filter } },
      { email: { contains: args.filter } },
    ];
  }
  
  if (args.type) {
    where.AND = [{type: args.type}];
  }

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.user.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function usersPagination(parent, args, context, info) {
  const where = {};

  if (args.filter) {
    where.OR = [
      { name: { contains: args.filter } },
      { email: { contains: args.filter } },
    ];
  }
  
  if (args.type) {
    where.AND = [{type: args.type}];
  }

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.user.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  const count = await context.prisma.user.count({ where });

  return {
    list,
    count,
  };
}

async function user(parent, args, context, info) {
  const user = await context.prisma.user.findOne({ where: { id: args.id } });

  if (!user) {
    throw new Error("No such user found");
  }

  return user;
}

async function categories(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.category.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function categoriesPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.category.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const count = await context.prisma.category.count({ where });

  return {
    list,
    count,
  };
}

async function localities(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.locality.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function localitiesPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.localities.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const count = await context.prisma.localities.count({ where });

  return {
    list,
    count,
  };
}

async function merchants(parent, args, context, info) {
  var where = {};
   
  if (args.filter) {
    where.name = {contains: args.filter};
  }

  if (args.category) {
    where.merchantCategory = {some: {category: args.category}};
  }

  if (args.locality) {
    where.merchantLocality = {some: {locality: args.locality}};
  }

  if (args.isPopular !== undefined) {
    where.isPopular = args.isPopular;
  }

  if (args.active !== undefined) {
    where.active = args.active;
  }

  if (args.isTrending !== undefined) {
    where.isTrending = args.isTrending;
  }

  if (args.status) {
    where.status = args.status;
  }

  if (args.remainingPayables > 0) {
    where.remainingPayables = { gte: args.remainingPayables }
  } else if (args.remainingPayables === 0) {
    where.remainingPayables = 0;
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchant.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function merchantsPagination(parent, args, context, info) {
  var where = {};
   
  if (args.filter) {
    where.name = {contains: args.filter};
  }

  if (args.category) {
    where.merchantCategory = {some: {category: args.category}};
  }

  if (args.locality) {
    where.merchantLocality = {some: {locality: args.locality}};
  }

  if (args.isPopular !== undefined) {
    where.isPopular = args.isPopular;
  }

  if (args.isTrending !== undefined) {
    where.isTrending = args.isTrending;
  }

  if (args.active !== undefined) {
    where.active = args.active;
  }

  if (args.status) {
    where.status = args.status;
  }

  if (args.remainingPayables > 0) {
    where.remainingPayables = { gte: args.remainingPayables }
  } else if (args.remainingPayables === 0) {
    where.remainingPayables = 0;
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchant.findMany({
    skip: args.skip,
    take: args.first,
    where: where,
    orderBy: orderBy,
  });

  const count = await context.prisma.merchant.count({ where });

  return {
    list,
    count,
  };
}

async function merchant(parent, args, context, info) {
  const merchant = await context.prisma.merchant.findOne({
    where: { id: args.id },
  });

  if (!merchant) {
    throw new Error("No such merchant found");
  } else {
    if (args.customerLat && args.customerLng) {
      const fields = `id, name, owner, lat, lng, isTrending,trendingAppFee,trendingFlatRate`;
      
      const merchantCoordinates = await context.prisma
      .$queryRaw(`SELECT ${fields} FROM merchant WHERE id IN (`+args.id+")");

      const customerCoordinates = {
        latitude: args.customerLat,
        longitude: args.customerLng,
      };

      const costing = await context.prisma.costing.findOne({ where: { id: 1 } });
      const merchanDistanceAndDeliveryFee = await merchantsWithDistance({
        costing,
        merchants: merchantCoordinates,
        customerCoordinates,
      });

      console.log(
        "merchanDistanceAndDeliveryFee >>> ",
        merchanDistanceAndDeliveryFee
      );
      
      merchant.distance = merchanDistanceAndDeliveryFee[0].distance;
      merchant.deliveryFee = merchanDistanceAndDeliveryFee[0].deliveryFee;
      merchant.excessDeliveryFee = merchanDistanceAndDeliveryFee[0].excessDeliveryFee;
    }
    
    return merchant;
  }
}

async function merchantByUserId(parent, args, context, info) {
  const merchant = await context.prisma.merchant.findOne({ 
    where: { user: args.user } 
  });

  if (!merchant) {
    throw new Error("No such merchant found");
  }

  return merchant;
}


async function merchantOperationTime(parent, args, context, info) {
  const merchant = await context.prisma.merchant.findOne({
    where: {id: args.id},
  });

  if (!merchant) {
    throw new Error("No such merchant found");
  } 
    
  return merchant;
}

async function popularMerchants(parent, args, context, info) {
  var where = {isPopular: true};
   
  if (args.filter) {
    where.name = {contains: args.filter};
  }

  if (args.locality) {
    where.merchantLocality = {some: {locality: args.locality}};
  }

  if (args.active !== undefined) {
    where.active = args.active;
  }

  if (args.isTrending !== undefined) {
    where.isTrending = args.isTrending;
  }

  if (args.status) {
    where.status = args.status;
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchant.findMany({
    skip: args.skip,
    take: args.first,
    where: where,
    orderBy: orderBy,
  });

  return list;
}

async function popularMerchantsPagination(parent, args, context, info) {
  var where = {isPopular: true};
   
  if (args.filter) {
    where.name = {contains: args.filter};
  }

  if (args.locality) {
    where.merchantLocality = {some: {locality: args.locality}};
  }

  if (args.active !== undefined) {
    where.active = args.active;
  }

  if (args.isTrending !== undefined) {
    where.isTrending = args.isTrending;
  }

  if (args.status) {
    where.status = args.status;
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchant.findMany({
    skip: args.skip,
    take: args.first,
    where: where,
    orderBy: orderBy,
  });

  const count = await context.prisma.merchant.count({ where });

  return {
    list,
    count,
  };
}

async function trendingMerchants(parent, args, context, info) {
  var where = {isTrending: true};
   
  if (args.filter) {
    where.name = {contains: args.filter};
  }

  if (args.locality) {
    where.merchantLocality = {some: {locality: args.locality}};
  }

  if (args.active !== undefined) {
    where.active = args.active;
  }

  if (args.status) {
    where.status = args.status;
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchant.findMany({
    skip: args.skip,
    take: args.first,
    where: where,
    orderBy: orderBy,
  });

  return list;
}

async function trendingMerchantsPagination(parent, args, context, info) {
  var where = {isTrending: true};
   
  if (args.filter) {
    where.name = {contains: args.filter};
  }

  if (args.locality) {
    where.merchantLocality = {some: {locality: args.locality}};
  }

  if (args.active !== undefined) {
    where.active = args.active;
  }

  if (args.status) {
    where.status = args.status;
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchant.findMany({
    skip: args.skip,
    take: args.first,
    where: where,
    orderBy: orderBy,
  });

  const count = await context.prisma.merchant.count({ where });

  return {
    list,
    count,
  };
}

async function expenses(parent, args, context, info) {
  var where = {};

  if (args.name || (args.startDate && args.endDate)) {
    var where = { AND: [] };

    if (args.name) {
      where.AND.push({ name: { contains: args.name } });
    }

    if (args.startDate && args.endDate) {
      where.AND.push({ expenseDate: { gte: new Date(args.startDate) } });
      where.AND.push({ expenseDate: { lte: new Date(args.endDate) } });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.expense.findMany({
    skip: args.skip,
    take: args.first,
    where: where,
    orderBy: orderBy,
  });

  return list;
}

async function expensesPagination(parent, args, context, info) {
  var where = {};

  if (args.name || (args.startDate && args.endDate)) {
    where = { AND: [] };

    if (args.name) {
      where.AND.push({ name: { contains: args.name } });
    }

    if (args.startDate && args.endDate) {
      where.AND.push({ expenseDate: { gte: new Date(args.startDate) } });
      where.AND.push({ expenseDate: { lte: new Date(args.endDate) } });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.expense.findMany({
    skip: args.skip,
    take: args.first,
    where: where,
    orderBy: orderBy,
  });

  if (args.name || (args.startDate && args.endDate)) {
    var wheres = "";

    if (args.name) {
      wheres += " name LIKE '%" + args.name + "%' ";
    }

    if (args.startDate && args.endDate) {
      if (args.name) {
        wheres += " AND ";
      }

      wheres +=
        " (expenseDate BETWEEN '" +
        args.startDate +
        "' AND '" +
        args.endDate +
        "') ";
    }

    var rawCount = await context.prisma.$queryRaw(
      "SELECT COUNT(*) AS count, SUM(amount) AS totalAmount FROM expense WHERE " +
        wheres
    );
  } else {
    var rawCount = await context.prisma.$queryRaw(
      "SELECT COUNT(*) AS count, SUM(amount) AS totalAmount FROM expense"
    );
  }

  var count = 0;
  var totalAmount = 0;
  var totalAmountStr = withPesoSign(0);

  rawCount.forEach((raw) => {
    count = raw.count;
    totalAmount = raw.totalAmount;
    totalAmountStr = withPesoSign(totalAmount);
  });

  return {
    list,
    count,
    totalAmount,
    totalAmountStr,
  };
}

async function expense(parent, args, context, info) {
  const expense = await context.prisma.expense.findOne({
    where: { id: args.id },
  });

  if (!expense) {
    throw new Error("No such expense found");
  }

  return expense;
}

async function tags(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.tag.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function tagsPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.tag.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const count = await context.prisma.tag.count({ where });

  return {
    list,
    count,
  };
}

async function tag(parent, args, context, info) {
  const tag = await context.prisma.tag.findOne({ where: { id: args.id } });

  if (!tag) {
    throw new Error("No such tag found");
  }

  return tag;
}

async function merchantTags(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ tag: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchantTag.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function merchantTagsPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ tag: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchantTag.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const count = await context.prisma.merchantTag.count({ where });

  return {
    list,
    count,
  };
}

async function merchantTag(parent, args, context, info) {
  const merchantTag = await context.prisma.merchantTag.findOne({
    where: { id: args.id },
  });

  if (!merchantTag) {
    throw new Error("No such merchant tag found");
  }

  return merchantTag;
}

async function merchantLocalities(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.locality) {
    where = { AND: [] };

    if (args.filter) {
      where.AND.push({ merchant: { equals: args.merchant } });
    }

    if (args.locality) {
      where.AND.push({ locality: { equals: args.locality } });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchantLocality.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  return list;
}

async function merchantLocalitiesPagination(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.locality) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({ merchant: { equals: args.merchant } });
    }

    if (args.locality) {
      where.AND.push({ locality: { equals: args.locality } });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchantLocality.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  const count = await context.prisma.merchantLocality.count({ where });

  return {
    list,
    count,
  };
}

async function merchantLocality(parent, args, context, info) {
  const merchantLocality = await context.prisma.merchantLocality.findOne({
    where: { id: args.id },
  });

  if (!merchantLocality) {
    throw new Error("Merchant code " + args.id + " not found");
  }

  return merchantLocality;
}

/**start merchant product categories**/
async function merchantProductCategories(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.name) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.name) {
      where.AND.push({name: {contains: args.name} });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchantProductCategory.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  return list;
}

async function merchantProductCategoriesPagination(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.name) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.name) {
      where.AND.push({name: {contains: args.name} });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchantProductCategory.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  const count = await context.prisma.merchantProductCategory.count({ where });

  return {
    list,
    count,
  };
}

async function merchantProductCategory(parent, args, context, info) {
  const merchantProductCategory = await context.prisma.merchantProductCategory.findOne({
    where: { id: args.id },
  });

  if (!merchantProductCategory) {
    throw new Error("Merchant product category ID " + args.id + " not found");
  }

  return merchantProductCategory;
}
/**end   merchant product categories**/

/**start merchant product sizes**/
async function merchantProductSizes(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.name) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.name) {
      where.AND.push({name: {contains: args.name} });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchantProductSize.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  return list;
}

async function merchantProductSizesPagination(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.name) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.name) {
      where.AND.push({name: {contains: args.name} });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.merchantProductSize.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  const count = await context.prisma.merchantProductSize.count({ where });

  return {
    list,
    count,
  };
}

async function merchantProductSize(parent, args, context, info) {
  const merchantProductSize = await context.prisma.merchantProductSize.findOne({
    where: { id: args.id },
  });

  if (!merchantProductSize) {
    throw new Error("Merchant product size ID " + args.id + " not found");
  }

  return merchantProductSize;
}
/**end merchant product sizes**/

/**start product categories**/
async function productCategories(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.merchantProductCategories || args.productName) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.merchantProductCategories) {
      where.AND.push({merchantProductCategory: {in: args.merchantProductCategories} });
    }

    if (args.notInMerchantProductCategories) {
      const productsInCategories = await context.prisma.productCategory.findMany({
        where: {merchantProductCategory: {in: args.notInMerchantProductCategories}}
      });
      const excludedProducts = productsInCategories.map(productsInCategory => productsInCategory.product);

      where.AND.push({merchantProductCategory: {notIn: args.notInMerchantProductCategories} });
      where.AND.push({product: {notIn: excludedProducts} });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.productCategory.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  return list;
}

async function productCategoriesPagination(parent, args, context, info) { 
  var where = {};

  if (args.merchant || args.merchantProductCategories || args.productName) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.merchantProductCategories) {
      where.AND.push({merchantProductCategory: {in: args.merchantProductCategories} });
    }

    if (args.notInMerchantProductCategories) {
      const productsInCategories = await context.prisma.productCategory.findMany({
        where: {merchantProductCategory: {in: args.notInMerchantProductCategories}}
      });
      const excludedProducts = productsInCategories.map(productsInCategory => productsInCategory.product);

      where.AND.push({merchantProductCategory: {notIn: args.notInMerchantProductCategories} });
      where.AND.push({product: {notIn: excludedProducts} });
    }
  }

  const list = await productCategories(parent, args, context, info);

  const count = await context.prisma.productCategory.count({where});

  return {
    list,
    count,
  };
}

async function productCategory(parent, args, context, info) {
  const productCategory = await context.prisma.productCategory.findOne({
    where: { id: args.id },
  });

  if (!productCategory) {
    throw new Error("Product category ID " + args.id + " not found");
  }

  return productCategory;
}
/**end   product categories**/

/**start add-ons**/
async function addons(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.name) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.name) {
      where.AND.push({name: {contains: args.name} });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.addon.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  return list;
}

async function addonsPagination(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.name) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.name) {
      where.AND.push({name: {contains: args.name} });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await addons(parent, args, context, info);

  const count = await context.prisma.addon.count({ where });

  return {
    list,
    count,
  };
}

async function addon(parent, args, context, info) {
  const addon = await context.prisma.addon.findOne({
    where: { id: args.id },
  });

  if (!addon) {
    throw new Error("Add-on ID " + args.id + " not found");
  }

  return addon;
}
/**end add-ons**/

/**start product add-ons**/
async function productAddons(parent, args, context, info) {
  var where = {};

  if (args.merchant || args.product || args.addons || (args.isAvailable !== undefined && args.active !== undefined)) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant}); 
    }

    if (args.product) {
      where.AND.push({product: args.product}); 
    }

    if (args.addons) {
      where.AND.push({addon: {in: args.addons}}); 
    }

    if (args.isAvailable !== undefined && args.active !== undefined) {
      where.AND.push({ 
        addon_addonToproductAddon: {
          AND: [
            {isAvailable: args.isAvailable},
            {active: args.active},
          ]
        }
      });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.productAddon.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  return list;
}

async function productAddonsPagination(parent, args, context, info) { 
  var where = {};

  if (args.merchant || args.product || args.addons || (args.isAvailable !== undefined && args.active !== undefined)) {
    where = { AND: [] };

    if (args.merchant) {
      where.AND.push({merchant: args.merchant}); 
    }

    if (args.product) {
      where.AND.push({product: args.product}); 
    }

    if (args.addons) {
      where.AND.push({addon: {in: args.addons}}); 
    }

    if (args.isAvailable !== undefined && args.active !== undefined) {
      where.AND.push({ 
        addon_addonToproductAddon: {
          AND: [
            {isAvailable: args.isAvailable},
            {active: args.active},
          ]
        }
      });
    }
  }

  const list = await productAddons(parent, args, context, info);

  const count = await context.prisma.productAddon.count({where});

  return {
    list,
    count,
  };
}

async function productAddon(parent, args, context, info) {
  const productAddon = await context.prisma.productAddon.findOne({
    where: { id: args.id },
  });

  if (!productAddon) {
    throw new Error("Product add-on " + args.id + " not found");
  }

  return productAddon;
}
/**end   product add-ons**/

/**
 * TODO: allow this query to accept latitude, longitude & locality
 * modify sql query to fetch merchant WHERE locality == customer locality.
 * using the Google Directions API, the distance will be processed in this query
 * instead of user's data.
 *
 * TODO: add `customerLat` & `customerLng` as Float!
 *
 * WARNING: do not merge until the schema has not been updated
 */
async function merchantCategories(parent, args, context, info) {
  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };
  
  const where = {
    category: args.category,
  };

  if (args.active !== undefined) {
    where.active = args.active;
  }

  if (args.isTrending !== undefined) {
    where.isTrending = args.isTrending;
  }

  if (args.status) {
    where.status = args.status;
  }

  const list = await context.prisma.merchantCategory.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function merchantCategoriesPagination(parent, args, context, info) {
  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };
  const where = { category: args.category };

  if (args.active !== undefined) {
    where.active = args.active;
  }

  if (args.isTrending !== undefined) {
    where.isTrending = args.isTrending;
  }

  if (args.status) {
    where.status = args.status;
  }

  const list = await context.prisma.merchantCategory.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const count = await context.prisma.merchantCategory.count({ where });

  return {
    list,
    count,
  };
}

async function merchantCategory(parent, args, context, info) {
  const merchantCategory = await context.prisma.merchantCategory.findOne({
    where: { id: args.id },
  });

  if (!merchantCategory) {
    throw new Error("No such merchant category found");
  }

  return merchantCategory;
}

async function products(parent, args, context, info) {
  var where = {}; 

  if (args.filter || args.merchant || args.notInMerchantProductCategories) {
    if (args.filter && (args.merchant || args.notInMerchantProductCategories || args.notInAddons)) {
      var where = {OR: [], AND: []};
    } else if (args.filter && (!args.merchant && !args.notInMerchantProductCategories && !args.notInAddons)) {
      var where = {OR: []};
    } else if (!args.filter && (args.merchant || args.notInMerchantProductCategories || args.notInAddons)) {
      var where = {AND: []};
    }

    if (args.filter) {
      where.OR.push({name: { contains: args.filter}});
      where.OR.push({description: { contains: args.filter}});
    }

    if (args.merchant) {
      where.AND.push({merchant: args.merchant});
    }

    if (args.notInMerchantProductCategories) {
      //get all products which belong to these product categories
      var productCategoryArgs = {merchant: args.merchant, merchantProductCategories: args.notInMerchantProductCategories};
      const productsInCategories = await productCategories(parent, productCategoryArgs, context, info);
      const excludedProducts = productsInCategories.map(productsInCategory => productsInCategory.product);
      //exclude products which belong to these product categories.
      where.AND.push({id: {notIn: excludedProducts}});
    }

    if (args.notInMerchantProductSizes) {
      //get all products which belong to these product sizes
      var productSizeArgs = {merchantProductSizes: args.notInMerchantProductSizes};
      const productsInSizes = await productSizes(parent, productSizeArgs, context, info);
      const excludedProducts = productsInSizes.map(productsInSize => productsInSize.product);
      //exclude products which belong to these product categories.
      where.AND.push({id: {notIn: excludedProducts}}); 
    }

    if (args.notInAddons) {
      //get all products which belong to these add-ons
      var productAddonArgs = {merchant: args.merchant, addons: args.notInAddons};
      const productsInAddons = await productAddons(parent, productAddonArgs, context, info);
      const excludedProducts = productsInAddons.map(productsInAddon => productsInAddon.product);
      //exclude products which belong to these add-ons.
      where.AND.push({id: {notIn: excludedProducts}});
    }

    if (args.isAvailable != undefined) {
      where.AND.push({isAvailable: args.isAvailable});
    }
  }

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.product.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function productsByMerchant(parent, args, context, info) {
  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  if (args.merchantProductCategories) {
    var where = {
      merchant: args.merchantID, 
      name: { contains: args.productName },
      productCategory: {
        some: {
          merchantProductCategory: {in: args.merchantProductCategories} 
        }
      }
    }
  } else {
    var where = { merchant: args.merchantID, name: { contains: args.productName } };
  }
  
  var list = await context.prisma.product.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function productsPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [
          { name: { contains: args.filter } },
          { description: { contains: args.filter } },
        ],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.product.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const filter = args.filter ? "%" + args.filter + "%" : "%%";
  const rawCount = await context.prisma
    .$queryRaw`SELECT COUNT(*) AS count FROM product WHERE name LIKE ${filter} OR description LIKE ${filter};`;

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.count;
  });

  return {
    list,
    count,
  };
}

async function productsByMerchantPagination(parent, args, context, info) {
  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  if (args.merchantProductCategories) {
    var where = {
      merchant: args.merchantID, 
      name: { contains: args.productName },
      productCategory: {
        some: {
          merchantProductCategory: {in: args.merchantProductCategories} 
        }
      }
    }
  } else {
    var where = { merchant: args.merchantID, name: { contains: args.productName } };
  }

  const list = await productsByMerchant(parent, args, context, info);
  const count = await context.prisma.product.count({where});

  return {
    list,
    count,
  };
}

async function product(parent, args, context, info) {
  const product = await context.prisma.product.findOne({
    where: { id: args.id },
  });

  if (!product) {
    throw new Error("No such product found");
  }

  return product;
}

async function productSizes(parent, args, context, info) {
  const where = {};

  if (args.merchantProductSize || args.product || args.filter || args.isAvailable || args.merchantProductSizes) {
    where.AND = [];

    if (args.merchantProductSize) {
      where.AND.push({merchantProductSize: args.merchantProductSize});      
    }

    if (args.product) {
      where.AND.push({product: args.product});       
    }

    if (args.name) {
      where.AND.push({name: {contains: args.filter }});        
    }

    if (args.isAvailable != undefined) {
      where.AND.push({isAvailable: args.isAvailable });         
    }

    if (args.merchantProductSizes) {
      where.AND.push({merchantProductSize: {in: args.merchantProductSizes}});          
    }
  }

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "priceWithMarkUp";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.productSize.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function productSizesPagination(parent, args, context, info) {
  const where = {};

  if (args.merchantProductSize || args.product || args.filter || args.isAvailable || args.merchantProductSizes) {
    where.AND = [];

    if (args.merchantProductSize) {
      where.AND.push({merchantProductSize: args.merchantProductSize});      
    }

    if (args.product) {
      where.AND.push({product: args.product});       
    }

    if (args.name) {
      where.AND.push({name: {contains: args.filter }});        
    }

    if (args.isAvailable != undefined) {
      where.AND.push({isAvailable: args.isAvailable });         
    }

    if (args.merchantProductSizes) {
      where.AND.push({merchantProductSize: {in: args.merchantProductSizes}});          
    }
  }

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "priceWithMarkUp";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.productSize.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const count = await context.prisma.productSize.count({where});

  return {
    list,
    count,
  };
}

async function productSize(parent, args, context, info) {
  const productSize = await context.prisma.productSize.findOne({
    where: { id: args.id },
  });

  if (!productSize) {
    throw new Error("No such productSize found");
  }

  return productSize;
}

async function couponTypes(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.couponType.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function couponTypesPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.couponType.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const filter = args.filter ? "%" + args.filter + "%" : "%%";
  const rawCount = await context.prisma
    .$queryRaw`SELECT COUNT(*) AS count FROM couponType WHERE name LIKE ${filter};`;

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.count;
  });

  return {
    list,
    count,
  };
}

async function couponType(parent, args, context, info) {
  const couponType = await context.prisma.couponType.findOne({
    where: { id: args.id },
  });

  if (!couponType) {
    throw new Error("No such coupon type found");
  }

  return couponType;
}

async function couponStatuses(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.couponStatus.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function couponStatusesPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.couponStatus.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const filter = args.filter ? "%" + args.filter + "%" : "%%";
  const rawCount = await context.prisma
    .$queryRaw`SELECT COUNT(*) AS count FROM couponStatus WHERE name LIKE ${filter};`;

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.count;
  });

  return {
    list,
    count,
  };
}

async function couponStatus(parent, args, context, info) {
  const couponStatus = await context.prisma.couponStatus.findOne({
    where: { id: args.id },
  });

  if (!couponStatus) {
    throw new Error("No such coupon status found");
  }

  return couponStatus;
}

async function coupons(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.coupon.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function couponsPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.coupon.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const filter = args.filter ? "%" + args.filter + "%" : "%%";
  const rawCount = await context.prisma
    .$queryRaw`SELECT COUNT(*) AS count FROM coupon WHERE name LIKE ${filter};`;

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.count;
  });

  return {
    list,
    count,
  };
}

async function coupon(parent, args, context, info) {
  const coupon = await context.prisma.coupon.findOne({
    where: { id: args.id },
  });

  if (!coupon) {
    throw new Error("No such coupon found");
  }

  return coupon;
}

async function deliveryCounter(parent, args, context, info) {
  const deliveryCounter = await context.prisma.deliveryCounter.findOne({
    where: { id: args.id },
  });

  if (!deliveryCounter) {
    throw new Error("No such delivery counter found");
  }

  return deliveryCounter;
}

async function deliveryCounters(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ date: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "date";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.deliveryCounter.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function couponByCode(parent, args, context, info) {
  const coupon = await context.prisma.coupon.findOne({ 
    where: { code: args.code } 
  });

  if (!coupon) {
    throw new Error("No such coupon found");
  }

  return coupon;
}

async function localityByName(parent, args, context, info) {
  const locality = await context.prisma.locality.findOne({ 
    where: { name: args.name } 
  });

  if (!locality) {
    throw new Error("No such locality found");
  }

  return locality;
}

async function validCouponByCode(parent, args, context, info) {
  const coupon = await context.prisma.coupon.findOne({ 
    where: { code: args.code } 
  });
  
  if (!coupon) {
    throw new Error("No such coupon found");
  }

  const couponLocality = (coupon) ? await context.prisma.couponLocality.findMany({where: {coupon: coupon.id}}) : null;
  const merchant = await context.prisma.merchant.findOne({where: {id: args.merchantId}});

  if (isCouponValid(coupon, merchant, args.locality, couponLocality) == false) {   
    const couponMessages = isCouponValidMessages(coupon, merchant, args.locality, couponLocality);
    throw new Error(couponMessages);
  }

  return coupon;
}

async function couponLocality(parent, args, context, info) {
  const coupon = await context.prisma.couponLocality.findOne({ 
    where: { id: args.id } 
  });

  if (!coupon) {
    throw new Error("Coupon Locality id: " + args.id + " not found");
  }

  return coupon;
}

async function couponLocalityByCouponId(parent, args, context, info) {
  const coupon = await context.prisma.couponLocality.findOne({ 
    where: { coupon: args.coupon } 
  });

  if (!coupon) {
    throw new Error("Coupon id: " + args.coupon + " does not have any locality");
  }

  return coupon;
}

async function couponLocalities(parent, args, context, info) {
  var where = {};

  if (args.coupon || args.locality) {
    where = { AND: [] };

    if (args.filter) {
      where.AND.push({ coupon: { equals: args.coupon } });
    }

    if (args.locality) {
      where.AND.push({ locality: { equals: args.locality } });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.couponLocality.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  return list;
  
}

async function couponLocalitiesPagination(parent, args, context, info) {
  var where = {};

  if (args.coupon || args.locality) {
    where = { AND: [] };

    if (args.filter) {
      where.AND.push({ coupon: { equals: args.coupon } });
    }

    if (args.locality) {
      where.AND.push({ locality: { equals: args.locality } });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.couponLocality.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  const count = await context.prisma.couponLocality.count({ where });

  return {
    list,
    count,
  };
  
}

async function errand(parent, args, context, info) {
  const errand = await context.prisma.errand.findOne({ 
    where: { id: args.id } 
  });

  if (!errand) {
    var errorDetails = "No such order "+args.id+" found";
    var error = {
      details: errorDetails,
      type: "Q",
      functionName: "errand",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return errand;
}

async function errands(parent, args, context, info) {
  var where = {};
  var searchNumberOnly = parseInt(args.filter);

  if (
    searchNumberOnly ||
    args.createdAt ||
    args.updatedAt ||
    args.customerID
  ) {
    var where = { AND: [] };

    if (searchNumberOnly) {
      where.AND.push({ id: { in: searchNumberOnly } });
    }

    if (args.customerID) {
      where.AND.push({ customer: { equals: args.customerID } });
    }

    if (args.createdAt) {
      where.AND.push({
        createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") },
      });
      where.AND.push({
        createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") },
      });
    }

    if (args.updatedAt) {
      where.AND.push({
        updatedAt: { gte: new Date(args.updatedAt + "T00:00:00Z") },
      });
      where.AND.push({
        updatedAt: { lte: new Date(args.updatedAt + "T23:59:59Z") },
      });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.errand.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function errandsPagination(parent, args, context, info) {
  var where = {};
  var searchNumberOnly = parseInt(args.filter);

  if (
    searchNumberOnly ||
    args.createdAt ||
    args.updatedAt ||
    args.customerID
  ) {
    var where = { AND: [] };

    if (searchNumberOnly) {
      where.AND.push({ id: { in: searchNumberOnly } });
    }

    if (args.customerID) {
      where.AND.push({ customer: { equals: args.customerID } });
    }

    if (args.createdAt) {
      where.AND.push({
        createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") },
      });
      where.AND.push({
        createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") },
      });
    }

    if (args.updatedAt) {
      where.AND.push({
        updatedAt: { gte: new Date(args.updatedAt + "T00:00:00Z") },
      });
      where.AND.push({
        updatedAt: { lte: new Date(args.updatedAt + "T23:59:59Z") },
      });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.errand.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });
  
  var count = await context.prisma.errand.count({ where });

  return {
    list,
    count,
  };
}

async function heroes(parent, args, context, info) {
  const where = {};
  
  if (args.filter) {
    where.OR = [
      { 
        user_heroTouser: {
          OR: [
            {name: { contains: args.filter }},
            {email: { contains: args.filter }},
            {contactNumber: { contains: args.filter}},
          ]
        } 
      },
      { nbiNo: { contains: args.filter } },
      { policeClearanceNo: { contains: args.filter } },
      { plateNo: { contains: args.filter } },
      { licenseNo: { contains: args.filter } }
    ];
  }

  if (args.active !== undefined) {
    where.AND = [
      { active: args.active },
    ]; 
  }

  if (args.isAvailable !== undefined) {
    where.AND = [
      { isAvailable: args.isAvailable },
    ]; 
  }
  
  if (args.remainingCollectibles > 0) {
    where.remainingCollectibles = { gte: args.remainingCollectibles}
  } else if (args.remainingPayables === 0) {
    where.remainingCollectibles = 0;
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.hero.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function heroesPagination(parent, args, context, info) {
  const where = {};
  
  if (args.filter) {
    where.OR = [
      { 
        user_heroTouser: {
          OR: [
            {name: { contains: args.filter }},
            {email: { contains: args.filter }},
            {contactNumber: { contains: args.filter}},
          ]
        } 
      },
      { nbiNo: { contains: args.filter } },
      { policeClearanceNo: { contains: args.filter } },
      { plateNo: { contains: args.filter } },
      { licenseNo: { contains: args.filter } }
    ];
  }

  if (args.active !== undefined) {
    where.AND = [
      { active: args.active },
    ]; 
  }

  if (args.isAvailable !== undefined) {
    where.AND = [
      { isAvailable: args.isAvailable },
    ]; 
  }

  if (args.remainingCollectibles > 0) {
    where.remainingCollectibles = { gte: args.remainingCollectibles}
  } else if (args.remainingPayables === 0) {
    where.remainingCollectibles = 0;
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.hero.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const count = await context.prisma.hero.count({ where });

  return {
    list,
    count,
  };
}

async function hero(parent, args, context, info) {
  const hero = await context.prisma.hero.findOne({ where: { id: args.id } });

  if (!hero) {
    throw new Error("No such hero found");
  }

  return hero;
}

async function heroByCode(parent, args, context, info) {
  const hero = await context.prisma.hero.findOne({ where: { code: args.code } });

  if (!hero) {
    throw new Error("No such hero found");
  }

  return hero;
}

async function heroGalleries(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ hero_contains: args.filter }],
      }
    : {};

  /*const list = await context.prisma.heroGalleries({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy
  })*/
  const orderBy = {
    id: "desc",
  };

  const list = await context.prisma.heroGallery.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function heroGalleriesPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ hero_contains: args.filter }],
      }
    : {};

  const list = await context.prisma.heroGalleries({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy,
  });
  const count = await context.prisma
    .heroGalleriesConnection({
      where,
    })
    .aggregate()
    .count();
  return {
    list,
    count,
  };
}

async function heroGallery(parent, args, context, info) {
  const heroGallery = await context.prisma.heroGallery.findOne({
    where: { id: args.id },
  });

  if (!heroGallery) {
    throw new Error("No such hero gallery found");
  }

  return heroGallery;
}

async function orderStatuses(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.orderStatus.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function orderStatusesPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ name: { contains: args.filter } }],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "name";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.couponStatus.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const filter = args.filter ? "%" + args.filter + "%" : "%%";
  const rawCount = await context.prisma
    .$queryRaw`SELECT COUNT(*) AS count FROM orderStatus WHERE name LIKE ${filter};`;

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.count;
  });

  return {
    list,
    count,
  };
}

async function orderStatus(parent, args, context, info) {
  const orderStatus = await context.prisma.orderStatus.findOne({
    where: { id: args.id },
  });

  if (!orderStatus) {
    throw new Error("No such order status found");
  }

  return orderStatus;
}

/**
This function is an alternative solution for keep alive background location in Android
We got rejected in Android because of keep alive background location
This function will send updates to client-side whether there are pending orders or not
The end game is ... This function will send push notification on cron job just to make sure web socket will not disconnect
Let's make the connection still alive since we are dealing with real-time app
**/
async function ordersForCron(parent, args, context, info){
  const orders = await context.prisma.order.findMany({where: {orderStatus: {in: [1, 2, 3, 4, 5, 6]}}});

  /*if (orders.length) { 
    for (var i = 0; i < orders.length; i++) {
      console.log('order #'+orders[i].id);
      var order = {};//orders[i];
      var wordsOfWisdom = getWordsOfWisdom();
      var messageOrder = {order, wordsOfWisdom};
      
      context.pubsub.publish("UPDATED_ORDER", {updatedOrder: messageOrder});
      console.log('Zehahahaha! order #'+messageOrder.order.id);
    } 
  } else {*/
    var order = {};
    var wordsOfWisdom = getWordsOfWisdom();
    var messageOrder = {order, wordsOfWisdom};
      
    context.pubsub.publish("UPDATED_ORDER", {updatedOrder: messageOrder});
    context.pubsub.publish("ORDER_TO_ME", {orderToMe: messageOrder}); //for merchant
    context.pubsub.publish("ASSIGN_TO_HERO", {assignToHero: messageOrder}); //for rider
    context.pubsub.publish("ORDER_STATUS_CHANGED", {orderStatusChanged: messageOrder});
    //console.log('Yohohoho! No orders');
  //}
  
  await Mutation.autoMerchantConfirmed(parent, args, context, info);

  return orders;
}

async function orders(parent, args, context, info) {
  var where = {};
  var searchNumberOnly = parseInt(args.filter);

  if (
    searchNumberOnly ||
    args.createdAt ||
    args.updatedAt ||
    args.orderStatuses ||
    args.merchantID ||
    args.customerID
  ) {
    var where = { AND: [] };

    if (searchNumberOnly) {
      where.AND.push({ id: { in: searchNumberOnly } });
    }

    if (args.merchantID) {
      where.AND.push({ merchant: { equals: args.merchantID } });
    }

    if (args.customerID) {
      where.AND.push({ customer: { equals: args.customerID } });
    }

    if (args.orderStatuses) {
      where.AND.push({ orderStatus: { in: args.orderStatuses } });
    }

    if (args.createdAt) {
      where.AND.push({
        createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") },
      });
      where.AND.push({
        createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") },
      });
    }

    if (args.updatedAt) {
      where.AND.push({
        updatedAt: { gte: new Date(args.updatedAt + "T00:00:00Z") },
      });
      where.AND.push({
        updatedAt: { lte: new Date(args.updatedAt + "T23:59:59Z") },
      });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.order.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function ordersPagination(parent, args, context, info) {
  var where = {};
  var searchNumberOnly = parseInt(args.filter);

  if (
    searchNumberOnly ||
    args.createdAt ||
    args.updatedAt ||
    args.orderStatus ||
    args.orderStatuses ||
    args.merchantID ||
    args.heroID ||
    args.customerID
  ) {
    var where = { AND: [] };

    if (searchNumberOnly) {
      where.AND.push({ id: { in: searchNumberOnly } });
    }

    if (args.merchantID) {
      where.AND.push({ merchant: { equals: args.merchantID } });
    }

    if (args.customerID) {
      where.AND.push({ customer: { equals: args.customerID } });
    }

    if (args.heroID) {
      where.AND.push({ hero: { equals: args.heroID } });
    }
 
    if (args.orderStatuses) {
      if (args.orderStatus) {
        args.orderStatuses.push(args.orderStatus); 
      }

      where.AND.push({ orderStatus: { in: args.orderStatuses } });
    } else if (args.orderStatus) {
      where.AND.push({ orderStatus: { equals: args.orderStatus } });
    }

    if (args.createdAt) {
      where.AND.push({
        createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") },
      });
      where.AND.push({
        createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") },
      });
    }

    if (args.updatedAt) {
      where.AND.push({
        updatedAt: { gte: new Date(args.updatedAt + "T00:00:00Z") },
      });
      where.AND.push({
        updatedAt: { lte: new Date(args.updatedAt + "T23:59:59Z") },
      });
    }
  }

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "updatedAt";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.order.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });
  
  var sumInOneDay = args.createdAt ? args.createdAt : moment().tz('Asia/Manila').format('YYYY-MM-DD');
  
  const aggregations = await context.prisma.order.aggregate({
    sum: {
      merchantEarnings: true,
      merchantRemittance: true,
      heroEarnings: true,
      heroCollectibles: true,
      total: true,
      finalTotal: true,
    },
    where: {
      AND: [
        {orderStatus: 7},
        {createdAt: { gte: new Date(sumInOneDay+ "T00:00:00Z") }},
        {createdAt: { lte: new Date(sumInOneDay+ "T23:59:59Z") }}
      ]
    }
  });

  var count = await context.prisma.order.count({ where });
  var merchantEarnings = aggregations.sum.merchantEarnings;
  var merchantCollectibles = aggregations.sum.merchantRemittance;
  var heroRidersEarnings = aggregations.sum.heroEarnings;
  var heroCollectibles = aggregations.sum.heroCollectibles;
  var sumTotal = aggregations.sum.total;
  var sumFinalTotal = aggregations.sum.finalTotal;

  return {
    list,
    count,
    merchantEarnings,
    merchantCollectibles,
    heroRidersEarnings,
    heroCollectibles,
    sumTotal,
    sumFinalTotal,
  };
}

async function ordersByMerchant(parent, args, context, info) {
  var where = {
    AND: [{ merchant: args.merchantID }],
  };

  if (args.createdAt || args.updatedAt || args.orderStatus || args.orderStatuses) {
    if (args.orderStatuses) {
      if (args.orderStatus) {
        args.orderStatuses.push(args.orderStatus); 
      }

      where.AND.push({ orderStatus: { in: args.orderStatuses } });
    } else if (args.orderStatus) {
      where.AND.push({ orderStatus: { equals: args.orderStatus } });
    }

    if (args.createdAt) {
      where.AND.push({
        createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") },
      });
      where.AND.push({
        createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") },
      });
    }

    if (args.updatedAt) {
      where.AND.push({
        updatedAt: { gte: new Date(args.updatedAt + "T00:00:00Z") },
      });
      where.AND.push({
        updatedAt: { lte: new Date(args.updatedAt + "T23:59:59Z") },
      });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.order.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  return list;
}

async function ordersByMerchantPagination(parent, args, context, info) {
  var where = {
    AND: [{ merchant: args.merchantID }],
  };

  if (args.createdAt || args.updatedAt || args.orderStatus || args.orderStatuses) {
    if (args.orderStatuses) {
      if (args.orderStatus) {
        args.orderStatuses.push(args.orderStatus); 
      }

      where.AND.push({ orderStatus: { in: args.orderStatuses } });
    } else if (args.orderStatus) {
      where.AND.push({ orderStatus: { equals: args.orderStatus } });
    }

    if (args.createdAt) {
      where.AND.push({
        createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") },
      });
      where.AND.push({
        createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") },
      });
    }

    if (args.updatedAt) {
      where.AND.push({
        updatedAt: { gte: new Date(args.updatedAt + "T00:00:00Z") },
      });
      where.AND.push({
        updatedAt: { lte: new Date(args.updatedAt + "T23:59:59Z") },
      });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.order.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  const count = await context.prisma.order.count({ where });

  return {
    list,
    count,
  };
}

async function ordersByHero(parent, args, context, info) {
  var where = {
    AND: [{ hero: args.heroID }],
  };

  if (args.createdAt || args.updatedAt || args.orderStatus || args.orderStatuses) {
    if (args.orderStatus) {
      where.AND.push({ orderStatus: args.orderStatus });
    }

    if (args.orderStatuses) {
      where.AND.push({ orderStatus: {in: args.orderStatuses} });
    }

    if (args.createdAt) {
      where.AND.push({
        createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") },
      });
      where.AND.push({
        createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") },
      });
    }

    if (args.updatedAt) {
      where.AND.push({
        updatedAt: { gte: new Date(args.updatedAt + "T00:00:00Z") },
      });
      where.AND.push({
        updatedAt: { lte: new Date(args.updatedAt + "T23:59:59Z") },
      });
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "asc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.order.findMany({
    skip: args.skip,
    take: args.first,
    where: where,
    orderBy: orderBy,
  });

  return list;
}

async function ordersByHeroPagination(parent, args, context, info) {
  var where = {
    AND: [{ hero: args.heroID }],
  };

  if (args.createdAt || args.updatedAt || args.orderStatus || args.orderStatuses) {
    if (args.orderStatus) {
      where.AND.push({ orderStatus: args.orderStatus });
    }

    if (args.orderStatuses) {
      where.AND.push({ orderStatus: {in: args.orderStatuses} });
    }

    if (args.createdAt) {
      where.AND.push({
        createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") },
      });
      where.AND.push({
        createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") },
      });
    }

    if (args.updatedAt) {
      where.AND.push({
        updatedAt: { gte: new Date(args.updatedAt + "T00:00:00Z") },
      });
      where.AND.push({
        updatedAt: { lte: new Date(args.updatedAt + "T23:59:59Z") },
      });
    }
  }

  const list = await ordersByHero(parent, args, context, info);

  const count = await context.prisma.order.count({ where });

  return {
    list,
    count,
  };
}

async function order(parent, args, context, info) {
  const order = await context.prisma.order.findOne({ where: { id: args.id } });

  if (!order) {
    var errorDetails = "No such order "+args.id+" found";
    var error = {
      details: errorDetails,
      type: "Q",
      functionName: "order",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return order;
}

async function orderProducts(parent, args, context, info) {
  var where = {};

  if (args.order) {
    var where = { AND: [] };

    if (args.order) {
      where.AND.push({order: args.order});
    }
  }

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.orderProduct.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  if (!list) {
    var errorDetails = "No such order products found with order id "+args.order;
    var error = {
      details: errorDetails,
      type: "Q",
      functionName: "orderProducts",
    };
    await insertErrorLog(error);
    throw new Error(errorDetails);
  }

  return list;
}

async function orderProductsPagination(parent, args, context, info) {
  const where = {};

  const list = await context.prisma.orderProducts({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy,
  });
  const count = await context.prisma
    .orderProductsConnection({
      where,
    })
    .aggregate()
    .count();
  return {
    list,
    count,
  };
}

async function orderProduct(parent, args, context, info) {
  const orderProduct = await context.prisma.orderProduct.findOne({
    where: { id: args.id },
  });

  if (!orderProduct) {
    throw new Error("No such order product found");
  }

  return orderProduct;
}

async function transaksyon(parent, args, context, info) {
  const transaksyon = await context.prisma.transaksyon.findOne({
    where: { id: args.id },
  });

  if (!transaksyon) {
    throw new Error("No such transaksyon found");
  }

  return transaksyon;
}

async function transaksyons(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ status: args.filter }],
      }
    : {};

  /*const list = await context.prisma.transaksyons({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy
  })*/
  const orderBy = {
    id: "desc",
  };

  const list = await context.prisma.transaksyon.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  return list;
}

async function transaksyonsPagination(parent, args, context, info) {
  const where = args.filter
    ? {
        OR: [{ status: args.filter }],
      }
    : {};

  const list = await context.prisma.transaksyons({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy,
  });

  const count = await context.prisma
    .transaksyonsConnection({
      where,
    })
    .aggregate()
    .count();

  return {
    list,
    count,
  };
}

async function transaksyonsOfOrder(parent, args, context, info) {
  const where = { order: { id: args.order } };

  const list = await context.prisma.transaksyons({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy,
  });

  return list;
}

async function transaksyonsOfOrderPagination(parent, args, context, info) {
  const where = { order: { id: args.order } };

  const list = await context.prisma.transaksyons({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy,
  });

  const count = await context.prisma
    .transaksyonsConnection({
      where,
    })
    .aggregate()
    .count();

  return {
    list,
    count,
  };
}

async function user_by_email(parent, args, context, info) {
  const user = await context.prisma.user.findOne({
    where: { email: args.email },
  });

  if (!user) {
    throw new Error("No such user with that email found");
  }

  return user;
}

async function heroAnalytic(parent, args, context, info) {
  const where = { hero: { id: args.hero } };

  const collectible = await context.prisma
    .ordersConnection({ where })
    .aggregate()
    .count();

  return { collectible };
}

async function usersByDate(parent, args, context, info) {
  const where = args.createdAt
    ? {
        AND: [
          { createdAt: { gte: new Date(args.createdAt + "T00:00:00Z") } },
          { createdAt: { lte: new Date(args.createdAt + "T23:59:59Z") } },
        ],
      }
    : {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "createdAt";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.user.findMany({
    where,
    orderBy: orderBy,
  });

  return list;
}

async function paidPayablesOfMerchant(parent, args, context, info) {
  const where = { merchant: args.merchant };

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.paidPayable.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const rawCount = await context.prisma.$queryRaw(
    "SELECT COUNT(*) AS count FROM paidPayable WHERE merchant = " +
      args.merchant +
      ";"
  );

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.count;
  });

  return {
    list,
    count,
  };
}

async function paidCollectiblesOfHero(parent, args, context, info) {
  const where = { hero: args.hero };

  const orderByField = args.orderByField ? args.orderByField.toString() : "id";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.paidCollectible.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy: orderBy,
  });

  const rawCount = await context.prisma.$queryRaw(
    "SELECT COUNT(*) AS count FROM paidCollectible WHERE hero = " +
      args.hero +
      ";"
  );

  var count = 0;

  rawCount.forEach((raw) => {
    count = raw.count;
  });

  return {
    list,
    count,
  };
}

async function costing(parent, args, context, info) {
  const costing = await context.prisma.costing.findOne({
    where: { id: args.id },
  });

  if (!costing) {
    throw new Error("No such costing found");
  }

  return costing;
}

async function getDeliveryFee(parent, args, context, info) {
  const costing = await context.prisma.costing.findOne({ where: { id: 1 } });

  if (!costing) {
    throw new Error("No such costing found");
  }

  var distance = args.km; //2.66

  if (distance > 2) {
    // var excessKM = distance - 1;//1.66
    // var integerPart = Math.trunc(excessKM);//1
    // var decimalPart = excessKM - 1;//0.66
    // var roundedUpDecimal = Math.ceil(decimalPart / 5) * 5;//0.70
    // var roundedExcessKM = integerPart + roundedUpDecimal;//1.70

    // var deliveryFee =  config.fisrtKmCost + (costing.excessPerKmCost * roundedExcessKM) + costing.appFee;

    let deliveryFee = costing.firstKmCost + costing.appFee;
    const excessKM = distance - 2;
    const integerPart = Math.trunc(excessKM);
    const decimalPart = excessKM % 1;
    const excessKmFee = (integerPart / 0.5) * costing.excessPerKmCost;

    let excessMeterFee = 0;
    if (decimalPart > 0) {
      const decimalFixed = decimalPart.toFixed(1);
      excessMeterFee =
        decimalFixed < 0.5
          ? costing.excessPerKmCost
          : costing.excessPerKmCost * 2;
    }

    const excessFeeTotal = excessKmFee + excessMeterFee;
    deliveryFee = deliveryFee + excessFeeTotal;

    return deliveryFee;
  } else {
    var deliveryFee = costing.firstKmCost + costing.appFee;

    return deliveryFee;
  }
}

async function analytic(parent, args, context, info) {
  var myHeroAsset = 0;
  var expenses = 0;
  var netIncome = 0;
  var semicolonShare = 0;
  var myHeroEarning = 0;//this is gross
  var ramonShare = 0;
  var felixShare = 0;
  var vinceShare = 0;

  var myHeroAssetStr = withPesoSign(0);
  var expensesStr = withPesoSign(0);
  var netIncomeStr = withPesoSign(0);
  var semicolonShareStr = withPesoSign(0);
  var myHeroEarningStr = withPesoSign(0);
  var ramonShareStr = withPesoSign(0);
  var felixShareStr = withPesoSign(0);
  var vinceShareStr = withPesoSign(0);
  var deliveredOrders = 0;
  var cancelledOrders = 0;
  var noShowOrders = 0;
  var deliveredOrdersStr = withComma(0);
  var cancelledOrdersStr = withComma(0);
  var noShowOrdersStr = withComma(0);
  var ramonShareFromNet = 0;
  var felixShareFromNet = 0;
  var myHeroAssetShareFromNet = 0;
  var vinceSemicolonShare = 0;
  var vinceMyHeroEarning = 0;
  var ramonShareFromNetPercent = "0%";
  var felixShareFromNetPercent = "0%";
  var myHeroAssetShareFromNetPercent = "0%";
  var vinceSemicolonSharePercent = "0%";
  var vinceMyHeroEarningPercent = "0%";
  var felixSemicolonShare = 0;
  var felixSemicolonSharePercent = "0%";
  var ramonSemicolonShare = 0;
  var ramonSemicolonSharePercent = "0%";
  var vinceShareFromNet = 0;
  var vinceShareFromNetPercent = "0%";

  var analytic = await context.prisma.$queryRaw(
    "SELECT SUM(myHeroEarning) AS myHeroEarning, SUM(semicolonShare) AS semicolonShare, SUM(myHeroAsset) AS myHeroAsset, SUM(ramonShare) AS ramonShare, SUM(felixShare) AS felixShare, SUM(vinceShare) AS vinceShare FROM analytic WHERE createdAt BETWEEN '" +
      args.startDate +
      " 00:00:00' AND '" +
      args.endDate +
      " 23:59:59'"
  );
  analytic.forEach((raw) => {
    myHeroEarning = raw.myHeroEarning ? raw.myHeroEarning : 0;
    semicolonShare = raw.semicolonShare ? raw.semicolonShare : 0;
    vinceShare = raw.vinceShare ? raw.vinceShare : 0;
    myHeroEarningStr = withPesoSign(myHeroEarning);
    semicolonShareStr = withPesoSign(semicolonShare);
    vinceShareStr = withPesoSign(vinceShare);
  });

  var totalDeliveredOrders = await context.prisma.$queryRaw(
    "SELECT COUNT(id) AS total FROM `order` WHERE orderStatus = 7 AND (createdAt BETWEEN '" +
      args.startDate +
      " 00:00:00' AND '" +
      args.endDate +
      " 23:59:59')"
  );
  if (totalDeliveredOrders) {
    totalDeliveredOrders.forEach((raw) => {
      deliveredOrders = raw.total ? raw.total : 0;
      deliveredOrdersStr = withComma(deliveredOrders);
    });
  }

  //cancelled by customer only
  var totalCancelledOrders = await context.prisma.$queryRaw(
    "SELECT COUNT(id) AS total FROM `order` WHERE orderStatus = 9 AND (createdAt BETWEEN '" +
      args.startDate +
      " 00:00:00' AND '" +
      args.endDate +
      " 23:59:59')"
  );
  //cancelled by customer and merchant
  //var totalCancelledOrders = await context.prisma.$queryRaw("SELECT COUNT(id) AS total FROM `order` WHERE orderStatus IN (9, 10) AND (createdAt BETWEEN '"+args.startDate+" 00:00:00' AND '"+args.endDate+" 23:59:59')")
  if (totalCancelledOrders) {
    totalCancelledOrders.forEach((raw) => {
      cancelledOrders = raw.total ? raw.total : 0;
      cancelledOrdersStr = withComma(cancelledOrders);
    });
  }

  var totalNoShowOrders = await context.prisma.$queryRaw(
    "SELECT COUNT(id) AS total FROM `order` WHERE orderStatus = 8 AND (createdAt BETWEEN '" +
      args.startDate +
      " 00:00:00' AND '" +
      args.endDate +
      " 23:59:59')"
  );
  if (totalNoShowOrders) {
    totalNoShowOrders.forEach((raw) => {
      noShowOrders = raw.total ? raw.total : 0;
      noShowOrdersStr = withComma(noShowOrders);
    });
  }

  const percent = await context.prisma.percent.findOne({ where: { id: 1 } });
  if (percent) {
    ramonShareFromNet = percent.ramonShareFromNet;
    felixShareFromNet = percent.felixShareFromNet;
    vinceShareFromNet = percent.vinceShareFromNet;
    myHeroAssetShareFromNet = percent.myHeroAssetShareFromNet;
    ramonSemicolonShare = percent.ramonSemicolonShare;
    felixSemicolonShare = percent.felixSemicolonShare;
    vinceSemicolonShare = percent.vinceSemicolonShare;
    vinceMyHeroEarning = percent.vinceMyHeroEarning;
    ramonShareFromNetPercent = percent.ramonShareFromNet * 100 + "%";
    felixShareFromNetPercent = percent.felixShareFromNet * 100 + "%";
    vinceShareFromNetPercent = percent.vinceShareFromNet * 100 + "%";
    myHeroAssetShareFromNetPercent =
      percent.myHeroAssetShareFromNet * 100 + "%";
    vinceSemicolonSharePercent = percent.vinceSemicolonShare * 100 + "%";
    vinceMyHeroEarningPercent = percent.vinceMyHeroEarning * 100 + "%";
    felixSemicolonSharePercent = percent.felixSemicolonShare * 100 + "%";
    ramonSemicolonSharePercent = percent.ramonSemicolonShare * 100 + "%";
  }

  var expensesData = await context.prisma.$queryRaw(
    "SELECT SUM(amount) AS total FROM expense WHERE expenseDate BETWEEN '" +
      args.startDate +
      " 00:00:00' AND '" +
      args.endDate +
      " 23:59:59'"
  );
  if (expensesData) {
    expensesData.forEach((raw) => {
      expenses = raw.total ? raw.total : 0;
      expensesStr = withPesoSign(expenses);
      netIncome = myHeroEarning - expenses;
      netIncomeStr = withPesoSign(netIncome);
      felixShare = (netIncome * felixShareFromNet) + (felixSemicolonShare * semicolonShare);
      felixShareStr = withPesoSign(felixShare);
      ramonShare = (netIncome * ramonShareFromNet) + (ramonSemicolonShare * semicolonShare);
      ramonShareStr = withPesoSign(ramonShare);
      vinceShare = (netIncome * vinceShareFromNet) + (vinceSemicolonShare * semicolonShare);
      vinceShareStr = withPesoSign(vinceShare);
      myHeroAsset = netIncome * percent.myHeroAssetShareFromNet;
      myHeroAssetStr = withPesoSign(myHeroAsset);
    });
  }

  var result = {
    myHeroAsset,
    expenses,
    netIncome,
    semicolonShare,
    myHeroEarning,
    ramonShare,
    felixShare,
    vinceShare,
    deliveredOrders,
    cancelledOrders,
    noShowOrders,
    myHeroAssetStr,
    expensesStr,
    netIncomeStr,
    semicolonShareStr,
    myHeroEarningStr,
    ramonShareStr,
    felixShareStr,
    vinceShareStr,
    deliveredOrdersStr,
    cancelledOrdersStr,
    noShowOrdersStr,
    ramonShareFromNet,
    felixShareFromNet,
    myHeroAssetShareFromNet,
    vinceSemicolonShare,
    vinceMyHeroEarning,
    ramonShareFromNetPercent,
    felixShareFromNetPercent,
    myHeroAssetShareFromNetPercent,
    vinceSemicolonSharePercent,
    vinceMyHeroEarningPercent,
    felixSemicolonShare,
    felixSemicolonSharePercent,
    ramonSemicolonShare,
    ramonSemicolonSharePercent,
    vinceShareFromNet,
    vinceShareFromNetPercent
  };

  return result;
}

async function percent(parent, args, context, info) {
  const percent = await context.prisma.percent.findOne({
    where: { id: args.id },
  });

  if (!percent) {
    throw new Error("No such percent found");
  }

  Object.assign(percent, {
    ramonSemicolonSharePercent: percent.ramonSemicolonShare * 100 + "%",
    ramonMyHeroEarningPercent: percent.ramonMyHeroEarning * 100 + "%",
    felixSemicolonSharePercent: percent.felixSemicolonShare * 100 + "%",
    felixMyHeroEarningPercent: percent.felixMyHeroEarning * 100 + "%",
    vinceSemicolonSharePercent: percent.vinceSemicolonShare * 100 + "%",
    vinceMyHeroEarningPercent: percent.vinceMyHeroEarning * 100 + "%",
    myHeroAssetSemicolonSharePercent:
      percent.myHeroAssetSemicolonShare * 100 + "%",
    myHeroAssetMyHeroEarningPercent:
      percent.myHeroAssetMyHeroEarning * 100 + "%",
  });

  return percent;
}

async function riderReviewsPagination(parent, args, context, info) {
  const where = {};

  const orderByField = args.orderByField
    ? args.orderByField.toString()
    : "createdAt";
  const orderByDir = args.orderByDir
    ? args.orderByDir.toString().toLowerCase()
    : "desc";
  const orderBy = { [orderByField]: orderByDir };

  const list = await context.prisma.riderReview.findMany({
    skip: args.skip,
    take: args.first,
    where,
    orderBy,
  });

  const count = await context.prisma.riderReview.count({ where });

  return {
    list,
    count,
  };
}

async function riderReview(parent, args, context, info) {
  const riderReview = await context.prisma.riderReview.findOne({ where: { id: args.id } });

  if (!riderReview) {
    throw new Error("No such rider review found");
  }

  return riderReview;
}

module.exports = {
  greeting,
  aboutApp,
  users,
  usersPagination,
  user,
  user_by_email,
  usersByDate,
  categories,
  categoriesPagination,
  localities,
  localitiesPagination,
  merchants,
  merchantsPagination,
  merchant,
  merchantOperationTime,
  expenses,
  expensesPagination,
  expense,
  tags,
  tagsPagination,
  tag,
  merchantByUserId,
  merchantTags,
  merchantTagsPagination,
  merchantTag,
  merchantCategories,
  merchantCategoriesPagination,
  merchantCategory,
  merchantLocalities,
  merchantLocalitiesPagination,
  merchantLocality,
  merchantProductCategories,
  merchantProductCategoriesPagination,
  merchantProductCategory,
  merchantProductSizes,
  merchantProductSizesPagination,
  merchantProductSize,
  productCategories,
  productCategoriesPagination,
  productCategory,
  addons,
  addonsPagination,
  addon,
  productAddons,
  productAddonsPagination,
  productAddon,
  couponTypes,
  couponTypesPagination,
  couponType,
  couponStatuses,
  couponStatusesPagination,
  couponStatus,
  coupons,
  couponsPagination,
  coupon,
  couponByCode,
  deliveryCounter,
  deliveryCounters,
  localityByName,
  validCouponByCode,
  couponLocality,
  couponLocalityByCouponId,
  couponLocalities,
  couponLocalitiesPagination,
  errand,
  errands,
  errandsPagination,
  products,
  productsPagination,
  product,
  productSizes,
  productSizesPagination,
  productSize,
  productsByMerchantPagination,
  productsByMerchant,
  heroes,
  heroesPagination,
  hero,
  heroByCode,
  heroGalleries,
  heroGalleriesPagination,
  heroGallery,
  orderStatuses,
  orderStatusesPagination,
  orderStatus,
  ordersForCron,
  orders,
  ordersPagination,
  order,
  orderProducts,
  orderProductsPagination,
  orderProduct,
  ordersByMerchantPagination,
  ordersByMerchant,
  ordersByHeroPagination,
  ordersByHero,
  transaksyon,
  transaksyons,
  transaksyonsPagination,
  transaksyonsOfOrder,
  transaksyonsOfOrderPagination,
  heroAnalytic,
  paidPayablesOfMerchant,
  paidCollectiblesOfHero,
  costing,
  getDeliveryFee,
  analytic,
  percent,
  popularMerchants,
  popularMerchantsPagination,
  trendingMerchants,
  trendingMerchantsPagination,
  riderReviewsPagination,
  riderReview,
};
