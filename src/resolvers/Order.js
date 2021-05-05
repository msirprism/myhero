function customer(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).user()
}

function hero(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).hero_heroToorder()
}

function merchant(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).merchant_merchantToorder()
}

function orderStatus(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).orderStatus_orderToorderStatus()
}

function branch(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).branch_branchToorder()
}

function coupon(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).coupon_couponToorder()
}

function orderProducts(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).orderProduct()
}

function orderAddons(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).orderAddon()
}

function transaksyons(parent, args, context) {
  return context.prisma.order.findOne({where: {id: parent.id}}).transaksyon()
}

module.exports = {
  customer,
  hero,
  merchant,
  orderStatus,
  branch,
  coupon,
  orderProducts,
  orderAddons,
  transaksyons
}