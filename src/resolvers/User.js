function merchant(parent, args, context) {
  return context.prisma.merchant.findOne({where: {user: parent.id}});
}

function hero(parent, args, context) {
  return context.prisma.hero.findOne({where: {user: parent.id}});
}

function orders(parent, args, context) {
  return context.prisma.user.findOne({where: {id: parent.id}}).orders()
}

function errands(parent, args, context) {
  return context.prisma.user.findOne({where: {id: parent.id}}).errands()
}

module.exports = {
  merchant,
  hero,
  orders,
  errands
}