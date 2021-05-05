function order(parent, args, context) {
  return context.prisma.orderAddon.findOne({where: {id: parent.id}}).order_orderToorderAddon()
}

function orderProduct(parent, args, context) {
  return context.prisma.orderAddon.findOne({where: {id: parent.id}}).orderProduct_orderAddonToorderProduct()
}

function product(parent, args, context) {
  return context.prisma.orderAddon.findOne({where: {id: parent.id}}).product_orderAddonToproduct()
}

function addon(parent, args, context) {
  return context.prisma.orderAddon.findOne({where: {id: parent.id}}).addon_addonToorderAddon()
}

module.exports = {
  order,
  orderProduct,
  product,
  addon
}