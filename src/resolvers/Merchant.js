function user(parent, args, context) {
  return context.prisma.merchant.findOne({where: {id: parent.id}}).user_merchantTouser()
}

function branch(parent, args, context) {
  return context.prisma.merchant.findOne({where: {id: parent.id}}).branch_branchTomerchant()
}

function merchantCategories(parent, args, context) {
  return context.prisma.merchant.findOne({where: {id: parent.id}}).merchantCategory()
}

function merchantLocalities(parent, args, context) {
  return context.prisma.merchant.findOne({where: {id: parent.id}}).merchantLocality()
}

function merchantTags(parent, args, context) {
  return context.prisma.merchant.findOne({where: {id: parent.id}}).merchantTag()
}

function products(parent, args, context) {
  return context.prisma.merchant.findOne({where: {id: parent.id}}).product()
}

function coupons(parent, args, context) {
  return context.prisma.merchant.findOne({where: {id: parent.id}}).coupon()
}

function deliveryCounters(parent, args, context) {
  return context.prisma.merchant.findOne({where: {id: parent.id}}).deliveryCounter()
}
/*async function transactions(parent, args, context) {
  const rawCount = await context.prisma.queryRaw("SELECT SUM(total) AS total FROM `order` WHERE merchant = "+parent.id+";")

  var count = 0;

  rawCount.forEach(raw => {
    count = raw.total;
  });  

  return count;
}

async function collections(parent, args, context) {
  const rawCount = await context.prisma.queryRaw("SELECT SUM(total) AS total FROM `order` WHERE merchant = "+parent.id+";")

  var count = 0;

  rawCount.forEach(raw => {
    count = raw.total;
  });  

  return count; 
}

async function earnings(parent, args, context) {
  const transaction = await transactions(parent, args, context);

  const merchant = await context.prisma.merchant.findOne({where: {id: parent.id}});

  var decimalMyHeroShare = 0;

  var earn = 0;

  if (merchant) {
    if (merchant.myHeroShare) {//has share 
      var myHeroDecimalShare = convertPercentToDecimal(merchant.myHeroShare);
      earn = parseFloat(transaction) * parseFloat(myHeroDecimalShare);
    } else {//no share
      const earn = await getMarkUpTotal(parent, args, context);
    }
  }

  return earn;
}

async function remittance(parent, args, context) {
  const collection = await collections(parent, args, context);
  const earning = await earnings(parent, args, context);
  const remmitanceValue = collection - earning;

  return remmitanceValue; 
}

async function remainingPayables(parent, args, context) {
  const remittanceVal = await remittance(parent, args, context);

  const merchant = await context.prisma.merchant.findOne({where: {id: parent.id}});
  const paidPayables = merchant.adminPaidPayables;

  const remainingPayables = remittanceVal - paidPayables;

  return remainingPayables;
}

async function getMarkUpTotal(parent, args, context) {
  const rawCount = await context.prisma.queryRaw("SELECT SUM(markUpTotal) AS total FROM `order` WHERE merchant = "+parent.id+";")

  var count = 0;

  rawCount.forEach(raw => {
    count = raw.total;
  });  

  return count; 
}

function convertPercentToDecimal(percent) {
  var percentToDecimal = (percent <= 9 ? '0.0'+percent : '0.'+percent);

  return percentToDecimal;
}*/

module.exports = {
  user,
  branch,
  merchantCategories,
  merchantLocalities,
  merchantTags,
  products,
  coupons,
  deliveryCounters,
  //transactions,
  //collections,
  //earnings,
  //remittance,
  //remainingPayables
}