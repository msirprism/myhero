function hero(parent, args, context) {
  return context.prisma.heroesLocation.findOne({where: {id: parent.id}}).hero_heroToheroesLocation()
}

function merchant(parent, args, context) {
  return context.prisma.heroesLocation.findOne({where: {id: parent.id}}).merchant_heroesLocationTomerchant()
}

function orderStatus(parent, args, context) {
  return context.prisma.heroesLocation.findOne({where: {id: parent.id}}).orderStatus_heroesLocationToorderStatus()
}

function branch(parent, args, context) {
  return context.prisma.heroesLocation.findOne({where: {id: parent.id}}).branch_branchToheroesLocation()
}

module.exports = {
  hero,
  merchant,
  orderStatus,
  branch,
}