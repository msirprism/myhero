function customer(parent, args, context) {
  return context.prisma.riderReview.findOne({where: {id: parent.id}}).user()
}

function hero(parent, args, context) {
  return context.prisma.riderReview.findOne({where: {id: parent.id}}).hero_heroToriderReview()
}

function merchant(parent, args, context) {
  return context.prisma.riderReview.findOne({where: {id: parent.id}}).merchant_merchantToriderReview()
}

function order(parent, args, context) {
  return context.prisma.riderReview.findOne({where: {id: parent.id}}).order_orderToriderReview()
}

module.exports = {
  customer,
  hero,
  merchant,
  order,
}