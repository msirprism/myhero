function user(parent, args, context) {
  return context.prisma.hero.findOne({where: {id: parent.id}}).user_heroTouser()
}

function branch(parent, args, context) {
  return context.prisma.hero.findOne({where: {id: parent.id}}).branch_branchTohero()
}

function heroGalleries(parent, args, context) {
  return context.prisma.hero.findOne({where: {id: parent.id}}).heroGalleries()
}

function orders(parent, args, context) {
  return context.prisma.hero.findOne({where: {id: parent.id}}).orders()
}

function heroesLocation(parent, args, context) {
  return context.prisma.heroesLocation.findOne({where: {hero: parent.id}});
}

function errands(parent, args, context) {
  return context.prisma.hero.findOne({where: {id: parent.id}}).errands()
}

/*async function collectedAmount(parent, args, context) {
  const rawCount = await context.prisma.queryRaw("SELECT SUM(finalTotal) AS total FROM `order` WHERE hero = "+parent.id+";")

  var count = 0;

  rawCount.forEach(raw => {
    count = raw.total;
  });  

  return count;
}

async function earnings(parent, args, context) {
  const rawCount = await context.prisma.queryRaw("SELECT SUM(heroEarning) AS total FROM `order` WHERE hero = "+parent.id+";")

  var count = 0;

  rawCount.forEach(raw => {
    count = raw.total;
  });  

  return count;
}

async function adminCollectibles(parent, args, context) {
	const collectedAmountVal = await collectedAmount(parent, args, context);
  const earningsVal = await earnings(parent, args, context);
  const result = collectedAmountVal - earningsVal;

  return result; 
}

async function adminRemainingCollectibles(parent, args, context) {
  const collectibles = await adminCollectibles(parent, args, context);
  const hero = await context.prisma.hero.findOne({where: {id: parent.id}});
  const result = collectibles - hero.paidCollectibles;

  return result;
}
*/
module.exports = {
  user,
  branch,
  heroGalleries,
  orders,
  heroesLocation,
  errands,
  //collectedAmount,
  //earnings,
  //adminCollectibles,
  //adminRemainingCollectibles
}