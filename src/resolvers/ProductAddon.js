function merchant(parent, args, context) {
  return context.prisma.productAddon.findOne({where: {id: parent.id}}).merchant_merchantToproductAddon()
}

function product(parent, args, context) {
  return context.prisma.productAddon.findOne({where: {id: parent.id}}).product_productToproductAddon()
}

function addon(parent, args, context, info){
  return context.prisma.productAddon.findOne({where: {id: parent.id}}).addon_addonToproductAddon()	
}

module.exports = {
	merchant,
	product,
	addon,
}