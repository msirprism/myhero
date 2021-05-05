function order(parent, args, context) {
  return context.prisma.orderProduct.findOne({where: {id: parent.id}}).order_orderToorderProduct()
}

function product(parent, args, context) {
  return context.prisma.orderProduct.findOne({where: {id: parent.id}}).product_orderProductToproduct()
}

function coupon(parent, args, context) {
  return context.prisma.orderProduct.findOne({where: {id: parent.id}}).coupon_couponToorderProduct()
}

function orderAddons(parent, args, context) {
  return context.prisma.orderProduct.findOne({where: {id: parent.id}}).orderAddon()
}

function productSize(parent, args, context) {
  return context.prisma.orderProduct.findOne({where: {id: parent.id}}).productSize_orderProductToproductSize();
}

module.exports = {
  order,
  product,
  coupon,
  orderAddons,
  productSize,
}