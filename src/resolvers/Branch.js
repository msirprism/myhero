function merchants(parent, args, context) {
  return context.prisma.branch.findOne({where: {id: parent.id}}).merchants()
}

function heroes(parent, args, context) {
  return context.prisma.branch.findOne({where: {id: parent.id}}).heroes()
}

function orders(parent, args, context) {
  return context.prisma.branch.findOne({where: {id: parent.id}}).orders()
}

function analytics(parent, args, context) {
  return context.prisma.branch.findOne({where: {id: parent.id}}).analytics()
}

function expenses(parent, args, context) {
  return context.prisma.branch.findOne({where: {id: parent.id}}).expenses()
}

module.exports = {
  merchants,
  heroes,
  orders,
  analytics,
  expenses
}